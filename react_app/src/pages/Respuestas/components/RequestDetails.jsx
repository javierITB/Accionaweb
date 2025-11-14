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

  const checkClientSignature = async () => {
    try {
      const response = await fetch(`https://accionaapi.vercel.app/api/respuestas/${request._id}/has-client-signature`);
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setClientSignature(data.signature);
        } else {
          setClientSignature(null);
        }
      } else {
        setClientSignature(null);
      }
    } catch (error) {
      console.error('Error verificando firma del cliente:', error);
      setClientSignature(null);
    }
  };

  const getDocumentInfo = async (responseId) => {
    try {
      const response = await fetch(`https://accionaapi.vercel.app/api/generador/info-by-response/${responseId}`);
      if (response.ok) {
        const data = await response.json();
        setDocumentInfo(data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo información del documento:', error);
      return null;
    }
  };

  const refreshClientSignature = async () => {
    await checkClientSignature();
  };

  useEffect(() => {
    if (request?.correctedFile) {
      setCorrectedFile({
        name: request.correctedFile.fileName,
        size: request.correctedFile.fileSize,
        url: `https://accionaapi.vercel.app/api/respuestas/${request._id}/corrected-file`,
        isServerFile: true
      });
    } else {
      setCorrectedFile(null);
    }

    if (request?._id) {
      checkClientSignature();
      getDocumentInfo(request._id);
    }
  }, [request]);

  const downloadPdfForPreview = async (url) => {
    try {
      setIsLoadingPreview(true);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();

      if (blob.type !== 'application/pdf') {
        throw new Error('El archivo no es un PDF válido');
      }

      const blobUrl = URL.createObjectURL(blob);
      return blobUrl;
    } catch (error) {
      console.error('Error descargando PDF para vista previa:', error);
      throw error;
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const cleanupPreviewUrl = (url) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    if (!isVisible || !request?._id) return;

    // Verificar cambios en el request cada 5 segundos cuando está visible
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`https://accionaapi.vercel.app/api/respuestas/${request._id}`);
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
    }, 5000); // Verificar cada 5 segundos

    return () => clearInterval(interval);
  }, [isVisible, request?._id, request?.status, onUpdate]);

  useEffect(() => {
    return () => {
      if (previewDocument?.url && previewDocument?.type === 'pdf') {
        cleanupPreviewUrl(previewDocument.url);
      }
    };
  }, [previewDocument]);

  if (!isVisible || !request) return null;

  const handlePreviewDocument = (documentUrl, documentType) => {
    if (!documentUrl) {
      alert('No hay documento disponible para vista previa');
      return;
    }

    setPreviewDocument({
      url: documentUrl,
      type: documentType
    });
    setShowPreview(true);
  };

  const handlePreviewGenerated = async () => {
    try {
      setIsLoadingPreview(true);

      const info = documentInfo || await getDocumentInfo(request._id);

      if (!info || !info.IDdoc) {
        alert('No hay documento generado disponible para vista previa');
        return;
      }

      const documentUrl = `https://accionaapi.vercel.app/api/generador/download/${info.IDdoc}`;
      const extension = info.tipo || 'docx';

      handlePreviewDocument(documentUrl, extension);
    } catch (error) {
      console.error('Error en vista previa del documento generado:', error);
      alert('Error al cargar la vista previa del documento generado: ' + error.message);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handlePreviewCorrected = async () => {
    if (!correctedFile && !request?.correctedFile) {
      alert('No hay documento corregido para vista previa');
      return;
    }

    try {
      let documentUrl;

      if (correctedFile && correctedFile instanceof File) {
        documentUrl = URL.createObjectURL(correctedFile);
      }
      else if (request?.status === 'aprobado' || request?.status === 'firmado') {
        const pdfUrl = `https://accionaapi.vercel.app/api/respuestas/download-approved-pdf/${request._id}`;
        documentUrl = await downloadPdfForPreview(pdfUrl);
      }
      else if (request?.correctedFile) {
        alert('El documento corregido está en proceso de revisión. Una vez aprobado podrás ver la vista previa.');
        return;
      } else {
        alert('No hay documento corregido disponible');
        return;
      }

      handlePreviewDocument(documentUrl, 'pdf');

    } catch (error) {
      console.error('Error en vista previa de documento corregido:', error);
      alert('Error al cargar la vista previa del documento corregido: ' + error.message);
    }
  };

  const handlePreviewClientSignature = async () => {
    if (!clientSignature) {
      alert('No hay documento firmado para vista previa');
      return;
    }

    try {
      const pdfUrl = `https://accionaapi.vercel.app/api/respuestas/${request._id}/client-signature`;
      const documentUrl = await downloadPdfForPreview(pdfUrl);
      handlePreviewDocument(documentUrl, 'pdf');
    } catch (error) {
      console.error('Error en vista previa de firma del cliente:', error);
      alert('Error al cargar la vista previa del documento firmado: ' + error.message);
    }
  };

  const handlePreviewAdjunto = async (responseId, index) => {
    try {
      const adjunto = request.adjuntos[index];

      if (adjunto.mimeType !== 'application/pdf') {
        alert('La vista previa solo está disponible para archivos PDF');
        return;
      }

      const pdfUrl = `https://accionaapi.vercel.app/api/respuestas/${responseId}/adjuntos/${index}`;
      const documentUrl = await downloadPdfForPreview(pdfUrl);
      handlePreviewDocument(documentUrl, 'pdf');

    } catch (error) {
      console.error('Error abriendo vista previa del adjunto:', error);
      alert('Error al abrir la vista previa del archivo: ' + error.message);
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      const info = documentInfo || await getDocumentInfo(request._id);

      if (!info || !info.IDdoc) {
        alert('No hay documento disponible para descargar');
        return;
      }

      window.open(`https://accionaapi.vercel.app/api/generador/download/${info.IDdoc}`, '_blank');

      if (onUpdate) {
        const updatedRequest = {
          ...request,
          status: 'en_revision'
        };
        onUpdate(updatedRequest);
      }

    } catch (error) {
      console.error('Error en descarga:', error);
      alert('Error al descargar el documento');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAdjunto = async (responseId, index) => {
    try {
      const response = await fetch(`https://accionaapi.vercel.app/api/respuestas/${responseId}/adjuntos/${index}`);

      if (response.ok) {
        const blob = await response.blob();
        const adjunto = request.adjuntos[index];
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = adjunto.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error al descargar el archivo');
      }
    } catch (error) {
      console.error('Error descargando adjunto:', error);
      alert('Error al descargar el archivo');
    }
  };

  const handleDownloadClientSignature = async (responseId) => {
    try {
      const response = await fetch(`https://accionaapi.vercel.app/api/respuestas/${responseId}/client-signature`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = clientSignature.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error descargando el documento firmado');
      }
    } catch (error) {
      console.error('Error descargando firma del cliente:', error);
      alert('Error descargando el documento firmado');
    }
  };

  const handleDeleteClientSignature = async (responseId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar el documento firmado por el cliente?')) {
      return;
    }

    try {
      const response = await fetch(`https://accionaapi.vercel.app/api/respuestas/${responseId}/client-signature`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setClientSignature(null);
        alert('Documento firmado eliminado exitosamente');
        if (onUpdate) {
          const updatedResponse = await fetch(`https://accionaapi.vercel.app/api/respuestas/${request._id}`);
          const updatedRequest = await updatedResponse.json();
          onUpdate(updatedRequest);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error eliminando documento firmado');
      }
    } catch (error) {
      console.error('Error eliminando firma del cliente:', error);
      alert('Error eliminando documento firmado');
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
    // Primero verificar si existe documento firmado
    try {
      const signatureCheck = await fetch(`https://accionaapi.vercel.app/api/respuestas/${request._id}/has-client-signature`);
      const signatureData = await signatureCheck.json();

      const hasSignature = signatureData.exists;

      let warningMessage = '¿Estás seguro de que quieres eliminar esta corrección y volver a revisión?';

      if (hasSignature) {
        warningMessage = 'ADVERTENCIA: Existe un documento firmado por el cliente. \n\nAl eliminar la corrección, el estado volverá a "en revisión", pero el documento firmado se mantendrá. Cuando vuelvas a subir una corrección, el estado pasará directamente a "firmado". \n\n¿Continuar?';
      }

      if (!confirm(warningMessage)) {
        return;
      }

      const response = await fetch(`https://accionaapi.vercel.app/api/respuestas/${request._id}/remove-correction`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        if (onUpdate && result.updatedRequest) {
          onUpdate(result.updatedRequest);
        }
        setCorrectedFile(null);

        if (result.hasExistingSignature) {
          alert('Corrección eliminada. El documento firmado se mantiene. Al subir nueva corrección, el estado pasará directamente a "firmado".');
        } else {
          alert('Corrección eliminada, formulario vuelve a estado "en revisión"');
        }
      } else {
        alert(result.error || 'Error al eliminar la corrección');
      }

    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la corrección');
    }
  };

  const handleApprove = async () => {
    if (!correctedFile || isApproving || request?.status === 'aprobado' || request?.status === 'firmado') {
      return;
    }

    if (!confirm('¿Estás seguro de que quieres aprobar este formulario? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsApproving(true);

    try {
      const formData = new FormData();
      formData.append('correctedFile', correctedFile);

      const approveResponse = await fetch(`https://accionaapi.vercel.app/api/respuestas/${request._id}/approve`, {
        method: 'POST',
        body: formData,
      });

      if (approveResponse.ok) {
        const result = await approveResponse.json();

        if (onUpdate) {
          const updatedResponse = await fetch(`https://accionaapi.vercel.app/api/respuestas/${request._id}`);
          const updatedRequest = await updatedResponse.json();
          onUpdate(updatedRequest);
        }

        alert('Formulario aprobado correctamente');
      } else {
        const errorData = await approveResponse.json();
        alert(`Error al aprobar el formulario: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al aprobar el formulario: ' + error.message);
    } finally {
      setIsApproving(false);
    }
  };

  const formatFileName = () => {
    const formTitle = request?.formTitle || request?.form?.title || 'Formulario';

    const nombreTrabajador = request?.responses?.["Nombre del trabajador:"] ||
      request?.responses?.["Nombre del trabajador"] ||
      'Trabajador';

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
    const cleanTrabajador = cleanText(nombreTrabajador);

    let extension = 'docx';

    if (request?.form?.section && request.form.section !== "Anexos") {
      extension = 'txt';
    }

    if (!request?.form?.section && request?.formTitle) {
      if (!request.formTitle.toLowerCase().includes('anexo')) {
        extension = 'txt';
      }
    }

    return `${cleanFormTitle}_${cleanTrabajador}_${datePart}.${extension}`;
  };

  const getRealAttachments = () => {
    if (!request) return [];

    const fileName = formatFileName();
    const extension = fileName.split('.').pop() || 'docx';

    const shouldShowDocument = request?.submittedAt && request?.responses;

    if (!shouldShowDocument) {
      return [];
    }

    return [
      {
        id: request?._id || 1,
        name: fileName,
        size: "Calculando...",
        type: extension,
        uploadedAt: request?.submittedAt || request?.createdAt,
        downloadUrl: `/api/documents/download/${request?._id}`
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