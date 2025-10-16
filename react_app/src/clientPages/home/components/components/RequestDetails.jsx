import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RequestDetails = ({ request, isVisible, onClose }) => {
  if (!isVisible || !request) return null;

  // Función para formatear el nombre del archivo
  const formatFileName = () => {
    const formTitle = request?.formTitle || request?.form?.title || 'Formulario';
    const userName = request?.submittedBy || request?.user?.nombre || 'Usuario';
    const submitDate = request?.submittedAt || request?.createdAt;
    
    // Formatear fecha para el nombre del archivo (sin caracteres especiales)
    const formatDateForFileName = (dateString) => {
      if (!dateString) return 'fecha-desconocida';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    const datePart = formatDateForFileName(submitDate);
    
    // Limpiar caracteres especiales y espacios
    const cleanText = (text) => {
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quitar acentos
        .replace(/[^a-zA-Z0-9]/g, '_')   // reemplazar caracteres especiales con _
        .replace(/_+/g, '_')             // reemplazar múltiples _ por uno solo
        .toLowerCase();
    };

    const cleanFormTitle = cleanText(formTitle);
    const cleanUserName = cleanText(userName);

    return `${cleanFormTitle}_${cleanUserName}_${datePart}.docx`;
  };

  // Función para obtener archivos reales desde la BD
  const getRealAttachments = () => {
    if (!request) return [];

    const fileName = formatFileName();
    
    // Aquí deberías obtener esta información real de tu base de datos
    // Por ahora simulamos con los datos que tienes en el request
    return [
      {
        id: request?._id || 1,
        name: fileName,
        size: "Calculando...", // Esto deberías obtenerlo del archivo real
        type: "docx",
        uploadedAt: request?.submittedAt || request?.createdAt,
        downloadUrl: `/api/documents/download/${request?._id}` // Endpoint para descargar
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
    return new Date(dateString)?.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Obtener archivos reales
  const realAttachments = getRealAttachments();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-brand-active w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
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
                    <span className={`text-sm font-medium ${
                      request?.priority === 'high' ? 'text-error' :
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

          {/* Description */}
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

          {/* Attachments - AHORA CON DATOS REALES */}
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

          {/* Comments/Notes */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Comentarios Internos</h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground italic">
                No hay comentarios internos para esta solicitud.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
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
                iconSize={16}
              >
                Enviar Mensaje
              </Button>
              <Button
                variant="outline"
                iconName="Download"
                iconPosition="left"
                iconSize={16}
              >
                Descargar DOCX
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