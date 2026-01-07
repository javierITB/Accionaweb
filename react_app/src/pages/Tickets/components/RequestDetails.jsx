import React, { useState, useRef, useEffect } from 'react';
import { apiFetch, API_BASE_URL } from '../../../utils/api';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import CleanDocumentPreview from './CleanDocumentPreview';

// Límites configurados
const MAX_FILES = 5; // Máximo de archivos
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB en bytes

const RequestDetails = ({ request, isVisible, onClose, onUpdate }) => {
  // --- ESTADOS DE UI ---
  const [activeTab, setActiveTab] = useState('details');

  const [correctedFiles, setCorrectedFiles] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const [isApproving, setIsApproving] = useState(false);
  const fileInputRef = useRef(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);

  // Estados de carga para vistas previas
  const [isLoadingPreviewGenerated, setIsLoadingPreviewGenerated] = useState(false);
  const [isLoadingPreviewCorrected, setIsLoadingPreviewCorrected] = useState(false);

  const [isLoadingPreviewAdjunto, setIsLoadingPreviewAdjunto] = useState(false);

  const [documentInfo, setDocumentInfo] = useState(null);

  // --- NUEVO ESTADO PARA DATOS APROBADOS ---
  const [approvedData, setApprovedData] = useState(null);
  const [isLoadingApprovedData, setIsLoadingApprovedData] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFilesCount, setUploadedFilesCount] = useState(0);

  // Estado principal de datos
  const [fullRequestData, setFullRequestData] = useState({ ...request });
  const currentUser = sessionStorage.getItem("user");

  // Estados de carga de secciones
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);


  const [downloadingAttachmentIndex, setDownloadingAttachmentIndex] = useState(null);


  const [previewIndex, setPreviewIndex] = useState(0);
  const [isDeletingFile, setIsDeletingFile] = useState(null); // Para trackear qué archivo se está eliminando

  useEffect(() => {
    if (request) {
      setFullRequestData(prev => {
        if (prev?._id === request._id) {
          return { ...prev, ...request };
        }
        setCorrectedFiles([]);
        return { ...request };
      });
    }
  }, [request]);

  useEffect(() => {
    if (isVisible) {
      setActiveTab('details');
    }
  }, [isVisible, request?._id]);

  const fetchApprovedData = async (responseId) => {
    setIsLoadingApprovedData(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/soporte/data-approved/${responseId}`);
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



  const getDocumentInfo = async (responseId) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/generador/info-by-response/${responseId}`);
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



  const fetchAttachments = async (responseId) => {
    setAttachmentsLoading(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/soporte/${responseId}/adjuntos`);

      if (response.ok) {
        const data = await response.json();
        let extractedAdjuntos = [];
        if (Array.isArray(data) && data.length > 0 && data[0]?.adjuntos) {
          extractedAdjuntos = data[0].adjuntos;
        } else if (data && data.adjuntos) {
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
      setCorrectedFiles([{
        name: request.correctedFile.fileName,
        size: request.correctedFile.fileSize,
        url: `${API_BASE_URL}/soporte/${request._id}/corrected-file`,
        isServerFile: true
      }]);
    } else {
      setCorrectedFiles([]);
    }

    if (request?._id) {

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
        const response = await apiFetch(`${API_BASE_URL}/soporte/${responseId}`);
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

    fetchFullDetailsAndDocs().then(() => {
      // Solo buscar datos aprobados si el estado lo amerita
      const currentStatus = fullRequestData?.status || request?.status;
      if (['aprobado', 'firmado', 'finalizado', 'archivado'].includes(currentStatus)) {
        fetchApprovedData(responseId);
      }
    });
    fetchAttachments(responseId);


  }, [isVisible, request?._id]);

  const downloadPdfForPreview = async (url) => {
    try {
      const response = await apiFetch(url);
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
    const handleBeforeUnload = (e) => {
      if (correctedFiles.length > 0 && !isApproving) {
        e.preventDefault();
        e.returnValue = 'Tienes archivos cargados sin guardar. ¿Deseas salir?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [correctedFiles.length, isApproving]);

  useEffect(() => {
    if (!isVisible || !request?._id) return;

    const interval = setInterval(async () => {
      try {
        const response = await apiFetch(`${API_BASE_URL}/soporte/${request._id}`);
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

  const handleStatusChange = async (newStatus) => {
    if (!confirm(`¿Cambiar estado a "${newStatus}"?`)) return;

    try {
      const response = await apiFetch(`${API_BASE_URL}/soporte/${request._id}/status`, {
        method: 'PUT',
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

  const getPreviousStatus = (currentStatus) => {
    const statusFlow = ['pendiente', 'en_revision', 'finalizado', 'archivado'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex > 0 ? statusFlow[currentIndex - 1] : null;
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = ['pendiente', 'en_revision', 'finalizado', 'archivado'];
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


  const handlePreviewCorrectedFile = async (index = 0) => {
    const hasFiles = correctedFiles.length > 0 || approvedData || fullRequestData?.correctedFile;

    if (!hasFiles) {
      alert('No hay documentos corregidos para vista previa');
      return;
    }

    try {
      setIsLoadingPreviewCorrected(true);
      setPreviewIndex(index);

      let documentUrl;

      if (correctedFiles.length > 0) {
        if (index < 0 || index >= correctedFiles.length) {
          alert('Índice de archivo inválido');
          return;
        }
        const file = correctedFiles[index];
        if (file.isServerFile) {
          documentUrl = await downloadPdfForPreview(file.url);
        } else {
          documentUrl = URL.createObjectURL(file);
        }
      }
      else if (approvedData || request?.status === 'aprobado' || request?.status === 'firmado') {
        const pdfUrl = `${API_BASE_URL}/soporte/download-approved-pdf/${request._id}?index=${index}`;
        documentUrl = await downloadPdfForPreview(pdfUrl);
      }
      else if (request?.correctedFile) {
        alert('El documento corregido está en proceso de revisión.');
        return;
      } else {
        alert('No hay documentos corregidos disponibles');
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


  const handlePreviewAdjunto = async (responseId, index) => {
    try {
      setIsLoadingPreviewAdjunto(true);
      const adjunto = fullRequestData.adjuntos[index];
      if (adjunto.mimeType !== 'application/pdf') {
        alert('Solo disponible para PDF');
        return;
      }
      const pdfUrl = `${API_BASE_URL}/soporte/${responseId}/adjuntos/${index}`;
      const documentUrl = await downloadPdfForPreview(pdfUrl);
      handlePreviewDocument(documentUrl, 'pdf');
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsLoadingPreviewAdjunto(false);
    }
  };


  const handleDownloadAdjunto = async (responseId, index) => {
    setDownloadingAttachmentIndex(index);
    try {
      const response = await apiFetch(`${API_BASE_URL}/soporte/${responseId}/adjuntos/${index}`);
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


  const handleTakeTicket = async () => {
    if (!currentUser) {
      alert("Error: No se pudo identificar al usuario actual. Por favor, recarga la página o inicia sesión nuevamente.");
      return;
    }

    // Check if user is already assigned
    const currentAssigned = fullRequestData?.assignedTo;
    const isAssigned = Array.isArray(currentAssigned)
      ? currentAssigned.includes(currentUser)
      : currentAssigned === currentUser;

    if (isAssigned) {
      return; // Should not happen if button is hidden, but safety check
    }

    if (!confirm('¿Tomar este ticket para revisión?')) return;

    setIsApproving(true);
    try {
      // Logic to append user
      let previousAssignments = [];
      if (Array.isArray(currentAssigned)) {
        previousAssignments = currentAssigned;
      } else if (currentAssigned && currentAssigned !== 'Sin asignar' && currentAssigned !== '-') {
        previousAssignments = [currentAssigned];
      }

      previousAssignments = previousAssignments.filter(u => {
        if (!u) return false;
        const clean = String(u).trim();
        return clean !== '-' && clean !== 'Sin asignar' && clean !== '';
      });

      let newAssignedTo = [...previousAssignments, currentUser];

      newAssignedTo = [...new Set(newAssignedTo)];

      const response = await apiFetch(`${API_BASE_URL}/soporte/${request._id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'en_revision', assignedTo: newAssignedTo })
      });

      if (response.ok) {
        const result = await response.json();
        if (onUpdate && result.updatedRequest) {
          onUpdate(result.updatedRequest);
          setFullRequestData(result.updatedRequest);
        }
        alert(`Ticket tomado exitosamente`);
      } else {
        const errorData = await response.json();
        alert('Error: ' + (errorData.error || 'No se pudo tomar el ticket'));
      }
    } catch (error) {
      console.error('Error tomando ticket:', error);
      alert('Error tomando ticket: ' + error.message);
    } finally {
      setIsApproving(false);
    }
  };

  // Helper to displaying assigned users
  const displayAssignedUsers = () => {
    const assigned = fullRequestData?.assignedTo;
    if (!assigned || assigned === '-') return 'Sin asignar';

    if (Array.isArray(assigned)) {
      const validUsers = assigned.filter(u => {
        if (!u) return false;
        const clean = String(u).trim();
        return clean !== '-' && clean !== 'Sin asignar' && clean !== '';
      });

      if (validUsers.length === 0) return 'Sin asignar';
      return validUsers.join(', ');
    }

    if (typeof assigned === 'string' && assigned.includes(',')) {
      return assigned.split(',')
        .map(u => u.trim())
        .filter(u => u && u !== '-' && u !== 'Sin asignar')
        .join(', ');
    }

    return assigned;
  };

  const isUserAssigned = () => {
    const assigned = fullRequestData?.assignedTo;
    if (!assigned) return false;
    if (Array.isArray(assigned)) return assigned.includes(currentUser);
    return assigned === currentUser;
  };

  // ... skip to render ... 

  // Inside render (need to match context, splitting replace if needed but let's try to target specific blocks if easy,
  // or I can just replace the function and the display block separately).
  // Actually, I'll do separate replace calls to be safe.


  const handleApprovewithoutFile = async () => {
    if (isApproving || request?.status === 'finalizado') return;
    if (!confirm('¿Estás seguro de que quieres finalizar este trabajo?')) return;
    setIsApproving(true);
    try {
      const approveResponse = await apiFetch(`${API_BASE_URL}/soporte/${request._id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'finalizado' })
      });

      if (approveResponse.ok) {
        if (onUpdate) {
          const updatedResponse = await apiFetch(`${API_BASE_URL}/soporte/${request._id}`);
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
      const approveResponse = await apiFetch(`${API_BASE_URL}/soporte/${request._id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'archivado' })
      });

      if (approveResponse.ok) {
        if (onUpdate) {
          const updatedResponse = await apiFetch(`${API_BASE_URL}/soporte/${request._id}`);
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
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9\s._-]/g, '')
          .replace(/\s+/g, '_')
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
    if (bytes < 1048576) {
      const kb = (bytes / 1024).toFixed(2);
      if (bytes > 900 * 1024) {
        return `${kb} KB (cerca del límite)`;
      }
      return kb + ' KB';
    }
    const mb = (bytes / 1048576).toFixed(2);
    return `${mb} MB (EXCEDE LÍMITE)`;
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

  const findResponseValue = (responses, keys) => {
    if (!responses) return null;
    const lowerKeys = keys.map(k => k.toLowerCase());
    for (const [key, value] of Object.entries(responses)) {
      if (lowerKeys.includes(key.toLowerCase())) return value;
    }
    return null;
  };

  const renderDetailsTab = () => (
    <div className="space-y-6">

      {/* Subject Section */}
      <div className="bg-muted/10 p-5 rounded-lg border border-border/60 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Icon name="Type" size={16} className="text-accent" />
          Asunto
        </h3>
        <p className="text-lg font-bold text-foreground leading-tight">
          {findResponseValue(fullRequestData?.responses, ['Asunto', 'Título', 'Title', 'Subject', 'Tema']) || "Sin Asunto"}
        </p>
      </div>

      {/* Description Section */}
      <div className="bg-muted/10 p-5 rounded-lg border border-border/60 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Icon name="AlignLeft" size={16} className="text-accent" />
          Descripción del Ticket
        </h3>
        <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-background p-3 rounded border border-border/50">
          {findResponseValue(fullRequestData?.responses, ['Descripción', 'Descripcion', 'Description', 'Detalle', 'Mensaje']) ||
            fullRequestData?.description ||
            "Sin descripción proporcionada."}
        </div>
      </div>

      {/* Meta Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Sender Info */}
        <div className="bg-muted/30 p-3 rounded-lg border border-border/50 flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            <Icon name="User" size={16} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Enviado por</p>
            <p className="text-sm font-semibold text-foreground">{fullRequestData?.submittedBy || fullRequestData?.user?.nombre || 'Usuario Desconocido'}</p>
            <p className="text-xs text-muted-foreground">{fullRequestData?.company || fullRequestData?.user?.empresa || 'Empresa Desconocida'}</p>
          </div>
        </div>

        {/* Assigned Info */}
        <div className="bg-muted/30 p-3 rounded-lg border border-border/50 flex items-start gap-3">
          <div className={`p-2 rounded-full ${fullRequestData?.assignedTo ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
            <Icon name="ShieldCheck" size={16} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tomado por</p>
            <p className={`text-sm font-semibold ${(fullRequestData?.assignedTo && fullRequestData?.assignedTo !== '-') ? 'text-accent' : 'text-muted-foreground italic'}`}>
              {displayAssignedUsers()}
            </p>
          </div>
        </div>

        {/* Creation Date */}
        <div className="bg-muted/30 p-3 rounded-lg border border-border/50 flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0">
            <Icon name="Calendar" size={16} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Creado</p>
            <p className="text-sm font-semibold text-foreground">{formatDate(fullRequestData?.submittedAt)}</p>
          </div>
        </div>

        {/* Taken Date */}
        <div className="bg-muted/30 p-3 rounded-lg border border-border/50 flex items-start gap-3">
          <div className="p-2 bg-blue-500/10 rounded-full text-blue-600 shrink-0">
            <Icon name="UserCheck" size={16} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tomado</p>
            <p className="text-sm font-semibold text-foreground">
              {fullRequestData?.assignedAt ? formatDate(fullRequestData.assignedAt) : '-'}
            </p>
          </div>
        </div>

        {/* Estimated Date */}
        <div className="bg-muted/30 p-3 rounded-lg border border-border/50 flex items-start gap-3">
          <div className="p-2 bg-amber-500/10 rounded-full text-amber-600 shrink-0">
            <Icon name="Timer" size={16} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Est. Término</p>
            <p className="text-sm font-semibold text-foreground">
              {fullRequestData?.estimatedCompletionAt ? formatDate(fullRequestData.estimatedCompletionAt) : '-'}
            </p>
          </div>
        </div>

        {/* Completion Date */}
        <div className="bg-muted/30 p-3 rounded-lg border border-border/50 flex items-start gap-3">
          <div className="p-2 bg-green-500/10 rounded-full text-green-600 shrink-0">
            <Icon name="CheckCircle" size={16} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Término Real</p>
            <p className="text-sm font-semibold text-foreground">
              {fullRequestData?.finalizedAt ? formatDate(fullRequestData.finalizedAt) : (fullRequestData?.approvedAt ? formatDate(fullRequestData.approvedAt) : '-')}
            </p>
          </div>
        </div>
      </div>

      {/* Attachments Section */}
      <div>
        {attachmentsLoading &&
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            Archivos Adjuntos
            {attachmentsLoading && <Icon name="Loader" size={16} className="animate-spin text-accent" />}
          </h3>
        }
        {!attachmentsLoading && fullRequestData?.adjuntos?.length > 0 &&
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Icon name="Paperclip" size={18} />
            Archivos Adjuntos
          </h3>
        }
        {fullRequestData?.adjuntos?.length > 0 && (
          <div className="space-y-2">
            {fullRequestData.adjuntos.map((adjunto, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group hover:bg-muted transition-colors">
                <div className="flex items-center space-x-3">
                  <Icon name={getMimeTypeIcon(adjunto.mimeType)} size={20} className="text-accent group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{adjunto.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {adjunto.pregunta} • {formatFileSize(adjunto.size)} • {formatDate(adjunto.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName={downloadingAttachmentIndex === index ? "Loader" : "Download"}
                    iconPosition="left"
                    iconSize={16}
                    onClick={() => handleDownloadAdjunto(fullRequestData._id, index)}
                    disabled={downloadingAttachmentIndex !== null}
                    className="h-8 w-8 p-0 sm:w-auto sm:px-3 sm:h-9"
                  >
                    <span className="hidden sm:inline">{downloadingAttachmentIndex === index ? 'Descargando...' : 'Descargar'}</span>
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
                      className="h-8 w-8 p-0 sm:w-auto sm:px-3 sm:h-9"
                    >
                      <span className="hidden sm:inline">{isLoadingPreviewAdjunto ? 'Cargando...' : 'Vista Previa'}</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );

  const renderResponsesTab = () => {
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 break-words">
                  {pregunta}
                </h4>
                <div className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap break-words">
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

  const totalFiles = correctedFiles.length > 0
    ? correctedFiles.length
    : approvedData?.correctedFiles?.length || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-brand-active w-full max-w-4xl max-h-[90vh] overflow-y-auto">

        <div className="sticky top-0 bg-card border-b border-border z-10">
          <div className="flex items-center justify-between p-6 pb-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Icon name="FileText" size={24} className="text-accent" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {fullRequestData?.formTitle || fullRequestData?.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">ID: {fullRequestData?._id}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStatusChange(getPreviousStatus(fullRequestData?.status))}
                  disabled={!getPreviousStatus(fullRequestData?.status)}
                  iconName="ChevronLeft"
                  iconSize={16}
                  className="text-muted-foreground hover:text-foreground"
                />

                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(fullRequestData?.status)}`}>
                  <Icon name={getStatusIcon(fullRequestData?.status)} size={14} className="mr-2" />
                  {fullRequestData?.status?.replace('_', ' ')?.toUpperCase()}
                </span>

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

          <div className="px-6 flex space-x-6 ">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 pt-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'details'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              title="Ver detalles de la solicitud"
            >
              Detalles
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`pb-3 pt-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'responses'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              title="Ver respuestas del formulario"
            >
              Respuestas
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'details' ? renderDetailsTab() : renderResponsesTab()}
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Icon name="Clock" size={16} />
              <span>Última actualización: {formatDate(fullRequestData?.updatedAt || fullRequestData?.submittedAt)}</span>
            </div>
            <div className="flex items-center space-x-3">

              {(fullRequestData?.status === 'pendiente' || (fullRequestData?.status === 'en_revision' && !isUserAssigned())) && (
                <Button
                  variant="default"
                  iconName={isApproving ? "Loader" : "UserCheck"}
                  iconPosition="left"
                  iconSize={16}
                  onClick={handleTakeTicket}
                  disabled={isApproving}
                >
                  {isApproving ? 'Procesando...' : `Tomar Ticket`}
                </Button>
              )}

              {fullRequestData?.status === 'en_revision' && (
                <Button
                  variant="default"
                  iconName={isApproving ? "Loader" : "CheckCircle"}
                  iconPosition="left"
                  iconSize={16}
                  onClick={handleApprovewithoutFile}
                  disabled={isApproving}
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
        currentIndex={previewIndex}
        totalFiles={totalFiles}
        onNext={() => {
          const nextIndex = (previewIndex + 1) % totalFiles;
          setPreviewIndex(nextIndex);
          handlePreviewCorrectedFile(nextIndex);
        }}
        onPrevious={() => {
          const prevIndex = (previewIndex - 1 + totalFiles) % totalFiles;
          setPreviewIndex(prevIndex);
          handlePreviewCorrectedFile(prevIndex);
        }}
      />
    </div>
  );
};

export default RequestDetails;