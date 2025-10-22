import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RequestDetails = ({ request, isVisible, onClose }) => {
  if (!isVisible || !request) return null;

  // Función para descargar PDF aprobado
  const handleDownloadApprovedPDF = async (responseId) => {
    try {
      const response = await fetch(`http://192.168.0.2:4000/api/respuestas/download-approved-pdf/${responseId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al descargar el PDF');
      }

      // Convertir la respuesta a blob
      const blob = await response.blob();
      
      // Crear URL temporal para descargar
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Obtener el nombre del archivo del header
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = 'documento_aprobado.pdf';
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) fileName = fileNameMatch[1];
      }
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error al descargar el PDF aprobado: ' + error.message);
    }
  };

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
      case 'aprobado':
        return 'bg-success text-success-foreground';
      case 'pending':
      case 'pendiente':
        return 'bg-warning text-warning-foreground';
      case 'in_review':
      case 'en_revision':
        return 'bg-accent text-accent-foreground';
      case 'rejected':
      case 'rechazado':
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

          {/* NUEVA SECCIÓN: Documento Aprobado */}
          {request?.status === 'aprobado' && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Documento Aprobado</h3>
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon name="FileText" size={20} className="text-success" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Documento PDF Aprobado</p>
                      <p className="text-xs text-muted-foreground">
                        Tu formulario ha sido aprobado. Descarga el documento final.
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
            </div>
          )}

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