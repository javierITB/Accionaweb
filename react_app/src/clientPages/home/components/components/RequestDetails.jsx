import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RequestDetails = ({ request, isVisible, onClose, onSendMessage, onUpdate }) => {
  const [hasSignedPdf, setHasSignedPdf] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef(null);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [fullRequestData, setFullRequestData] = useState({ ...request });
  const [downloadingAttachmentIndex, setDownloadingAttachmentIndex] = useState(null);

  // Polling para verificar cambios de estado cada 5 segundos
  useEffect(() => {
    if (!isVisible || !request?._id) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}`);
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

  useEffect(() => {
    if (isVisible && request?._id && request?.status !== 'pendiente' && request?.status !== 'en_revision') {
      const checkSignedPdf = async () => {
        try {
          const response = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}/has-client-signature`);
          const data = await response.json();
          setHasSignedPdf(data.exists);
        } catch (error) {
          console.error('Error verificando PDF firmado:', error);
        }
      };
      checkSignedPdf();
    }
    fetchAttachments(request?._id);
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
      const response = await fetch(`https://back-acciona.vercel.app/api/respuestas/${responseId}/adjuntos`);

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

  const handleDownloadAdjunto = async (responseId, index) => {
    setDownloadingAttachmentIndex(index);
    try {
      const response = await fetch(`https://back-acciona.vercel.app/api/respuestas/${responseId}/adjuntos/${index}`);
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

   const handlePreviewDocument = (documentUrl, documentType) => {
    if (!documentUrl) {
      alert('No hay documento disponible para vista previa');
      return;
    }
    setPreviewDocument({ url: documentUrl, type: documentType });
    setShowPreview(true);
  };

   const downloadPdfForPreview = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      const blob = await response.blob();
      if (blob.type !== 'application/pdf') throw new Error('El archivo no es un PDF válido');
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error descargando PDF para vista previa:', error);
      throw error;
    }
  };

  const handleDownloadSignedPDF = async (responseId) => {
    try {
      setIsUploading(true);
      setUploadMessage('Descargando documento firmado...');

      const response = await fetch(`https://back-acciona.vercel.app/api/respuestas/${responseId}/client-signature`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al descargar el documento firmado');
      }

      const blob = await response.blob();
      
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = 'documento_firmado.pdf';
      
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
      const response = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}/upload-client-signature`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setHasSignedPdf(true);
        setUploadMessage('PDF firmado subido exitosamente');

        if (onUpdate) {
          const updatedResponse = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}`);
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

  const handleDownloadApprovedPDF = async (responseId) => {
    try {
      const fileDataResponse = await fetch(`https://back-acciona.vercel.app/api/respuestas/data-approved/${responseId}`);

      let fileName = 'documento_aprobado.pdf';

      if (fileDataResponse.ok) {
        const fileData = await fileDataResponse.json();
        fileName = fileData.fileName;
      }

      const response = await fetch(`https://back-acciona.vercel.app/api/respuestas/download-approved-pdf/${responseId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al descargar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error al descargar el PDF aprobado: ' + error.message);
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

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-brand-active w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Icon name="FileText" size={24} className="text-accent" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{request?.title}</h2>
                  <p className="text-sm text-muted-foreground">ID: {request?._id}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request?.status)}`}>
                <Icon name={getStatusIcon(request?.status)} size={14} className="mr-2" />
                {request?.status?.replace('_', ' ')?.toUpperCase()}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              iconName="X"
              iconSize={20}
            />
          </div>
        </div>

        <div className="p-6 space-y-6">
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

          {(request?.status !== 'pendiente' && request?.status !== 'en_revision') && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Documento Aprobado</h3>

              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon name="FileText" size={20} className="text-success" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Documento PDF Aprobado</p>
                      <p className="text-xs text-muted-foreground">
                        Descarga el documento aprobado para firmarlo.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    iconName="Download"
                    iconPosition="left"
                    iconSize={16}
                    onClick={() => handleDownloadApprovedPDF(request._id)}
                    className="bg-success hover:bg-success/90"
                  >
                    Descargar PDF
                  </Button>
                </div>
              </div>

              {request?.status === 'aprobado' && (
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon name="FileSignature" size={20} className="text-accent" />
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
                    <div className="flex flex-col items-end space-y-2">
                      {!hasSignedPdf ? (
                        <div className="flex items-center space-x-2">
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
                            iconName="Upload"
                            iconPosition="left"
                            iconSize={16}
                            disabled={isUploading}
                            onClick={handleUploadButtonClick}
                            className="bg-accent hover:bg-accent/90"
                          >
                            {isUploading ? 'Subiendo...' : 'Subir PDF Firmado'}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            iconName="Download"
                            iconPosition="left"
                            iconSize={16}
                            disabled={isUploading}
                            onClick={() => handleDownloadSignedPDF(request._id)}
                            className="text-accent"
                          >
                            {isUploading ? 'Descargando...' : 'Descargar'}
                          </Button>
                          <div className="flex items-center space-x-2 text-success">
                            <Icon name="CheckCircle" size={16} />
                            <span className="text-sm font-medium">PDF Firmado Subido</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(request?.status === 'firmado' || request?.status === 'finalizado' || request?.status === 'archivado') && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon name="CheckSquare" size={20} className="text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Documento Firmado Completado</p>
                        <p className="text-xs text-muted-foreground">
                          El documento ha sido firmado y completado exitosamente.
                          {hasSignedPdf && (
                            <span className="block mt-1">
                              Puedes volver a descargarlo si lo necesitas.
                            </span>
                          )}
                        </p>
                        {uploadMessage && (
                          <p className={`text-xs mt-1 ${uploadMessage.includes('Error') ? 'text-error' : 'text-success'}`}>
                            {uploadMessage}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasSignedPdf && (
                        <Button
                          variant="default"
                          size="sm"
                          iconName="Download"
                          iconPosition="left"
                          iconSize={16}
                          disabled={isUploading}
                          onClick={() => handleDownloadSignedPDF(request._id)}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          {isUploading ? 'Descargando...' : 'Descargar Firmado'}
                        </Button>
                      )}
                      <div className="flex items-center space-x-2 text-blue-500">
                        <Icon name="CheckCircle" size={16} />
                        <span className="text-sm font-medium">Proceso Finalizado</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

        <div className="sticky bottom-0 bg-card border-t border-border p-6">
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