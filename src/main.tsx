import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { TtsProvider } from "./contexts/TtsContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TtsProvider>
      <App />
    </TtsProvider>
  </React.StrictMode>
);
