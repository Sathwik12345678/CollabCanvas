import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-400 mb-6">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={this.resetError}
              className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition"
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="ml-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
