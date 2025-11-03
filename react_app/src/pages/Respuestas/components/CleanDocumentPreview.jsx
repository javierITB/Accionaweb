import React, { useState, useEffect } from 'react';
import * as mammoth from 'mammoth';

const CleanDocumentPreview = ({ 
  isVisible, 
  onClose, 
  documentUrl, 
  documentType 
}) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isVisible || !documentUrl) return;

    setIsLoading(true);
    setError(null);
    setContent('');

    const loadDocument = async () => {
      try {
        if (documentType === 'txt') {
          const response = await fetch(documentUrl);
          const text = await response.text();
          setContent(text);
        } 
        else if (documentType === 'docx' || documentType === 'doc') {
          const response = await fetch(documentUrl);
          const arrayBuffer = await response.arrayBuffer();
          
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setContent(result.value);
        }
        else if (documentType === 'pdf') {
          setContent('pdf');
        }
        
      } catch (err) {
        console.error('Error loading document:', err);
        setError(`Error al cargar el documento: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [isVisible, documentUrl, documentType]);

  useEffect(() => {
    if (!isVisible) {
      setContent('');
      setIsLoading(true);
      setError(null);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando documento...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-red-600 p-8">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-lg font-medium mb-2">Error</p>
          <p className="text-sm text-center mb-4">{error}</p>
          <a
            href={documentUrl}
            download
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Descargar archivo
          </a>
        </div>
      );
    }

    switch (documentType) {
      case 'pdf':
        return (
          <div className="h-full overflow-auto bg-white">
            <object 
              data={documentUrl} 
              type="application/pdf"
              className="w-full h-full"
            >
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>No se puede mostrar la vista previa del PDF</p>
                <a 
                  href={documentUrl} 
                  download
                  className="text-blue-600 hover:underline mt-2"
                >
                  Descargar PDF
                </a>
              </div>
            </object>
          </div>
        );

      case 'docx':
      case 'doc':
        return (
          <div className="h-full overflow-auto bg-white">
            <div 
              className="docx-content p-8 max-w-4xl mx-auto"
              dangerouslySetInnerHTML={{ __html: content }}
              style={{
                fontFamily: "'Times New Roman', serif",
                lineHeight: '1.6',
                color: '#000',
                fontSize: '12pt'
              }}
            />
          </div>
        );

      case 'txt':
        return (
          <div className="h-full overflow-auto bg-white">
            <pre className="p-8 font-mono text-sm whitespace-pre-wrap bg-white max-w-4xl mx-auto">
              {content}
            </pre>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-8">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium mb-2">Formato no soportado</p>
            <p className="text-sm mb-4">La vista previa para .{documentType} no está disponible</p>
            <a
              href={documentUrl}
              download
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Descargar archivo
            </a>
          </div>
        );
    }
  };

  return (
    <>
      {isVisible && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" 
          onClick={onClose}
        />
      )}
      
      {isVisible && (
        <div className="fixed inset-4 z-50 bg-white rounded-lg shadow-xl flex flex-col">
          <div className="flex justify-end p-2 border-b">
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Cerrar vista previa"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-auto bg-gray-50">
            {renderContent()}
          </div>
        </div>
      )}
    </>
  );
};

export default CleanDocumentPreview;