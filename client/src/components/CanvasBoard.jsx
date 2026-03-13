import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../socket/socket";

function CanvasBoard({ roomId, canDraw = true }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const drawingRef = useRef(false);

  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(2);
  const [cursors, setCursors] = useState({});

  // ===== Drawing =====
  const drawLine = useCallback((x1, y1, x2, y2, strokeColor, strokeSize) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeSize;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }, []);

  // ===== Canvas Setup =====
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctxRef.current = ctx;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ===== Socket Events =====
  useEffect(() => {
    const onDrawing = (data) => {
      drawLine(data.prevX, data.prevY, data.x, data.y, data.color, data.size);
    };

    const onClear = () => {
      const canvas = canvasRef.current;
      ctxRef.current?.clearRect(0, 0, canvas.width, canvas.height);
    };

    const onCursor = ({ id, x, y }) => {
      setCursors((prev) => ({ ...prev, [id]: { x, y } }));
    };

    const onLeft = (id) => {
      setCursors((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    };

    socket.on("drawing", onDrawing);
    socket.on("clear-board", onClear);
    socket.on("cursor-move", onCursor);
    socket.on("user-left", onLeft);

    return () => {
      socket.off("drawing", onDrawing);
      socket.off("clear-board", onClear);
      socket.off("cursor-move", onCursor);
      socket.off("user-left", onLeft);
    };
  }, [drawLine]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const start = (e) => {
    if (!canDraw) return;
    drawingRef.current = true;
    lastPos.current = getPos(e);
  };

  const stop = () => (drawingRef.current = false);

  const move = (e) => {
    const { x, y } = getPos(e);

    // cursor sync
    socket.emit("cursor-move", { roomId, id: socket.id, x, y });

    if (!drawingRef.current || !canDraw) return;

    drawLine(lastPos.current.x, lastPos.current.y, x, y, color, size);

    socket.emit("drawing", {
      roomId,
      prevX: lastPos.current.x,
      prevY: lastPos.current.y,
      x,
      y,
      color,
      size
    });

    lastPos.current = { x, y };
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear-board", roomId);
  };

  return (
    <div className="absolute inset-0">
      {canDraw && (
        <div
          className="absolute top-3 left-3 z-10 flex items-center gap-3 px-3 py-2 rounded-2xl glass border border-white/10 shadow-lg"
        >
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-9 h-9 rounded-lg cursor-pointer border border-white/20 bg-white/10"
            title="Color"
          />
          <input
            type="range"
            min={1}
            max={12}
            value={size}
            onChange={(e) => setSize(+e.target.value)}
            className="w-24 h-1.5 rounded-lg accent-indigo-500"
            title="Brush size"
          />
          <span className="text-[11px] text-slate-500 w-5 text-center tabular-nums">{size}</span>
          <button
            type="button"
            onClick={clearBoard}
            className="btn-premium text-sm py-1.5 px-3"
          >
            Clear
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 bg-white touch-none"
        style={{ cursor: canDraw ? "crosshair" : "default" }}
        onMouseDown={start}
        onMouseUp={stop}
        onMouseLeave={stop}
        onMouseMove={move}
      />

      {Object.entries(cursors).map(([id, c]) => (
        <div
          key={id}
          className="absolute w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow pointer-events-none"
          style={{ left: c.x, top: c.y, transform: "translate(-50%, -50%)" }}
        />
      ))}
    </div>
  );
}

export default CanvasBoard;