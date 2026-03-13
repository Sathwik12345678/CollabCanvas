import { Link, useLocation } from "react-router-dom";

function TopNav() {
  const location = useLocation();

  const isAuth = ["/login", "/signup"].includes(location.pathname);

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 z-20">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/40">
          <span className="text-xs font-bold tracking-widest text-white">
            CC
          </span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-slate-50">
            CollabCanvas
          </span>
          <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
            Live whiteboard
          </span>
        </div>
      </Link>

      <nav className="flex items-center gap-3 text-xs">
        {isAuth ? (
          <>
            {location.pathname === "/login" && (
              <Link
                to="/signup"
                className="px-3 py-1.5 rounded-full border border-white/10 text-slate-200 hover:bg-white/5"
              >
                Create account
              </Link>
            )}
            {location.pathname === "/signup" && (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-full border border-white/10 text-slate-200 hover:bg-white/5"
              >
                Sign in
              </Link>
            )}
          </>
        ) : (
          <span className="hidden sm:inline-flex items-center rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-[11px] tracking-[0.18em] uppercase text-slate-300">
            Real-time collaboration
          </span>
        )}
      </nav>
    </header>
  );
}

export default TopNav;

