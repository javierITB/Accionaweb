import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RequestDetails = ({ request, isVisible, onClose, onSendMessage }) => {
  const [hasSignedPdf, setHasSignedPdf] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef(null); // Añadir useRef

  // useEffect DEBE estar siempre en el nivel superior, sin condiciones
  useEffect(() => {
    // La condición va DENTRO del useEffect, no fuera
    if (isVisible && request?._id && request?.status === 'aprobado') {
      const checkSignedPdf = async () => {
        try {
          const response = await fetch(`https://accionaapi.vercel.app/api/respuestas/${request._id}/has-client-signature`);
          const data = await response.json();
          setHasSignedPdf(data.exists);
        } catch (error) {
          console.error('Error verificando PDF firmado:', error);
        }
      };
      checkSignedPdf();
    }
  }, [request, isVisible]);

  // El return condicional va DESPUÉS de todos los Hooks
  if (!isVisible || !request) return null;

  // Función para manejar el clic en el botón de subir
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Función para subir PDF firmado
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
      const response = await fetch(`https://accionaapi.vercel.app/api/respuestas/${request._id}/upload-client-signature`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setHasSignedPdf(true);
        setUploadMessage('PDF firmado subido exitosamente');
        // Limpiar el input file
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

  // Resto de las funciones permanecen igual...
  const handleDownloadApprovedPDF = async (responseId) => {
    try {
      const response = await fetch(`https://accionaapi.vercel.app/api/respuestas/download-approved-pdf/${responseId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al descargar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;

      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = request?.correctedFile.fileName;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) fileName = fileNameMatch[1];
      }

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
      case 'approved':
      case 'aprobado':
        return 'bg-success text-success-foreground';
      case 'pending':
      case 'pendiente':
        return 'bg-warning text-warning-foreground';
      case 'in_review':
      case 'en_revision':
        return 'bg-accent text-accent-foreground';
      case 'signed':
      case 'firmado':
        return 'bg-blue-500 text-white';
      case 'borrador':
        return 'bg-muted text-muted-foreground';
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
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Prioridad:</span>
                    <span className={`text-sm font-medium ${request?.priority === 'high' ? 'text-error' :
                      request?.priority === 'medium' ? 'text-warning' : 'text-success'
                      }`}>
                      {request?.priority?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Usuario y Fechas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Enviado por:</span>
                    <span className="text-sm font-medium text-foreground">{request?.submittedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fecha de envío:</span>
                    <span className="text-sm font-medium text-foreground">{formatDate(request?.submittedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Usuario:</span>
                    <span className="text-sm font-medium text-foreground">{request?.user?.nombre}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {request?.status === 'aprobado' && (
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

              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon name="FileSignature" size={20} className="text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Subir PDF Firmado</p>
                      <p className="text-xs text-muted-foreground">
                        {hasSignedPdf
                          ? 'Ya has subido el PDF firmado.'
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
                      <div className="flex items-center space-x-2 text-success">
                        <Icon name="CheckCircle" size={16} />
                        <span className="text-sm font-medium">PDF Firmado Subido</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Comentarios Internos</h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground italic">
                No hay comentarios internos para esta solicitud.
              </p>
            </div>
          </div>
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
                Enviar Mensaje
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