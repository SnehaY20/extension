import React from "react";
import { PDFConverter } from "../components/PDFConverter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            PDF to Image Converter
          </h1>
          <p className="text-gray-600">Development Preview</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <PDFConverter />
        </div>
      </div>
    </div>
  );
}
