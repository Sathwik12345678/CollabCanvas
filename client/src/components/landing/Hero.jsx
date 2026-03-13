import { useNavigate } from "react-router-dom";
import "../../styles/landing.css";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero-container">
      {/* =========================
         VIDEO BACKGROUND (Cinematic)
      ========================== */}
      <video
        className="video-bg"
        src="/videos/bg.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Cinematic overlays for blending */}
      <div className="video-overlay"></div>
      <div className="video-glow"></div>

      {/* =========================
         MESH LAYERS (Premium depth)
      ========================== */}
      <div className="mesh mesh-1"></div>
      <div className="mesh mesh-2"></div>
      <div className="mesh mesh-3"></div>
      <div className="center-glow"></div>

      {/* Noise texture */}
      <div className="noise-layer"></div>

      {/* =========================
         CONTENT
      ========================== */}
      <div className="hero-content">
        <h1 className="hero-title font-serif">
          Collaborate on Canvas in Real Time
        </h1>

        <p className="hero-subtitle">
          Draw, brainstorm, and collaborate instantly with CollabCanvas.
        </p>

        <div className="hero-buttons">
          <button
            onClick={() => navigate("/app")}
            className="clau-get-started-btn"
          >
            Get Started
          </button>

          <a href="#features" className="learn-btn">
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}