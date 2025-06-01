import React, { useState, useRef, useCallback } from "react";
import { PDFConverter } from "../components/PDFConverter";

export default function PopupPage() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <PDFConverter />
    </div>
  );
}
