import React from "react";
import ReactDOM from "react-dom/client";
import { PDFConverter } from "../components/PDFConverter";
import "../styles/globals.css"; // Import global styles

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <PDFConverter />
    </React.StrictMode>
  );
}
