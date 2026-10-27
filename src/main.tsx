import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installIconRubber } from "./lib/iconRubber";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root not found");
}

installIconRubber();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
