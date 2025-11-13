import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import CleanDocumentPreview from './CleanDocumentPreview';

const RequestDetails = ({ request, isVisible, onClose, onUpdate, onSendMessage }) => {
  const [correctedFile, setCorrectedFile] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [clientSignature, setClientSignature] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const fileInputRef = useRef(null);

  const [showPreview, setShowPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [documentInfo, setDocumentInfo] = useState(null);

  // ... (mantener todas las funciones existentes checkClientSignature, getDocumentInfo, etc.)

  if (!isVisible || !request) return null;

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

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const getFileIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return 'FileText';
      case 'docx': case 'doc':
        return 'FileText';
      case 'txt':
        return 'FileText';
      case 'xlsx': case 'xls':
        return 'FileSpreadsheet';
      case 'jpg': case 'jpeg': case 'png':
        return 'Image';
      default:
        return 'File';
    }
  };

  const getMimeTypeIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return 'FileText';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return 'FileText';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return 'FileSpreadsheet';
    if (mimeType?.includes('image')) return 'Image';
    if (mimeType?.includes('text')) return 'FileText';
    return 'File';
  };

  const canPreviewAdjunto = (mimeType) => {
    return mimeType === 'application/pdf';
  };

  // Función para renderizar secciones de archivos de manera responsive
  const renderFileSection = (title, files, onDownload, onPreview, showActions = true) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
      {files && files.length > 0 ? (
        <div className="space-y-3">
          {files.map((file, index) => (
            <div key={file?.id || index} className="bg-muted/50 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <Icon 
                    name={getFileIcon(file?.type)} 
                    size={20} 
                    className="text-accent mt-0.5 flex-shrink-0" 
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file?.size} • {formatDate(file?.uploadedAt)}
                    </p>
                  </div>
                </div>
                {showActions && (
                  <div className="flex items-center space-x-2 self-stretch sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Download"
                      iconPosition="left"
                      iconSize={16}
                      onClick={() => onDownload(file, index)}
                      disabled={isDownloading}
                      className="flex-1 sm:flex-none"
                    >
                      <span className="sm:hidden">Descargar</span>
                      <span className="hidden sm:inline">
                        {isDownloading ? 'Descargando...' : 'Descargar'}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPreview(file, index)}
                      iconName={isLoadingPreview ? "Loader" : "Eye"}
                      iconPosition="left"
                      iconSize={16}
                      disabled={isLoadingPreview}
                      className="flex-1 sm:flex-none"
                    >
                      <span className="sm:hidden">Ver</span>
                      <span className="hidden sm:inline">
                        {isLoadingPreview ? 'Cargando...' : 'Vista Previa'}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
          <Icon name="Paperclip" size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay documentos disponibles</p>
        </div>
      )}
    </div>
  );

  // Función para renderizar controles de documento corregido
  const renderCorrectedDocumentSection = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-3">Documento Corregido</h3>
      <div className="bg-muted/50 rounded-lg p-4">
        {correctedFile || request?.correctedFile ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <Icon name="FileText" size={20} className="text-accent mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {correctedFile?.name || request?.correctedFile?.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {correctedFile?.size ? `${(correctedFile.size / 1024 / 1024).toFixed(2)} MB` :
                    request?.correctedFile?.fileSize ? formatFileSize(request.correctedFile.fileSize) : 'Tamaño no disponible'}
                </p>
                {(request?.status === 'aprobado' || request?.status === 'firmado') && (
                  <p className="text-xs text-success font-medium mt-1">
                    ✓ Formulario aprobado
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 self-stretch">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviewCorrected}
                iconName={isLoadingPreview ? "Loader" : "Eye"}
                iconPosition="left"
                iconSize={16}
                disabled={isLoadingPreview}
                className="flex-1 sm:flex-none"
              >
                <span className="sm:hidden">Ver</span>
                <span className="hidden sm:inline">Vista Previa</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveCorrection}
                className="text-error hover:bg-error/10 flex-shrink-0"
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              No se han subido correcciones aún
            </p>
            <Button
              variant="outline"
              size="sm"
              iconName="Upload"
              iconPosition="left"
              onClick={handleUploadClick}
              className="w-full sm:w-auto"
            >
              Subir PDF
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
  );

  // Función para renderizar documento firmado por cliente
  const renderClientSignatureSection = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-3">Documento Firmado por Cliente</h3>
      {clientSignature ? (
        <div className="bg-success/10 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <Icon name="FileSignature" size={20} className="text-success mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {clientSignature.fileName + '.pdf'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Subido el {formatDate(clientSignature.uploadedAt)} • {formatFileSize(clientSignature.fileSize)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 self-stretch">
              <Button
                variant="outline"
                size="sm"
                iconName="Download"
                iconPosition="left"
                iconSize={16}
                onClick={() => handleDownloadClientSignature(request._id)}
                className="flex-1 sm:flex-none"
              >
                <span className="sm:hidden">Descargar</span>
                <span className="hidden sm:inline">Descargar</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviewClientSignature}
                iconName={isLoadingPreview ? "Loader" : "Eye"}
                iconPosition="left"
                iconSize={16}
                disabled={isLoadingPreview}
                className="flex-1 sm:flex-none"
              >
                <span className="sm:hidden">Ver</span>
                <span className="hidden sm:inline">Vista Previa</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteClientSignature(request._id)}
                className="text-error hover:bg-error/10 flex-shrink-0"
              >
                <Icon name="Trash2" size={16} />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start space-x-3 flex-1">
              <Icon name="Clock" size={20} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">
                  El cliente aún no ha subido su documento firmado
                </p>
                <p className="text-xs text-muted-foreground">
                  Esperando que el cliente descargue, firme y suba el documento
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              iconName="RefreshCw"
              iconPosition="left"
              iconSize={16}
              onClick={refreshClientSignature}
              className="w-full sm:w-auto mt-2 sm:mt-0"
            >
              Actualizar
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const realAttachments = []; // Mantener tu lógica existente para realAttachments

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-card border border-border rounded-lg shadow-brand-active w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 sm:p-6 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <Icon name="FileText" size={24} className="text-accent mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                  {request?.formTitle || request?.title}
                </h2>
                <p className="text-sm text-muted-foreground truncate">ID: {request?._id}</p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-3 w-full sm:w-auto">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request?.status)}`}>
                <Icon name={getStatusIcon(request?.status)} size={12} className="mr-1" />
                <span className="hidden xs:inline">
                  {request?.status?.replace('_', ' ')?.toUpperCase()}
                </span>
                <span className="xs:hidden">
                  {request?.status?.charAt(0)?.toUpperCase()}
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                iconName="X"
                iconSize={20}
                className="flex-shrink-0"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Información General y Usuario */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Información General</h3>
                <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                  <div className="flex justify-between items-center py-1 border-b border-border/50 last:border-b-0">
                    <span className="text-sm text-muted-foreground">Formulario:</span>
                    <span className="text-sm font-medium text-foreground text-right truncate ml-2">
                      {request?.formTitle}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50 last:border-b-0">
                    <span className="text-sm text-muted-foreground">Categoría:</span>
                    <span className="text-sm font-medium text-foreground">{request?.form?.section}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
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
                <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                  <div className="flex justify-between items-center py-1 border-b border-border/50 last:border-b-0">
                    <span className="text-sm text-muted-foreground">Enviado por:</span>
                    <span className="text-sm font-medium text-foreground text-right truncate ml-2">
                      {request?.submittedBy}, {request?.company}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50 last:border-b-0">
                    <span className="text-sm text-muted-foreground">Fecha:</span>
                    <span className="text-sm font-medium text-foreground">{formatDate(request?.submittedAt)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground">Usuario:</span>
                    <span className="text-sm font-medium text-foreground truncate ml-2">
                      {request?.user?.nombre}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
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

          {/* Archivos Adjuntos */}
          {request?.adjuntos && request.adjuntos.length > 0 && (
            renderFileSection(
              "Archivos Adjuntos",
              request.adjuntos.map((adjunto, index) => ({
                ...adjunto,
                id: index,
                type: adjunto.mimeType?.split('/')[1] || 'file',
                size: formatFileSize(adjunto.size),
                uploadedAt: adjunto.uploadedAt
              })),
              (file, index) => handleDownloadAdjunto(request._id, index),
              (file, index) => handlePreviewAdjunto(request._id, index)
            )
          )}

          {/* Documento Generado */}
          {renderFileSection(
            "Documento Generado",
            realAttachments,
            handleDownload,
            handlePreviewGenerated
          )}

          {/* Documento Corregido */}
          {renderCorrectedDocumentSection()}

          {/* Documento Firmado por Cliente */}
          {(request?.status === 'aprobado' || request?.status === 'firmado') && renderClientSignatureSection()}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground justify-center sm:justify-start order-2 sm:order-1">
              <Icon name="Clock" size={16} />
              <span className="text-xs sm:text-sm">
                Actualizado: {formatDate(request?.submittedAt)}
              </span>
            </div>
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center space-y-2 xs:space-y-0 xs:space-x-3 order-1 sm:order-2">
              <Button
                variant="outline"
                iconName="MessageSquare"
                iconPosition="left"
                onClick={() => onSendMessage(request)}
                iconSize={16}
                className="flex-1 xs:flex-none"
              >
                <span className="hidden sm:inline">Enviar Mensaje</span>
                <span className="sm:hidden">Mensaje</span>
              </Button>

              {request?.status !== 'aprobado' && request?.status !== 'firmado' && (
                <Button
                  variant="default"
                  iconName="CheckCircle"
                  iconPosition="left"
                  iconSize={16}
                  onClick={handleApprove}
                  disabled={!correctedFile || isApproving}
                  className="flex-1 xs:flex-none"
                >
                  {isApproving ? 'Aprobando...' : 'Aprobar'}
                </Button>
              )}

              <Button
                variant="default"
                onClick={onClose}
                className="flex-1 xs:flex-none"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CleanDocumentPreview
        isVisible={showPreview}
        onClose={() => {
          if (previewDocument?.url && previewDocument?.type === 'pdf') {
            cleanupPreviewUrl(previewDocument.url);
          }
          setShowPreview(false);
        }}
        documentUrl={previewDocument?.url}
        documentType={previewDocument?.type}
      />
    </div>
  );
};

export default RequestDetails;