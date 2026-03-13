import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import AppEntry from "./pages/AppEntry";
import Room from "./pages/Room";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="w-full min-h-screen flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/app" element={<AppEntry />} />
            <Route path="/room/:id" element={<Room />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-gray-400 mb-6">Page not found</p>
        <a
          href="/"
          className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

export default App;