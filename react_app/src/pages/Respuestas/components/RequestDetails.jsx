import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import CleanDocumentPreview from './CleanDocumentPreview';

const RequestDetails = ({ request, isVisible, onClose, onUpdate, onSendMessage }) => {
  // --- ESTADOS DE UI ---
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'responses'

  const [correctedFile, setCorrectedFile] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [clientSignature, setClientSignature] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const fileInputRef = useRef(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);

  // Estados de carga para vistas previas
  const [isLoadingPreviewGenerated, setIsLoadingPreviewGenerated] = useState(false);
  const [isLoadingPreviewCorrected, setIsLoadingPreviewCorrected] = useState(false);
  const [isLoadingPreviewSignature, setIsLoadingPreviewSignature] = useState(false);
  const [isLoadingPreviewAdjunto, setIsLoadingPreviewAdjunto] = useState(false);

  const [documentInfo, setDocumentInfo] = useState(null);

  // --- NUEVO ESTADO PARA DATOS APROBADOS ---
  const [approvedData, setApprovedData] = useState(null);
  const [isLoadingApprovedData, setIsLoadingApprovedData] = useState(false);

  // Estado principal de datos
  const [fullRequestData, setFullRequestData] = useState({ ...request });

  // Estados de carga de secciones
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [isCheckingSignature, setIsCheckingSignature] = useState(false);

  const [downloadingAttachmentIndex, setDownloadingAttachmentIndex] = useState(null);
  const [isDownloadingSignature, setIsDownloadingSignature] = useState(false);

  // ---------------------------------------------
  // 1. SINCRONIZACIÓN CON EL PADRE
  // ---------------------------------------------
  useEffect(() => {
    if (request) {
      setFullRequestData(prev => {
        if (prev?._id !== request._id) {
          return { ...request };
        }
        return { ...prev, ...request };
      });
    }
  }, [request]);

  // Al abrir o cambiar de request, volver a la pestaña principal
  useEffect(() => {
    if (isVisible) {
      setActiveTab('details');
    }
  }, [isVisible, request?._id]);

  // --- NUEVA FUNCIÓN PARA OBTENER DATOS APROBADOS ---
  const fetchApprovedData = async (responseId) => {
    setIsLoadingApprovedData(true);
    try {
      const response = await fetch(`https://back-acciona.vercel.app/api/respuestas/data-approved/${responseId}`);
      if (response.ok) {
        const data = await response.json();
        setApprovedData(data);
      } else {
        setApprovedData(null);
      }
    } catch (error) {
      console.error('Error obteniendo datos de aprobado:', error);
      setApprovedData(null);
    } finally {
      setIsLoadingApprovedData(false);
    }
  };

  const checkClientSignature = async () => {
    setIsCheckingSignature(true);
    try {
      const response = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}/has-client-signature`);
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
    } finally {
      setIsCheckingSignature(false);
    }
  };

  const getDocumentInfo = async (responseId) => {
    try {
      const response = await fetch(`https://back-acciona.vercel.app/api/generador/info-by-response/${responseId}`);
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

  useEffect(() => {
    if (request?.correctedFile) {
      setCorrectedFile({
        name: request.correctedFile.fileName,
        size: request.correctedFile.fileSize,
        url: `https://back-acciona.vercel.app/api/respuestas/${request._id}/corrected-file`,
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

  useEffect(() => {
    if (!isVisible || !request?._id) {
      setDocumentInfo(null);
      setApprovedData(null);
      return;
    }

    const responseId = request._id;

    const fetchFullDetailsAndDocs = async () => {
      setIsDetailLoading(true);
      try {
        const response = await fetch(`https://back-acciona.vercel.app/api/respuestas/${responseId}`);
        if (response.ok) {
          const data = await response.json();
          setFullRequestData(prev => ({
            ...prev,
            ...data
          }));
          await getDocumentInfo(responseId);
        }
      } catch (error) {
        console.error('Error cargando detalles completos:', error);
      } finally {
        setIsDetailLoading(false);
      }
    };

    fetchFullDetailsAndDocs();
    fetchAttachments(responseId);
    checkClientSignature(responseId);
    fetchApprovedData(responseId);

  }, [isVisible, request?._id]);


  // ---------------------------------------------
  //           FUNCIONES DE MANEJO
  // ---------------------------------------------

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

  const cleanupPreviewUrl = (url) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    if (!isVisible || !request?._id) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}`);
        if (response.ok) {
          const updatedRequest = await response.json();
          if (updatedRequest.status !== request.status) {
            if (onUpdate) onUpdate(updatedRequest);
            setFullRequestData(prev => ({ ...prev, status: updatedRequest.status }));
            fetchApprovedData(request._id);
          }
        }
      } catch (error) {
        console.error('Error verificando actualización del request:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isVisible, request?._id, request?.status, onUpdate]);

  useEffect(() => {
    return () => {
      if (previewDocument?.url && previewDocument?.type === 'pdf') {
        cleanupPreviewUrl(previewDocument.url);
      }
    };
  }, [previewDocument]);

  // --- NUEVAS FUNCIONES PARA NAVEGACIÓN DE ESTADOS ---
  const handleStatusChange = async (newStatus) => {
    if (!confirm(`¿Cambiar estado a "${newStatus}"?`)) return;
    
    try {
      const response = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (onUpdate && result.updatedRequest) {
          onUpdate(result.updatedRequest);
          setFullRequestData(result.updatedRequest);
        }
        alert(`Estado cambiado a "${newStatus}"`);
      } else {
        const errorData = await response.json();
        alert('Error: ' + (errorData.error || 'No se pudo cambiar el estado'));
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error cambiando estado: ' + error.message);
    }
  };

  // Función para obtener el estado anterior
  const getPreviousStatus = (currentStatus) => {
    const statusFlow = ['pendiente', 'en_revision', 'aprobado', 'firmado', 'finalizado', 'archivado'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex > 0 ? statusFlow[currentIndex - 1] : null;
  };

  // Función para obtener el siguiente estado
  const getNextStatus = (currentStatus) => {
    const statusFlow = ['pendiente', 'en_revision', 'aprobado', 'firmado', 'finalizado', 'archivado'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
  };

  if (!isVisible || !request) return null;

  const handlePreviewDocument = (documentUrl, documentType) => {
    if (!documentUrl) {
      alert('No hay documento disponible para vista previa');
      return;
    }
    setPreviewDocument({ url: documentUrl, type: documentType });
    setShowPreview(true);
  };

  const handlePreviewGenerated = async () => {
    try {
      setIsLoadingPreviewGenerated(true);
      const info = documentInfo || await getDocumentInfo(request._id);
      if (!info || !info.IDdoc) {
        alert('No hay documento generado disponible para vista previa');
        return;
      }
      const documentUrl = `https://back-acciona.vercel.app/api/generador/download/${info.IDdoc}`;
      const extension = info.tipo || 'docx';
      handlePreviewDocument(documentUrl, extension);
    } catch (error) {
      console.error('Error en vista previa:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsLoadingPreviewGenerated(false);
    }
  };

  const handlePreviewCorrected = async () => {
    const hasFile = correctedFile || approvedData || fullRequestData?.correctedFile;
    if (!hasFile) {
      alert('No hay documento corregido para vista previa');
      return;
    }

    try {
      setIsLoadingPreviewCorrected(true);
      let documentUrl;

      if (correctedFile && correctedFile instanceof File) {
        documentUrl = URL.createObjectURL(correctedFile);
      }
      else if (approvedData || request?.status === 'aprobado' || request?.status === 'firmado') {
        const pdfUrl = `https://back-acciona.vercel.app/api/respuestas/download-approved-pdf/${request._id}`;
        documentUrl = await downloadPdfForPreview(pdfUrl);
      }
      else if (request?.correctedFile) {
        alert('El documento corregido está en proceso de revisión.');
        return;
      } else {
        alert('No hay documento corregido disponible');
        return;
      }
      handlePreviewDocument(documentUrl, 'pdf');
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsLoadingPreviewCorrected(false);
    }
  };

  const handlePreviewClientSignature = async () => {
    if (!clientSignature) {
      alert('No hay documento firmado para vista previa');
      return;
    }
    try {
      setIsLoadingPreviewSignature(true);
      const pdfUrl = `https://back-acciona.vercel.app/api/respuestas/${request._id}/client-signature`;
      const documentUrl = await downloadPdfForPreview(pdfUrl);
      handlePreviewDocument(documentUrl, 'pdf');
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsLoadingPreviewSignature(false);
    }
  };

  const handlePreviewAdjunto = async (responseId, index) => {
    try {
      setIsLoadingPreviewAdjunto(true);
      const adjunto = fullRequestData.adjuntos[index];
      if (adjunto.mimeType !== 'application/pdf') {
        alert('Solo disponible para PDF');
        return;
      }
      const pdfUrl = `https://back-acciona.vercel.app/api/respuestas/${responseId}/adjuntos/${index}`;
      const documentUrl = await downloadPdfForPreview(pdfUrl);
      handlePreviewDocument(documentUrl, 'pdf');
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsLoadingPreviewAdjunto(false);
    }
  };

  const handleRegenerateDocument = async () => {
    if (!confirm('¿Regenerar documento?')) return;
    setIsRegenerating(true);
    try {
      const response = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}/regenerate-document`, { method: 'POST' });
      if (response.ok) {
        await getDocumentInfo(request._id);
        alert('Documento regenerado exitosamente');
      } else {
        const errorData = await response.json();
        alert('Error: ' + (errorData.error || 'Desconocido'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const info = documentInfo || await getDocumentInfo(request._id);
      if (!info || !info.IDdoc) {
        alert('No hay documento disponible');
        return;
      }
      window.open(`https://back-acciona.vercel.app/api/generador/download/${info.IDdoc}`, '_blank');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al descargar');
    } finally {
      setIsDownloading(false);
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

  const handleDownloadClientSignature = async (responseId) => {
    setIsDownloadingSignature(true);
    try {
      const response = await fetch(`https://back-acciona.vercel.app/api/respuestas/${responseId}/client-signature`);
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
        alert(errorData.error || 'Error descargando');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error descargando');
    } finally {
      setIsDownloadingSignature(false);
    }
  };

  const handleDeleteClientSignature = async (responseId) => {
    if (!confirm('¿Eliminar documento firmado por el cliente?')) return;
    try {
      const response = await fetch(`https://back-acciona.vercel.app/api/respuestas/${responseId}/client-signature`, { method: 'DELETE' });
      if (response.ok) {
        setClientSignature(null);
        alert('Eliminado exitosamente');
        if (onUpdate) {
          const updatedResponse = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}`);
          const updatedRequest = await updatedResponse.json();
          onUpdate(updatedRequest);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error eliminando');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error eliminando');
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
    if (correctedFile && correctedFile instanceof File) {
      setCorrectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    try {
      const signatureCheck = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}/has-client-signature`);
      const signatureData = await signatureCheck.json();
      const hasSignature = signatureData.exists;
      let warningMessage = '¿Eliminar corrección y volver a revisión?';
      if (hasSignature) warningMessage = 'ADVERTENCIA: Existe documento firmado. ¿Continuar?';
      if (!confirm(warningMessage)) return;

      const response = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}/remove-correction`, { method: 'DELETE' });
      const result = await response.json();
      if (response.ok) {
        if (onUpdate && result.updatedRequest) onUpdate(result.updatedRequest);
        setCorrectedFile(null);
        setApprovedData(null);
        if (result.hasExistingSignature) alert('Corrección eliminada. Estado volverá a firmado al subir nueva.');
        else alert('Corrección eliminada, vuelve a revisión.');
      } else {
        alert(result.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar');
    }
  };

  const handleApprove = async () => {
    if (!correctedFile || isApproving || request?.status === 'aprobado' || request?.status === 'firmado') return;
    if (!confirm('¿Aprobar formulario? Acción irreversible.')) return;
    setIsApproving(true);
    try {
      const formData = new FormData();
      formData.append('correctedFile', correctedFile);
      const approveResponse = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}/approve`, {
        method: 'POST',
        body: formData,
      });
      if (approveResponse.ok) {
        if (onUpdate) {
          const updatedResponse = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}`);
          const updatedRequest = await updatedResponse.json();
          onUpdate(updatedRequest);
          fetchApprovedData(request._id);
        }
        setCorrectedFile(null);
        alert('Formulario aprobado');
      } else {
        const errorData = await approveResponse.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleApprovewithoutFile = async () => {
    if (isApproving || request?.status === 'finalizado') return;
    if (!confirm('¿Estás seguro de que quieres finalizar este trabajo?')) return;
    setIsApproving(true);
    try {
      const approveResponse = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}/finalized`);
      if (approveResponse.ok) {
        if (onUpdate) {
          const updatedResponse = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}`);
          const updatedRequest = await updatedResponse.json();
          onUpdate(updatedRequest);
        }
        alert('Finalizado correctamente');
      } else {
        const errorData = await approveResponse.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleArchieve = async () => {
    if (isApproving) return;
    if (!confirm('¿Estás seguro de que quieres archivar este trabajo?')) return;
    setIsApproving(true);
    try {
      const approveResponse = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}/archived`);
      if (approveResponse.ok) {
        if (onUpdate) {
          const updatedResponse = await fetch(`https://back-acciona.vercel.app/api/respuestas/${request._id}`);
          const updatedRequest = await updatedResponse.json();
          onUpdate(updatedRequest);
        }
        alert('Archivado correctamente');
      } else {
        const errorData = await approveResponse.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsApproving(false);
    }
  };


  const getRealAttachments = () => {
    if (!fullRequestData) return [];
    if (documentInfo && documentInfo.IDdoc) {
      let fileName = documentInfo.fileName;
      if (!fileName) {
        const formTitle = fullRequestData?.formTitle || 'Documento';
        const nombreTrabajador = fullRequestData?.responses?.["Nombre del trabajador"] || 'Trabajador';
        fileName = `${formTitle}_${nombreTrabajador}`.normalize('NFD')
          // Reemplazar caracteres especiales del español
          .replace(/ñ/g, 'n')
          .replace(/Ñ/g, 'N')
          .replace(/á/g, 'a')
          .replace(/é/g, 'e')
          .replace(/í/g, 'i')
          .replace(/ó/g, 'o')
          .replace(/ú/g, 'u')
          .replace(/Á/g, 'A')
          .replace(/É/g, 'E')
          .replace(/Í/g, 'I')
          .replace(/Ó/g, 'O')
          .replace(/Ú/g, 'U')
          .replace(/ü/g, 'u')
          .replace(/Ü/g, 'U')
          // Eliminar cualquier otro diacrítico
          .replace(/[\u0300-\u036f]/g, '')
          // Eliminar caracteres especiales restantes
          .replace(/[^a-zA-Z0-9\s._-]/g, '')
          // Reemplazar espacios múltiples por un solo guión bajo
          .replace(/\s+/g, '_')
          // Limitar longitud
          .substring(0, 100)
          .toUpperCase();
      }
      const tipo = documentInfo.tipo || 'docx';
      return [{
        id: documentInfo.IDdoc,
        name: `${fileName}.${tipo}`,
        size: "Calculando...",
        type: tipo,
        uploadedAt: documentInfo.createdAt || fullRequestData?.submittedAt,
        downloadUrl: `/api/documents/download/${documentInfo.IDdoc}`
      }];
    }
    return [];
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': case 'pendiente': return 'bg-error text-error-foreground';
      case 'in_review': case 'en_revision': return 'bg-secondary text-secondary-foreground';
      case 'approved': case 'aprobado': return 'bg-warning text-warning-foreground';
      case 'signed': case 'firmado': return 'bg-success text-success-foreground';
      case 'finalizado': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': case 'aprobado': return 'CheckCircle';
      case 'pending': case 'pendiente': return 'Clock';
      case 'in_review': case 'en_revision': return 'Eye';
      case 'rejected': case 'rechazado': return 'XCircle';
      case 'borrador': return 'FileText';
      case 'signed': case 'firmado': return 'CheckSquare';
      default: return 'Circle';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    return new Date(dateString)?.toLocaleDateString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
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
      case 'pdf': return 'FileText';
      case 'docx': case 'doc': return 'FileText';
      case 'xlsx': case 'xls': return 'FileSpreadsheet';
      case 'jpg': case 'jpeg': case 'png': return 'Image';
      default: return 'File';
    }
  };

  const getMimeTypeIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return 'FileText';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return 'FileText';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return 'FileSpreadsheet';
    if (mimeType?.includes('image')) return 'Image';
    return 'File';
  };

  const canPreviewAdjunto = (mimeType) => mimeType === 'application/pdf';

  const realAttachments = getRealAttachments();

  // --- COMPONENTES INTERNOS DE RENDERIZADO ---

  const renderDetailsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Enviado por:</span>
          <span className="text-sm font-medium text-foreground">{fullRequestData?.submittedBy}, {fullRequestData?.company}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Fecha de envío:</span>
          <span className="text-sm font-medium text-foreground">{formatDate(fullRequestData?.submittedAt)}</span>
        </div>
      </div>

      {/* ADJUNTOS */}
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
                    onClick={() => handleDownloadAdjunto(fullRequestData._id, index)}
                    disabled={downloadingAttachmentIndex !== null}
                  >
                    {downloadingAttachmentIndex === index ? 'Descargando...' : 'Descargar'}
                  </Button>
                  {canPreviewAdjunto(adjunto.mimeType) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName={isLoadingPreviewAdjunto ? "Loader" : "Eye"}
                      iconPosition="left"
                      iconSize={16}
                      onClick={() => handlePreviewAdjunto(fullRequestData._id, index)}
                      disabled={isLoadingPreviewAdjunto}
                    >
                      {isLoadingPreviewAdjunto ? 'Cargando...' : 'Vista Previa'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DOCUMENTO GENERADO */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          Documento Generado
          {isDetailLoading && <Icon name="Loader" size={16} className="animate-spin text-accent" />}
        </h3>
        {realAttachments?.length > 0 ? (
          <div className="space-y-2">
            {realAttachments?.map((file) => (
              <div key={file?.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon name={getFileIcon(file?.type)} size={20} className="text-accent" />
                  <div>
                    <p className="text-sm font-medium text-foreground" title={file?.name}>
                      {file?.name?.length > 45 ? `${file.name.substring(0, 45)}...` : file?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file?.size} • Generado el {formatDate(file?.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    iconName={isDownloading ? "Loader" : "Download"}
                    iconPosition="left"
                    iconSize={16}
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    {isDownloading ? 'Descargando...' : 'Descargar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePreviewGenerated}
                    iconName={isLoadingPreviewGenerated ? "Loader" : "Eye"}
                    iconPosition="left"
                    iconSize={16}
                    disabled={isLoadingPreviewGenerated}
                  >
                    {isLoadingPreviewGenerated ? 'Cargando...' : 'Vista Previa'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateDocument}
                    iconName={isRegenerating ? "Loader" : "RefreshCw"}
                    iconPosition="left"
                    iconSize={16}
                    disabled={isRegenerating}
                  >
                    {isRegenerating ? 'Regenerando...' : 'Regenerar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">

            <p className="text-sm">No hay documentos generados para este formulario</p>
          </div>
        )}
      </div>

      {/* DOCUMENTO CORREGIDO */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          Documento Corregido
          {isLoadingApprovedData && <Icon name="Loader" size={16} className="animate-spin text-accent" />}
        </h3>
        <div className="bg-muted/50 rounded-lg p-4">
          {correctedFile || approvedData || fullRequestData?.correctedFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon name="FileText" size={20} className="text-accent" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {correctedFile?.name || approvedData?.fileName || fullRequestData?.correctedFile?.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {correctedFile?.size
                      ? `${(correctedFile.size / 1024 / 1024).toFixed(2)} MB`
                      : approvedData?.fileSize
                        ? formatFileSize(approvedData.fileSize)
                        : fullRequestData?.correctedFile?.fileSize
                          ? formatFileSize(fullRequestData.correctedFile.fileSize)
                          : 'Tamaño no disponible'}
                  </p>
                  {(fullRequestData?.status === 'aprobado' || fullRequestData?.status === 'firmado') && (
                    <p className="text-xs text-success font-medium mt-1">
                      ✓ Formulario aprobado
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePreviewCorrected}
                  iconName={isLoadingPreviewCorrected ? "Loader" : "Eye"}
                  iconPosition="left"
                  iconSize={16}
                  disabled={isLoadingPreviewCorrected}
                >
                  {isLoadingPreviewCorrected ? 'Cargando...' : 'Vista Previa'}
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

      {/* DOCUMENTO FIRMADO */}
      {(fullRequestData?.status !== 'pendiente' && fullRequestData?.status !== 'en_revision') && (
        <div>
          {isCheckingSignature &&
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              Documento Firmado por Cliente
              {isCheckingSignature && <Icon name="Loader" size={16} className="animate-spin text-accent" />}
            </h3>
          }
          {!isCheckingSignature && clientSignature &&
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              Documento Firmado por Cliente
            </h3>
          }

          {clientSignature && (
            <div className="bg-success/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon name="FileSignature" size={20} className="text-success" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{clientSignature.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      Subido el {formatDate(clientSignature.uploadedAt)} • {formatFileSize(clientSignature.fileSize)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    iconName={isDownloadingSignature ? "Loader" : "Download"}
                    iconPosition="left"
                    iconSize={16}
                    onClick={() => handleDownloadClientSignature(fullRequestData._id)}
                    disabled={isDownloadingSignature}
                  >
                    {isDownloadingSignature ? 'Descargando...' : 'Descargar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePreviewClientSignature}
                    iconName={isLoadingPreviewSignature ? "Loader" : "Eye"}
                    iconPosition="left"
                    iconSize={16}
                    disabled={isLoadingPreviewSignature}
                  >
                    {isLoadingPreviewSignature ? 'Cargando...' : 'Vista Previa'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClientSignature(fullRequestData._id)}
                    className="text-error hover:bg-error/10"
                  >
                    <Icon name="Trash2" size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ) }
        </div>
      )}
    </div>
  );

  const renderResponsesTab = () => {
    // 1. Validamos que existan respuestas
    const responses = fullRequestData?.responses || {};
    const entries = Object.entries(responses);

    if (entries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
          <Icon name="FileText" size={32} className="mb-2 opacity-50" />
          <p>No hay respuestas registradas en este formulario.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icon name="List" size={20} className="text-accent" />
            Respuestas del Formulario
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map(([pregunta, respuesta], index) => (
              <div
                key={index}
                className="bg-muted/30 rounded-lg p-4 border border-border/50 hover:bg-muted/50 transition-colors"
              >
                {/* La Pregunta / Etiqueta */}
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 break-words">
                  {pregunta}
                </h4>

                {/* La Respuesta */}
                <div className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap break-words">
                  {/* Verificamos que sea un valor renderizable, por si viene un booleano u objeto */}
                  {respuesta !== null && typeof respuesta === 'object'
                    ? JSON.stringify(respuesta)
                    : String(respuesta || '-')
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-brand-active w-full max-w-4xl max-h-[90vh] overflow-y-auto">

        {/* HEADER: AHORA CONTIENE EL MENÚ DE PESTAÑAS */}
        <div className="sticky top-0 bg-card border-b border-border z-10">
          {/* Fila Superior: Título y Acciones */}
          <div className="flex items-center justify-between p-6 pb-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Icon name="FileText" size={24} className="text-accent" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{fullRequestData?.formTitle || fullRequestData?.title}</h2>
                  <p className="text-sm text-muted-foreground">ID: {fullRequestData?._id}</p>
                </div>
              </div>
              
              {/* NUEVO: Flechas de navegación de estado */}
              <div className="flex items-center space-x-2">
                {/* Flecha izquierda */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStatusChange(getPreviousStatus(fullRequestData?.status))}
                  disabled={!getPreviousStatus(fullRequestData?.status)}
                  iconName="ChevronLeft"
                  iconSize={16}
                  className="text-muted-foreground hover:text-foreground"
                />
                
                {/* Estado actual */}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(fullRequestData?.status)}`}>
                  <Icon name={getStatusIcon(fullRequestData?.status)} size={14} className="mr-2" />
                  {fullRequestData?.status?.replace('_', ' ')?.toUpperCase()}
                </span>
                
                {/* Flecha derecha */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStatusChange(getNextStatus(fullRequestData?.status))}
                  disabled={!getNextStatus(fullRequestData?.status)}
                  iconName="ChevronRight"
                  iconSize={16}
                  className="text-muted-foreground hover:text-foreground"
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              iconName="X"
              iconSize={20}
            />
          </div>

          {/* Fila Inferior: Pestañas de Navegación */}
          <div className="px-6 flex space-x-6 ">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 pt-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'details'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              Detalles
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`pb-3 pt-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'responses'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              Respuestas
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL CON RENDERIZADO CONDICIONAL */}
        <div className="p-6">
          {activeTab === 'details' ? renderDetailsTab() : renderResponsesTab()}
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 bg-card border-t border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Icon name="Clock" size={16} />
              <span>Última actualización: {formatDate(fullRequestData?.submittedAt)}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                iconName="MessageSquare"
                iconPosition="left"
                onClick={() => onSendMessage(fullRequestData)}
                iconSize={16}
              >
                Mensajes
              </Button>

              {correctedFile && fullRequestData?.status !== 'aprobado' && fullRequestData?.status !== 'firmado' && (
                <Button
                  variant="default"
                  iconName={isApproving ? "Loader" : "CheckCircle"}
                  iconPosition="left"
                  iconSize={16}
                  onClick={handleApprove}
                  disabled={!correctedFile || isApproving}
                >
                  {isApproving ? 'Aprobando...' : 'Aprobar'}
                </Button>
              )}
              {fullRequestData?.status !== 'finalizado' && (
                <Button
                  variant="default"
                  iconName={isApproving ? "Loader" : "CheckCircle"}
                  iconPosition="left"
                  iconSize={16}
                  onClick={handleApprovewithoutFile}
                >
                  {isApproving ? 'Finalizando...' : 'Finalizar'}
                </Button>
              )}

              {fullRequestData?.status == 'finalizado' && (
                <Button
                  variant="default"
                  iconName={isApproving ? "Loader" : "Folder"}
                  iconPosition="left"
                  iconSize={16}
                  onClick={handleArchieve}
                >
                  {isApproving ? 'Archivando...' : 'Archivar'}
                </Button>
              )}
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

      <CleanDocumentPreview
        isVisible={showPreview}
        onClose={() => {
          if (previewDocument?.url && previewDocument?.type === 'pdf') {
            cleanupPreviewUrl(previewDocument.url);
          }
          setShowPreview(false);
        }}
        resposes={request}
        documentUrl={previewDocument?.url}
        documentType={previewDocument?.type}
      />
    </div>
  );
};

export default RequestDetails;