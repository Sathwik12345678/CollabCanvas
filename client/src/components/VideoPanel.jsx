import { useEffect, useRef, useState } from "react";
import { socket } from "../socket/socket";

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// Ensures remote video element always has the correct stream (avoids ref-callback ordering issues)
function RemoteVideo({ id, stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    const play = () => video.play().catch(() => {});
    stream.getVideoTracks()[0]?.addEventListener("ended", () => { video.srcObject = null; });
    play();
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  return (
    <div className="relative w-full aspect-video min-h-[90px] rounded-lg overflow-hidden bg-black">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <span className="absolute bottom-1 left-1 text-[10px] text-white/80 truncate max-w-full px-1 bg-black/40 rounded">
        {id ? `Peer · ${String(id).slice(0, 6)}` : "Peer"}
      </span>
    </div>
  );
}

function VideoPanel({ roomId }) {
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const iceQueueRef = useRef({}); // userId -> [candidates]
  const roomIdRef = useRef(roomId);

  const [remoteStreams, setRemoteStreams] = useState([]);
  const [localReady, setLocalReady] = useState(false);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  // ===== Get Camera and request users only after we're ready =====
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setLocalReady(true);
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    start();
    return () => {
      cancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  // When local stream is ready, request other users in the room
  useEffect(() => {
    if (!localReady || !roomId) return;
    const request = () => socket.emit("get-users", roomId);
    if (socket.connected) request();
    else socket.once("connect", request);
    return () => socket.off("connect", request);
  }, [localReady, roomId]);

  // ===== Peer Logic =====
  const createPeer = (userId) => {
    if (peersRef.current[userId]) return peersRef.current[userId];
    const peer = new RTCPeerConnection(config);

    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });
    }

    peer.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (!remoteStream) return;
      setRemoteStreams((prev) => {
        if (prev.some((p) => p.id === userId)) return prev;
        return [...prev, { id: userId, stream: remoteStream }];
      });
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          target: userId,
          candidate: event.candidate,
          roomId: roomIdRef.current
        });
      }
    };

    peersRef.current[userId] = peer;
    return peer;
  };

  const applyIceQueue = (userId, peer) => {
    const queue = iceQueueRef.current[userId] || [];
    iceQueueRef.current[userId] = [];
    queue.forEach((candidate) => {
      peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    });
  };

  // ===== Socket Events =====
  useEffect(() => {
    const handleAllUsers = (users) => {
      (users || []).forEach((user) => {
        const userId = user.id || user;
        const peer = createPeer(userId);
        peer.createOffer().then((offer) => {
          peer.setLocalDescription(offer);
          socket.emit("offer", {
            target: userId,
            sdp: offer,
            roomId: roomIdRef.current
          });
        });
      });
    };

    const handleOffer = async ({ caller, sdp }) => {
      const peer = createPeer(caller);
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(sdp));
        applyIceQueue(caller, peer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("answer", {
          target: caller,
          sdp: answer,
          roomId: roomIdRef.current
        });
      } catch (e) {
        console.error("Offer handling error:", e);
      }
    };

    const handleAnswer = async ({ id, sdp }) => {
      const peer = peersRef.current[id];
      if (!peer) return;
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(sdp));
        applyIceQueue(id, peer);
      } catch (e) {
        console.error("Answer handling error:", e);
      }
    };

    const handleIce = ({ from, candidate }) => {
      const peer = peersRef.current[from];
      const iceCandidate = new RTCIceCandidate(candidate);
      if (peer && peer.remoteDescription) {
        peer.addIceCandidate(iceCandidate).catch(() => {});
      } else {
        if (!iceQueueRef.current[from]) iceQueueRef.current[from] = [];
        iceQueueRef.current[from].push(candidate);
      }
    };

    const handleUserLeft = (id) => {
      if (peersRef.current[id]) {
        peersRef.current[id].close();
        delete peersRef.current[id];
      }
      delete iceQueueRef.current[id];
      setRemoteStreams((prev) => prev.filter((p) => p.id !== id));
    };

    socket.on("all-users", handleAllUsers);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIce);
    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("all-users", handleAllUsers);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIce);
      socket.off("user-left", handleUserLeft);
    };
  }, []);

  return (
    <div className="glass panel-premium shadow-xl w-[280px] p-3 rounded-2xl">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
          Live video
        </span>
        <span className="text-[10px] text-slate-500">
          {remoteStreams.length + 1} in call
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative w-full aspect-video min-h-[80px] rounded-lg overflow-hidden bg-black">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-1 left-1 text-[10px] text-white/80 px-1 bg-black/40 rounded">
            You
          </span>
        </div>
        {remoteStreams.map((user) => (
          <RemoteVideo key={user.id} id={user.id} stream={user.stream} />
        ))}
      </div>
    </div>
  );
}

export default VideoPanel;