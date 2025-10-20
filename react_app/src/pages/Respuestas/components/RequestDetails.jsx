import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RequestDetails = ({ request, isVisible, onClose }) => {
  const [correctedFile, setCorrectedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (request?.correctedFile) {
      setCorrectedFile({
        name: request.correctedFile.fileName,
        size: request.correctedFile.fileSize
      });
    } else {
      setCorrectedFile(null);
    }
  }, [request]);

  if (!isVisible || !request) return null;

  const handleDownload = () => {
    if (request?.IDdoc) {
      window.open(`http://192.168.0.2:4000/api/generador/download/${request.IDdoc}`, '_blank');
    } else {
      alert('No hay documento disponible para descargar');
    }
  };

  const handleUploadCorrection = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setCorrectedFile(file);
      } else {
        alert('Por favor, sube solo archivos PDF');
        event.target.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveCorrection = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta corrección y volver a revisión?')) {
      return;
    }

    try {
      const response = await fetch(`http://192.168.0.2:4000/api/respuestas/${request._id}/remove-correction`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCorrectedFile(null);
        alert('Corrección eliminada, formulario vuelve a estado "en revisión"');
      } else {
        alert('Error al eliminar la corrección');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la corrección');
    }
  };

  const handleApprove = async () => {
    if (!correctedFile) {
      alert('Debes subir un documento corregido antes de aprobar');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('correctedFile', correctedFile);

      const uploadResponse = await fetch(`http://192.168.0.2:4000/api/respuestas/${request._id}/upload-correction`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Error subiendo corrección');
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const approveResponse = await fetch(`http://192.168.0.2:4000/api/respuestas/${request._id}/approve`, {
        method: 'POST',
      });

      if (approveResponse.ok) {
        alert('Formulario aprobado correctamente');
        onClose();
      } else {
        const errorData = await approveResponse.json();
        alert(`Error al aprobar el formulario: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al aprobar el formulario: ' + error.message);
    }
  };

  const formatFileName = () => {
    const formTitle = request?.formTitle || request?.form?.title || 'Formulario';
    const userName = request?.submittedBy || request?.user?.nombre || 'Usuario';
    const submitDate = request?.submittedAt || request?.createdAt;

    const formatDateForFileName = (dateString) => {
      if (!dateString) return 'fecha-desconocida';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    const datePart = formatDateForFileName(submitDate);

    const cleanText = (text) => {
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .toLowerCase();
    };

    const cleanFormTitle = cleanText(formTitle);
    const cleanUserName = cleanText(userName);

    return `${cleanFormTitle}_${cleanUserName}_${datePart}.docx`;
  };

  const getRealAttachments = () => {
    if (!request) return [];

    const fileName = formatFileName();

    return [
      {
        id: request?._id || 1,
        name: fileName,
        size: "Calculando...",
        type: "docx",
        uploadedAt: request?.submittedAt || request?.createdAt,
        downloadUrl: `/api/documents/download/${request?._id}`
      }
    ];
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'in_review':
        return 'bg-accent text-accent-foreground';
      case 'rejected':
        return 'bg-error text-error-foreground';
      case 'draft':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'CheckCircle';
      case 'pending':
        return 'Clock';
      case 'in_review':
        return 'Eye';
      case 'rejected':
        return 'XCircle';
      case 'draft':
        return 'FileText';
      default:
        return 'Circle';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    return request?.submittedAt;
  };

  const getFileIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return 'FileText';
      case 'docx': case 'doc':
        return 'FileText';
      case 'xlsx': case 'xls':
        return 'FileSpreadsheet';
      case 'jpg': case 'jpeg': case 'png':
        return 'Image';
      default:
        return 'File';
    }
  };

  const realAttachments = getRealAttachments();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
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
                    <span className="text-sm font-medium text-foreground">{request?.formTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Categoría:</span>
                    <span className="text-sm font-medium text-foreground">{request?.form?.section}</span>
                  </div>
                  <div className="flex justify-between">
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
                    <span className="text-sm font-medium text-foreground">{request?.submittedBy}, {request?.company}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fecha de envío:</span>
                    <span className="text-sm font-medium text-foreground">{formatDate(request?.submittedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-foreground">{request?.user?.nombre}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
            <h3 className="text-lg font-semibold text-foreground mb-3">Documento Generado</h3>
            {realAttachments?.length > 0 ? (
              <div className="space-y-2">
                {realAttachments?.map((file) => (
                  <div key={file?.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon name={getFileIcon(file?.type)} size={20} className="text-accent" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{file?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file?.size} • Generado el {formatDate(file?.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Download"
                      iconPosition="left"
                      iconSize={16}
                      onClick={handleDownload}
                    >
                      Descargar
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Paperclip" size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay documentos generados para este formulario</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Documento Corregido</h3>
            <div className="bg-muted/50 rounded-lg p-4">
              {correctedFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon name="FileText" size={20} className="text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{correctedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(correctedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUploadClick}
                    >
                      Cambiar Archivo
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveCorrection}
                      className="text-error hover:bg-error/10"
                    >
                      <Icon name="X" size={16} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">No se han subido correcciones aún</p>
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="Upload"
                    iconPosition="left"
                    onClick={handleUploadClick}
                  >
                    Subir
                  </Button>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadCorrection}
                accept=".pdf"
                className="hidden"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Comentarios Internos</h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground italic text-right">
                hay x mensajes nuevos
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Icon name="Clock" size={16} />
              <span>Última actualización: {formatDate(request?.submittedAt)}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                iconName="MessageSquare"
                iconPosition="left"
                iconSize={16}
              >
                Enviar Mensaje
              </Button>
              <Button
                variant="outline"
                iconName="Download"
                iconPosition="left"
                iconSize={16}
                onClick={handleDownload}
              >
                Descargar DOCX
              </Button>
              <Button
                variant="default"
                iconName="CheckCircle"
                iconPosition="left"
                iconSize={16}
                onClick={handleApprove}
                disabled={!correctedFile}
              >
                Aprobar
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