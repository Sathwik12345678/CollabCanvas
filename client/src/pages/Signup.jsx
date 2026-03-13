import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import { authAPI } from "../api/api";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!form.name || !form.email || !form.password) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      const res = await authAPI.signup(form.name, form.email, form.password);

      setSuccess(res.data.message || "Account created successfully!");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Signup failed. Please try again.";
      setError(errorMsg);
      console.error("Signup error:", err);
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
          <h2 className="text-2xl font-semibold text-center mb-1">
            Create account
          </h2>
          <p className="text-sm text-gray-400 text-center mb-6">
            Join CollabCanvas in seconds.
          </p>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <input
              className="input-premium"
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={handleChange}
              disabled={loading}
              required
            />

            <input
              className="input-premium"
              name="email"
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
              required
            />

            <input
              className="input-premium"
              name="password"
              type="password"
              placeholder="Password (min. 6 characters)"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              required
            />

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-400/10 p-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-400 text-sm text-center bg-green-400/10 p-3 rounded">
                {success}
              </div>
            )}

            <button
              className={`btn-premium mt-2 btn-press ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={loading}
              type="submit"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;