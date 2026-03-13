import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import { authAPI } from "../api/api";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      const res = await authAPI.login(email, password);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("name", res.data.name);
      localStorage.setItem("userId", res.data.userId);

      navigate("/app");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Login failed. Please try again.";
      setError(errorMsg);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-950 to-black relative overflow-hidden page-fade">
      {/* Background glow */}
      <div className="bg-glow bg-glow-indigo -top-24 -left-40" />
      <div className="bg-glow bg-glow-purple -bottom-32 -right-40" />

      <TopNav />

      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        {/* Card */}
        <div className="relative glass glass-lift card-premium w-96 max-w-full fade-up">
          <h2 className="text-2xl font-semibold text-center mb-2">
            Welcome back
          </h2>
          <p className="text-center text-sm text-gray-400 mb-6">
            Sign in to continue collaborating.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              className="input-premium"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />

            <input
              className="input-premium"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-400/10 p-3 rounded">
                {error}
              </div>
            )}

            <button
              className={`btn-premium mt-2 btn-press ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={loading}
              type="submit"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 transition">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;