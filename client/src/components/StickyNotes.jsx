import { useState, useEffect } from "react";
import { socket } from "../socket/socket";

function StickyNotes({ roomId }) {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    socket.on("add-note", (note) => {
      setNotes((prev) => [...prev, note]);
    });

    socket.on("move-note", (data) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === data.id ? { ...n, x: data.x, y: data.y } : n
        )
      );
    });

    socket.on("update-note", (data) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === data.id ? { ...n, text: data.text } : n
        )
      );
    });

    socket.on("delete-note", (id) => {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    });

    return () => {
      socket.off("add-note");
      socket.off("move-note");
      socket.off("update-note");
      socket.off("delete-note");
    };
  }, []);

  // Create note
  const createNote = () => {
    const note = {
      id: Date.now(),
      roomId,
      x: 120,
      y: 80,
      text: ""
    };

    setNotes((prev) => [...prev, note]);
    socket.emit("add-note", note);
  };

  // Move note
  const moveNote = (id, e) => {
    const workspace = e.target.closest(".workspace");
    const rect = workspace.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, x, y } : n
      )
    );

    socket.emit("move-note", { roomId, id, x, y });
  };

  const updateText = (id, text) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, text } : n
      )
    );

    socket.emit("update-note", { roomId, id, text });
  };

  const deleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));

    // IMPORTANT: send roomId also
    socket.emit("delete-note", { roomId, id });
  };

  return (
    <>
      {/* Add Note Button */}
      <button
        type="button"
        onClick={createNote}
        className="btn-premium btn-press text-xs font-medium absolute top-3 right-4 z-40 shadow-lg"
      >
        + Note
      </button>

      {notes.map((note) => (
        <div
          key={note.id}
          draggable
          onDragEnd={(e) => moveNote(note.id, e)}
          style={{
            position: "absolute",
            left: note.x,
            top: note.y,
            width: 200,
            minHeight: 150,
            background: "rgba(15, 23, 42, 0.96)",
            borderRadius: 12,
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.9)",
            border: "1px solid rgba(148, 163, 184, 0.38)",
            padding: 10,
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            backdropFilter: "blur(10px)",
            color: "#e5e7eb"
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
              cursor: "move"
            }}
          >
            <span style={{ fontSize: 11, fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", color: "#a5b4fc" }}>
              Sticky note
            </span>

            {/* Delete Button */}
            <button
              onClick={() => deleteNote(note.id)}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "none",
              background: "linear-gradient(135deg,#f97373,#ef4444)",
                color: "white",
                cursor: "pointer",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ×
            </button>
          </div>

          {/* Text Area */}
          <textarea
            value={note.text}
            onChange={(e) => updateText(note.id, e.target.value)}
            placeholder="Write something..."
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              resize: "none",
              outline: "none",
              fontSize: 14
            }}
          />
        </div>
      ))}
    </>
  );
}

export default StickyNotes;
