import { useNavigate } from "react-router-dom";

const features = [
  {
    title: "Real-time drawing",
    desc: "Ultra-low latency strokes with live cursor presence for every participant.",
  },
  {
    title: "Chat + sticky notes",
    desc: "Keep decisions close to the canvas with threaded thinking and quick callouts.",
  },
  {
    title: "Built-in party game",
    desc: "Turn collaboration into energy: drawing rounds, timers, and live scoring.",
  },
  {
    title: "Video call overlay",
    desc: "Talk while you build—floating video tiles that don’t steal your workspace.",
  },
];

export default function Features() {
  const navigate = useNavigate();

  return (
    <section id="features" className="relative overflow-hidden bg-[#07070a]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="bg-glow bg-glow-indigo -top-40 -left-56 opacity-60" />
        <div className="bg-glow bg-glow-purple -bottom-56 -right-56 opacity-60" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-20">
        <div className="flex flex-col items-center text-center gap-3 mb-10">
          <span className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
            Designed to feel premium
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Everything you need to collaborate—instantly
          </h2>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl">
            No clutter. No setup headaches. Just a beautiful canvas with the essentials built in.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass glass-lift card-premium p-5 rounded-2xl border border-white/10"
            >
              <div className="text-white font-semibold mb-2">{f.title}</div>
              <div className="text-sm text-slate-400 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            className="btn-premium btn-press px-6 py-3 rounded-xl text-sm"
            onClick={() => navigate("/app")}
          >
            Launch CollabCanvas
          </button>
          <a
            href="/login"
            className="px-6 py-3 rounded-xl text-sm border border-white/10 text-slate-200 hover:bg-white/5 transition"
          >
            Sign in
          </a>
        </div>
      </div>
    </section>
  );
}

