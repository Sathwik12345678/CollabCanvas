import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./index.css";              // Tailwind
import "./styles/premium.css";
import "./styles/animation.css";
import "./styles/landing.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);