import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { renderAsync } from "docx-preview"; // 👈 Importa la librería

const DocxPreviewModal = ({ IDdoc, isVisible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isVisible || !IDdoc) return;

    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://accionaapi.vercel.app/api/generador/preview/${IDdoc}`
        );
        const data = await res.json();

        if (!data?.base64) {
          setError("El documento no contiene datos válidos.");
          return;
        }

        // 🔹 Convertir base64 a Blob
        const byteCharacters = atob(data.base64);
        const byteNumbers = Array.from(byteCharacters, (c) => c.charCodeAt(0));
        const blob = new Blob([new Uint8Array(byteNumbers)], {
          type:
            data.contentType ||
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // 🔹 Renderizar el DOCX dentro del contenedor
        if (containerRef.current) {
          containerRef.current.innerHTML = ""; // Limpia contenido previo
          await renderAsync(blob, containerRef.current);
        }
      } catch (err) {
        console.error("Error cargando vista previa:", err);
        setError("No se pudo cargar la vista previa del documento.");
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [IDdoc, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="relative bg-white/95 rounded-2xl shadow-2xl max-w-4xl w-full p-6 overflow-hidden"
      >
        <button
          className="absolute top-3 right-3 bg-black/20 text-white rounded-full px-3 py-1 hover:bg-black/40 transition"
          onClick={onClose}
        >
          ✕
        </button>

        {loading ? (
          <div className="text-center text-gray-600">Cargando vista previa...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <div
            ref={containerRef}
            className="docx-content-container-skip-preflight w-full h-[70vh] overflow-auto rounded-lg border border-gray-200 bg-white shadow-inner p-4"
            style={{ minHeight: "400px" }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default DocxPreviewModal;
