import React, { useState, useEffect, useRef } from 'react';
import * as mammoth from 'mammoth';
import { apiFetch } from 'utils/api';

const CleanDocumentPreview = ({
    isVisible,
    onClose,
    documentUrl,
    documentType
}) => {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDownloadingItem, setIsDownloadingItem] = useState(false);

    const handleSecureDownload = async (e) => {
        e.preventDefault();
        try {
            setIsDownloadingItem(true);
            const response = await apiFetch(documentUrl);
            if (!response.ok) throw new Error("Error en la descarga");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;

            let filename = "documento";
            const disposition = response.headers.get("Content-Disposition");
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            } else {
                if (documentType) filename += `.${documentType}`;
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Error al descargar:", error);
            alert("Error al descargar el documento");
        } finally {
            setIsDownloadingItem(false);
        }
    };

    // 1. Nuevo estado para controlar la pestaña activa ('preview' o 'respuestas')
    const [activeTab, setActiveTab] = useState('preview');

    useEffect(() => {
        if (!isVisible || !documentUrl) return;

        setIsLoading(true);
        setError(null);
        setContent('');

        const loadDocument = async () => {
            try {
                if (documentType === 'txt') {
                    const response = await apiFetch(documentUrl);
                    const text = await response.text();
                    setContent(text);
                }
                else if (documentType === 'docx' || documentType === 'doc') {
                    const response = await apiFetch(documentUrl);
                    const arrayBuffer = await response.arrayBuffer();

                    const result = await mammoth.convertToHtml({
                        arrayBuffer
                    }, {
                        // UPGRADE: Mapeo :fresh para que respete el orden y no junte párrafos
                        styleMap: [
                            "p[style-name='Title'] => h1:fresh",
                            "p[style-name='Heading 1'] => h2:fresh",
                            "p => p:fresh",
                            "table => table:fresh"
                        ],
                        preserveHardBreaks: true,
                        includeDefaultStyleMap: true
                    });

                    // UPGRADE: Aplicamos estilos al HTML para centrar título, controlar logo y evitar desbordes
                    let processedContent = result.value
                        .replace(/<h1>/g, '<h1 style="font-size: 22pt; font-weight: bold; text-align: center; margin-bottom: 24pt; display: block; clear: both;">')
                        .replace(/<h2>/g, '<h2 style="font-size: 16pt; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-top: 18pt; margin-bottom: 12pt; display: block; clear: both; word-break: break-word;">')
                        .replace(/<p>/g, '<p style="margin-bottom: 12pt; line-height: 1.6; text-align: justify; display: block; clear: both; word-break: break-word; overflow-wrap: break-word;">')
                        .replace(/<table>/g, '<table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0; table-layout: fixed; word-wrap: break-word;">')
                        .replace(/<td>/g, '<td style="border: 1px solid #d1d1d1; padding: 8px; vertical-align: top; word-break: break-word; overflow-wrap: break-word;">')
                        .replace(/<img/g, '<img style="max-width: 160px; height: auto; float: left; margin: 0 1.5rem 1rem 0; clear: both;"');

                    setContent(processedContent);
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
            // Reiniciamos a la pestaña de vista previa cada vez que se abre el modal
            setActiveTab('preview');
        }
    }, [isVisible]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isVisible) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    // 2. Nueva función para renderizar el contenido de la pestaña Respuestas
    const renderRespuestas = () => {
        return (
            <div className="h-full overflow-auto bg-white dark:bg-black p-6">
                <div className="max-w-4xl mx-auto">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                        Detalle de Respuestas
                    </h3>
                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        </p>
                        <br />
                        <p>
                            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                        </p>
                        <br />
                        <p>
                            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const renderPreviewContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col sm:flex-row justify-center items-center h-48 sm:h-64 p-4">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mb-3 sm:mb-0 sm:mr-3"></div>
                    <span className="text-sm sm:text-base text-gray-600 text-center sm:text-left">
                        Cargando documento...
                    </span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-red-600 p-4 sm:p-8 text-center">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-center">Error al cargar</p>
                    <p className="text-xs sm:text-sm text-center mb-3 sm:mb-4 max-w-md">{error}</p>
                    <button
                        onClick={handleSecureDownload}
                        disabled={isDownloadingItem}
                        className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm sm:text-base disabled:opacity-50"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {isDownloadingItem ? "Descargando..." : "Descargar archivo"}
                    </button>
                </div>
            );
        }

        switch (documentType) {
            case 'pdf':
                return (
                    <div className="h-full flex flex-col overflow-hidden">
                        <div className="flex-1 bg-white">
                            <object
                                data={`${documentUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                                type="application/pdf"
                                className="w-full h-full"
                                style={{ height: 'calc(100%)' }}
                            >
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
                                    <p className="text-sm sm:text-base mb-2">No se puede mostrar la vista previa del PDF</p>
                                    <button onClick={handleSecureDownload} disabled={isDownloadingItem} className="text-blue-600 hover:underline disabled:opacity-50">
                                        {isDownloadingItem ? "Descargando..." : "Descargar PDF"}
                                    </button>
                                </div>
                            </object>
                        </div>
                    </div>
                );
            case 'docx':
            case 'doc':
                return (
                    <div className="h-full overflow-auto bg-gray-200 p-4 md:p-8">
                        <div
                            className="mx-auto bg-white shadow-2xl mb-10"
                            style={{
                                width: '210mm',
                                maxWidth: '100%',
                                minHeight: '297mm',
                                padding: '25mm 25mm',
                                boxSizing: 'border-box',
                                fontFamily: "'Times New Roman', serif",
                                color: '#000',
                            }}
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    </div>
                );

            case 'txt':
                return (
                    <div className="h-full overflow-auto bg-white dark:bg-black">
                        <pre className="dark:bg-black p-3 sm:p-4 md:p-6 font-mono text-xs sm:text-sm whitespace-pre-wrap bg-white max-w-full lg:max-w-6xl mx-auto">
                            {content}
                        </pre>
                    </div>
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-gray-500 p-4 sm:p-8 text-center">
                        <p className="text-base font-medium">Formato no soportado</p>
                        <button onClick={handleSecureDownload} disabled={isDownloadingItem} className="text-blue-600 hover:underline disabled:opacity-50">
                            {isDownloadingItem ? "Descargando..." : "Descargar archivo"}
                        </button>
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
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-black rounded-lg sm:rounded-xl shadow-xl flex flex-col w-[98vw] h-[95vh] sm:w-[95vw] sm:h-[90vh] max-w-6xl mx-2 sm:mx-4 overflow-hidden">

                    {/* Header */}
                    <div className="flex justify-between items-center px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-black">

                        <div className="flex items-center space-x-6 min-w-0 flex-1 h-12">
                            <button
                                onClick={() => setActiveTab('preview')}
                                className={`h-full flex items-center space-x-2 border-b-2 px-1 transition-colors ${activeTab === 'preview'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                title="Vista Previa del Documento"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span className="text-sm font-medium">Vista Previa</span>
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 ml-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                            title="Cerrar"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
                        {activeTab === 'preview' ? renderPreviewContent() : renderRespuestas()}
                    </div>

                    {activeTab === 'preview' && (
                        <div className="sm:hidden bg-white dark:bg-black border-t border-gray-200 dark:border-gray-700 p-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">
                                    {documentType?.toUpperCase()}
                                </span>
                                <button
                                    onClick={handleSecureDownload}
                                    disabled={isDownloadingItem}
                                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs disabled:opacity-50"
                                >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {isDownloadingItem ? "Descargando..." : "Descargar"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default CleanDocumentPreview;