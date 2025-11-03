import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { renderAsync } from "docx-preview"; // 👈 Para DOCX

/**
 * Componente modal para previsualizar archivos DOCX o PDF.
 * @param {string} IDdoc - ID del documento a previsualizar.
 * @param {boolean} isVisible - Controla si el modal está visible.
 * @param {function} onClose - Función para cerrar el modal.
 * @param {'docx' | 'pdf'} fileType - Tipo de archivo a previsualizar ('docx' o 'pdf').
 */
const FilePreviewModal = ({ IDdoc, isVisible, onClose, fileType, data }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null); // Nuevo estado para la URL del PDF
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isVisible || !IDdoc || !fileType) {
        // Limpia la URL del PDF al cerrarse o si los datos no son válidos
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
        return;
    }

    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      
      // Limpia la URL del PDF antes de una nueva carga
      if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
      }
      
      try {
        ;
        let expectedType = '';

        if (fileType === 'docx') {
            // El endpoint actual /preview/:IDdoc ya devuelve base64 para DOCX
            
            expectedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (fileType === 'pdf') {
            // Asumiendo un nuevo endpoint para obtener el PDF
            // *Basado en tu lógica de API, usaremos el endpoint de descarga
            // *para simplificar y luego extraer el buffer.
            
            expectedType = 'application/pdf';
        } else {
            setError("Tipo de archivo no soportado.");
            return;
        }


        if (containerRef.current) {
            containerRef.current.innerHTML = ""; // Limpia contenido previo
        }
        
        // 1. OBTENER EL DOCUMENTO
        const res = data;

        if (!res.ok) {
             // Intenta leer el cuerpo como JSON para obtener el error del servidor
            try {
                const errorData = await res.json();
                setError(`Error ${res.status}: ${errorData.error || 'No se pudo cargar el documento.'}`);
            } catch {
                 setError(`Error ${res.status}: No se pudo cargar el documento.`);
            }
            return;
        }


        // 2. PROCESAR SEGÚN EL TIPO DE ARCHIVO
        if (fileType === 'docx') {
            // Lógica existente para DOCX (asume que la API devuelve JSON con base64)
            const data = await res.json(); 

            if (!data?.base64) {
              setError("El documento DOCX no contiene datos base64 válidos.");
              return;
            }
            
            // Convertir base64 a Blob
            const byteCharacters = atob(data.base64);
            const byteNumbers = Array.from(byteCharacters, (c) => c.charCodeAt(0));
            const blob = new Blob([new Uint8Array(byteNumbers)], {
              type: data.contentType || expectedType,
            });

            // Renderizar el DOCX
            if (containerRef.current) {
              await renderAsync(blob, containerRef.current);
            }

        } else if (fileType === 'pdf') {
            // Lógica para PDF (asume que la API devuelve el BLOB/Buffer directamente)
            // *NOTA: Este fetch debe ser al endpoint que devuelve el PDF binario (ej. /download-approved-pdf/:responseId),
            // *el cual, según tu API, devuelve el buffer con Content-Type: application/pdf.

            const blob = await res.blob();
            
            if (blob.type !== expectedType) {
                 setError(`El archivo no es un PDF. Tipo detectado: ${blob.type}`);
                 return;
            }

            // Crear una URL temporal para el Blob del PDF
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
        }

      } catch (err) {
        console.error("Error cargando vista previa:", err);
        setError(`No se pudo cargar la vista previa del documento ${fileType.toUpperCase()}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
    
    // Función de limpieza para liberar la URL del objeto Blob
    return () => {
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
        }
    };
  }, [IDdoc, isVisible, fileType]); // Asegúrate de incluir fileType

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

        <h2 className="text-xl font-bold mb-4 text-gray-800">Vista Previa: {fileType?.toUpperCase()}</h2>

        {loading ? (
          <div className="text-center text-gray-600 h-[70vh] flex items-center justify-center">Cargando vista previa...</div>
        ) : error ? (
          <div className="text-center text-red-600 h-[70vh] flex items-center justify-center">{error}</div>
        ) : fileType === 'pdf' && pdfUrl ? (
          // Contenedor para PDF (usa iframe)
          <div className="w-full h-[70vh] rounded-lg border border-gray-200 bg-white shadow-inner p-1">
             <iframe 
                src={pdfUrl} 
                className="w-full h-full border-none" 
                title="Vista Previa de PDF"
             />
          </div>
        ) : (
          // Contenedor para DOCX
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

export default FilePreviewModal;