import React from "react";
import ReactDOM from "react-dom/client";
import PDFConverter from "../pages/index.js"; // Assuming PDFConverter is exported from index.js

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <PDFConverter />
  </React.StrictMode>
);
