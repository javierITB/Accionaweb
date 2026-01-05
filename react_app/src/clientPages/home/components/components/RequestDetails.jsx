import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { apiFetch, API_BASE_URL } from '../../../../utils/api';

const RequestDetails = ({ request, isVisible, onClose, onSendMessage, onUpdate }) => {
  // Inicializar con el estado actual del request
  const [hasSignedPdf, setHasSignedPdf] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef(null);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [fullRequestData, setFullRequestData] = useState({ ...request });
  const [downloadingAttachmentIndex, setDownloadingAttachmentIndex] = useState(null);
  const [approvedFilesData, setApprovedFilesData] = useState(null);
  const [loadingApprovedFiles, setLoadingApprovedFiles] = useState(false);
  const [downloadingApprovedFileIndex, setDownloadingApprovedFileIndex] = useState(null);

  // Polling para verificar cambios de estado cada 5 segundos
  useEffect(() => {
    if (!isVisible || !request?._id) return;

    const interval = setInterval(async () => {
      try {
        const response = await apiFetch(`${API_BASE_URL}/respuestas/${request._id}`);
        if (response.ok) {
          const updatedRequest = await response.json();

          // Solo actualizar si el status cambió
          if (updatedRequest.status !== request.status) {
            if (onUpdate) {
              onUpdate(updatedRequest);
            }
          }
        }
      } catch (error) {
        console.error('Error verificando actualización del request:', error);
      }
    }, 30000); // Verificar cada 30 segundos

    return () => clearInterval(interval);
  }, [isVisible, request?._id, request?.status, onUpdate]);

  // Verificar si hay PDF firmado cada vez que se abre el modal
  useEffect(() => {
    if (!isVisible || !request?._id || request?.status === 'pendiente' || request?.status === 'en_revision') return;

    const checkSignedPdf = async () => {
      try {
        const response = await apiFetch(`${API_BASE_URL}/respuestas/${request._id}/has-client-signature`);
        if (response.ok) {
          const data = await response.json();
          setHasSignedPdf(data.exists);
        }
      } catch (error) {
        console.error('Error verificando PDF firmado:', error);
      }
    };

    // Siempre verificar el estado actual
    checkSignedPdf();
  }, [isVisible, request?._id]);

  useEffect(() => {
    if (isVisible && request?._id) {
      fetchAttachments(request._id);

      // Cargar archivos aprobados si el estado no es pendiente/en_revision
      if (request?.status !== 'pendiente' && request?.status !== 'en_revision') {
        fetchApprovedFiles(request._id);
      }
    }
  }, [request, isVisible]);

  const getMimeTypeIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return 'FileText';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return 'FileText';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return 'FileSpreadsheet';
    if (mimeType?.includes('image')) return 'Image';
    return 'File';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const fetchAttachments = async (responseId) => {
    setAttachmentsLoading(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/respuestas/${responseId}/adjuntos`);

      if (response.ok) {
        const data = await response.json();
        let extractedAdjuntos = [];
        if (Array.isArray(data) && data.length > 0 && data[0].adjuntos) {
          extractedAdjuntos = data[0].adjuntos;
        } else if (data.adjuntos) {
          extractedAdjuntos = data.adjuntos;
        } else if (Array.isArray(data)) {
          extractedAdjuntos = data;
        }

        setFullRequestData(prev => ({
          ...prev,
          adjuntos: extractedAdjuntos
        }));
      }
    } catch (error) {
      console.error('Error cargando adjuntos:', error);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const fetchApprovedFiles = async (responseId) => {
    setLoadingApprovedFiles(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/respuestas/data-approved/${responseId}`);
      if (response.ok) {
        const data = await response.json();
        setApprovedFilesData(data);
      }
    } catch (error) {
      console.error('Error cargando archivos aprobados:', error);
    } finally {
      setLoadingApprovedFiles(false);
    }
  };

  const handleDownloadAdjunto = async (responseId, index) => {
    setDownloadingAttachmentIndex(index);
    try {
      const token = sessionStorage.getItem("token");
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`https://back-vercel-iota.vercel.app/api/respuestas/${responseId}/adjuntos/${index}`, {
        headers
      });

      if (response.ok) {
        const blob = await response.blob();
        const adjunto = fullRequestData.adjuntos[index];
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = adjunto.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error al descargar');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al descargar');
    } finally {
      setDownloadingAttachmentIndex(null);
    }
  };

  const handleDownloadSignedPDF = async (responseId) => {
    try {
      setIsUploading(true);
      setUploadMessage('Descargando documento firmado...');

      // Primero obtener metadatos para saber el nombre real
      const metaResponse = await apiFetch(`${API_BASE_URL}/respuestas/${responseId}/has-client-signature`);

      let fileName = 'documento_firmado.pdf';

      if (metaResponse.ok) {
        const metaData = await metaResponse.json();
        if (metaData.exists && metaData.signature?.fileName) {
          fileName = metaData.signature.fileName;
        }
      }

      // Descargar el archivo
      const token = sessionStorage.getItem("token");
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`https://back-vercel-iota.vercel.app/api/respuestas/${responseId}/client-signature`, {
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al descargar el documento firmado');
      }

      const blob = await response.blob();

      // También verificar Content-Disposition como respaldo
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setUploadMessage('Documento firmado descargado exitosamente');

    } catch (error) {
      console.error('Error descargando documento firmado:', error);
      setUploadMessage('Error: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Función para descargar un archivo aprobado específico
  const handleDownloadSingleApprovedFile = async (responseId, index, fileName) => {
    setDownloadingApprovedFileIndex(index);
    try {
      // Si no viene fileName, intentar obtenerlo de los datos
      if (!fileName && approvedFilesData?.correctedFiles?.[index]) {
        fileName = approvedFilesData.correctedFiles[index].fileName;
      }

      // Si aún no hay nombre, usar uno por defecto
      const finalFileName = fileName || `documento_aprobado_${index + 1}.pdf`;

      const token = sessionStorage.getItem("token");
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`https://back-vercel-iota.vercel.app/api/respuestas/download-approved-pdf/${responseId}?index=${index}`, {
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al descargar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = finalFileName;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error descargando archivo aprobado:', error);
      alert('Error al descargar el documento: ' + error.message);
    } finally {
      setDownloadingApprovedFileIndex(null);
    }
  };

  if (!isVisible || !request) return null;

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadSignedPdf = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadMessage('Error: Solo se permiten archivos PDF');
      return;
    }

    setIsUploading(true);
    setUploadMessage('');

    const formData = new FormData();
    formData.append('signedPdf', file);

    try {
      const response = await fetch(`https://back-vercel-iota.vercel.app/api/respuestas/${request._id}/upload-client-signature`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setHasSignedPdf(true);
        setUploadMessage('PDF firmado subido exitosamente');

        if (onUpdate) {
          const updatedResponse = await fetch(`https://back-vercel-iota.vercel.app/api/respuestas/${request._id}`);
          const updatedRequest = await updatedResponse.json();
          onUpdate(updatedRequest);
        }

        event.target.value = '';
      } else {
        setUploadMessage('Error: ' + (data.error || 'Error al subir el PDF'));
      }
    } catch (error) {
      console.error('Error subiendo PDF firmado:', error);
      setUploadMessage('Error de conexión al subir el PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'pendiente':
        return 'bg-success text-success-foreground';
      case 'in_review':
      case 'en_revision':
        return 'bg-warning text-warning-foreground';
      case 'approved':
      case 'aprobado':
        return 'bg-secondary text-secondary-foreground';
      case 'signed':
      case 'firmado':
        return 'bg-success text-success-foreground'
      case 'finalizado':
        return 'bg-accent text-accent-foreground'
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'aprobado':
        return 'CheckCircle';
      case 'pending':
      case 'pendiente':
        return 'Clock';
      case 'in_review':
      case 'en_revision':
        return 'Eye';
      case 'rejected':
      case 'rechazado':
        return 'XCircle';
      case 'borrador':
        return 'FileText';
      default:
        return 'Circle';
      case 'signed':
      case 'firmado':
        return 'CheckSquare';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    return new Date(dateString)?.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para determinar qué sección mostrar
  const renderSignedDocumentSection = () => {
    // Siempre verificar el estado actual
    const shouldShowSignedSection = request?.status === 'aprobado' ||
      request?.status === 'firmado' ||
      request?.status === 'finalizado' ||
      request?.status === 'archivado';

    if (!shouldShowSignedSection) return null;

    if (request?.status === 'aprobado') {
      return (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">Documento Firmado</h3>
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon name="FileSignature" size={20} className="text-success" />
                <div>
                  <p className="text-sm font-medium text-foreground">Subir PDF Firmado</p>
                  <p className="text-xs text-muted-foreground">
                    {hasSignedPdf
                      ? 'Ya has subido el PDF firmado. Puedes descargarlo nuevamente si lo necesitas.'
                      : 'Sube el PDF con tu firma una vez descargado y firmado.'}
                  </p>
                  {uploadMessage && (
                    <p className={`text-xs ${uploadMessage.includes('Error') ? 'text-error' : 'text-success'}`}>
                      {uploadMessage}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!hasSignedPdf ? (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf"
                      onChange={handleUploadSignedPdf}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <Button
                      variant="default"
                      size="sm"
                      iconName={isUploading ? "Loader" : "Upload"}
                      iconPosition="left"
                      iconSize={16}
                      disabled={isUploading}
                      onClick={handleUploadButtonClick}
                      className="bg-success hover:bg-success/90"
                    >
                      {isUploading ? 'Subiendo...' : 'Subir PDF'}
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      iconName={isUploading ? "Loader" : "Download"}
                      iconPosition="left"
                      iconSize={16}
                      disabled={isUploading}
                      onClick={() => handleDownloadSignedPDF(request._id)}
                    >
                      {isUploading ? 'Descargando...' : 'Descargar'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    } else if (request?.status === 'firmado' || request?.status === 'finalizado' || request?.status === 'archivado') {
      return (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">Documento Firmado</h3>
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon name="CheckSquare" size={20} className="text-success" />
                <div>
                  <p className="text-sm font-medium text-foreground">Documento Firmado Completado</p>
                  <p className="text-xs text-muted-foreground">
                    El documento ha sido firmado y completado exitosamente.
                  </p>
                  {uploadMessage && (
                    <p className={`text-xs mt-1 ${uploadMessage.includes('Error') ? 'text-error' : 'text-success'}`}>
                      {uploadMessage}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconName={isUploading ? "Loader" : "Download"}
                  iconPosition="left"
                  iconSize={16}
                  disabled={isUploading}
                  onClick={() => handleDownloadSignedPDF(request._id)}
                >
                  {isUploading ? 'Descargando...' : 'Descargar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border shadow-brand-active w-full overflow-y-auto h-full rounded-none sm:h-auto sm:max-h-[85vh] sm:max-w-4xl sm:rounded-lg">
        <div className="sticky top-0 bg-card border-b border-border p-4 sm:p-6 z-10">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 max-w-[85%] sm:max-w-none">
              <div className="flex items-start sm:items-center space-x-3">
                <Icon name="FileText" size={24} className="text-accent mt-1 sm:mt-0 flex-shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground break-words">{request?.title}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground break-all">ID: {request?._id}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit ${getStatusColor(request?.status)}`}>
                <Icon name={getStatusIcon(request?.status)} size={14} className="mr-2 flex-shrink-0" />
                {request?.status?.replace('_', ' ')?.toUpperCase()}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              iconName="X"
              iconSize={20}
              className="flex-shrink-0 ml-2"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Información General</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Título del Formulario:</span>
                    <span className="text-sm font-medium text-foreground">{request?.formTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Categoría:</span>
                    <span className="text-sm font-medium text-foreground">{request?.form?.section}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Usuario y Fechas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Asociado a:</span>
                    <span className="text-sm font-medium text-foreground">{request?.submittedBy + ", " + request?.company}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fecha de envío:</span>
                    <span className="text-sm font-medium text-foreground">{formatDate(request?.submittedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Archivos Adjuntos */}
          <div>
            {attachmentsLoading &&
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                Archivos Adjuntos
                {attachmentsLoading && <Icon name="Loader" size={16} className="animate-spin text-accent" />}
              </h3>
            }
            {!attachmentsLoading && fullRequestData?.adjuntos?.length > 0 &&
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                Archivos Adjuntos
              </h3>
            }
            {fullRequestData?.adjuntos?.length > 0 && (
              <div className="space-y-2">
                {fullRequestData.adjuntos.map((adjunto, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon name={getMimeTypeIcon(adjunto.mimeType)} size={20} className="text-accent" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{adjunto.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {adjunto.pregunta} • {formatFileSize(adjunto.size)} • {formatDate(adjunto.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        iconName={downloadingAttachmentIndex === index ? "Loader" : "Download"}
                        iconPosition="left"
                        iconSize={16}
                        onClick={() => handleDownloadAdjunto(request._id, index)}
                        disabled={downloadingAttachmentIndex !== null}
                      >
                        {downloadingAttachmentIndex === index ? 'Descargando...' : 'Descargar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sección de Documentos Corregidos */}
          {(request?.status !== 'pendiente' && request?.status !== 'en_revision') && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                Documentos Corregidos
                {loadingApprovedFiles && <Icon name="Loader" size={16} className="animate-spin text-accent" />}
              </h3>

              {loadingApprovedFiles ? (
                <div className="flex justify-center py-6">
                  <Icon name="Loader" size={24} className="animate-spin text-accent" />
                </div>
              ) : (
                <>
                  {approvedFilesData?.correctedFiles?.length > 0 && (
                    <div className="space-y-2">
                      {approvedFilesData.correctedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Icon name="FileText" size={20} className="text-success" />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {file.fileName || `Documento corregido ${index + 1}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PDF • {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              iconName={downloadingApprovedFileIndex === index ? "Loader" : "Download"}
                              iconPosition="left"
                              iconSize={16}
                              onClick={() => handleDownloadSingleApprovedFile(request._id, index, file.fileName)}
                              disabled={downloadingApprovedFileIndex !== null}
                            >
                              {downloadingApprovedFileIndex === index ? 'Descargando...' : 'Descargar'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!approvedFilesData?.correctedFiles || approvedFilesData.correctedFiles.length === 0) && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      <Icon name="FileText" size={20} className="mx-auto mb-2 text-muted-foreground/50" />
                      No hay documentos corregidos disponibles
                    </div>
                  )}
                </>
              )}

              {/* Sección de documento firmado - SEPARADA Y CON SU PROPIO TÍTULO */}
              {renderSignedDocumentSection()}
            </div>
          )}

          {request?.form?.description && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Descripción</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {request?.form?.description}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Icon name="Clock" size={16} />
              <span>Última actualización: {formatDate(request?.lastUpdated)}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                iconName="MessageSquare"
                iconPosition="left"
                onClick={() => onSendMessage(request)}
                iconSize={16}
              >
                Mensajes
              </Button>
              <Button
                variant="default"
                onClick={onClose}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;