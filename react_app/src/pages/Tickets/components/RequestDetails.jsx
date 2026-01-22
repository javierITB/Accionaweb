import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, API_BASE_URL } from '../../../utils/api';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import CleanDocumentPreview from './CleanDocumentPreview';
import {
  getStatusColorClass,
  findConfigForCategory,
  getStatusIcon,
  getDefaultStatusColor,
  formatStatusText
} from '../../../utils/ticketStatusStyles';

import AsyncActionDialog from 'components/AsyncActionDialog';
import useAsyncDialog from 'hooks/useAsyncDialog';

// Límites configurados
const MAX_FILES = 5; // Máximo de archivos
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB en bytes

const RequestDetails = ({ request, isVisible, onClose, onUpdate, ticketConfigs }) => {
  // --- ESTADOS DE UI ---
  const [activeTab, setActiveTab] = useState('details');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [correctedFiles, setCorrectedFiles] = useState([]);
  // const [isDownloading, setIsDownloading] = useState(false);

  const [isApproving, setIsApproving] = useState(false);
  // const fileInputRef = useRef(null);
  // const [isRegenerating, setIsRegenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);

  // Estados de carga para vistas previas
  // const [isLoadingPreviewGenerated, setIsLoadingPreviewGenerated] = useState(false);
  const [isLoadingPreviewCorrected, setIsLoadingPreviewCorrected] = useState(false);

  const [isLoadingPreviewAdjunto, setIsLoadingPreviewAdjunto] = useState(false);

  const [documentInfo, setDocumentInfo] = useState(null);

  // --- NUEVO ESTADO PARA DATOS APROBADOS ---
  const [approvedData, setApprovedData] = useState(null);
  // const [isLoadingApprovedData, setIsLoadingApprovedData] = useState(false);
  // const [uploadProgress, setUploadProgress] = useState(0);
  // const [isUploading, setIsUploading] = useState(false);
  // const [uploadedFilesCount, setUploadedFilesCount] = useState(0);

  // Estado principal de datos
  // IMPORTANTE: fullRequestData se usa en todo el componente
  const [fullRequestData, setFullRequestData] = useState({ ...request });
  const currentUser = sessionStorage.getItem("user");

  // Estados de carga de secciones
  // const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);


  const [downloadingAttachmentIndex, setDownloadingAttachmentIndex] = useState(null);


  const [previewIndex, setPreviewIndex] = useState(0);
  // const [isDeletingFile, setIsDeletingFile] = useState(null); // Para trackear qué archivo se está eliminando

  const { dialogProps, openAsyncDialog, openInfoDialog, openErrorDialog } = useAsyncDialog();

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
    // setIsLoadingApprovedData(true);
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
      // setIsLoadingApprovedData(false);
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
      // setIsDetailLoading(true);
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
        // setIsDetailLoading(false);
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

  // Función para obtener flujo de estados dinámico
  const getDynamicStatusFlow = () => {
    if (!ticketConfigs || ticketConfigs.length === 0) return ['pendiente', 'en_revision', 'finalizado', 'archivado'];

    // Detectar categoría (similar a RequestCard)
    // 1. Obtener la categoría del ticket
    const category = fullRequestData?.category || fullRequestData?.categoryData || fullRequestData?.responses?.['Categoría'] || 'General';

    // 2. Buscar la configuración para esa categoría
    const config = ticketConfigs.find(c => c.key === category) ||
      ticketConfigs.find(c => c.key === 'domicilio_virtual'); // Fallback común

    if (config && config.statuses && config.statuses.length > 0) {
      return config.statuses.map(s => s.value);
    }

    return ['pendiente', 'en_revision', 'finalizado', 'archivado'];
  };

  const getDynamicStatusConfig = (status) => {
    if (!ticketConfigs) return null;
    const category = fullRequestData?.category || fullRequestData?.categoryData || fullRequestData?.responses?.['Categoría'] || 'General';

    const config = findConfigForCategory(ticketConfigs, category) ||
      ticketConfigs.find(c => c.key === 'domicilio_virtual'); // Final fallback

    if (!config) return null;
    return config.statuses?.find(s => s.value === status);
  }

  /* Helper to check if status is initial */
  const isInitialStatus = () => {
    if (!ticketConfigs) return ['pendiente'].includes(fullRequestData?.status);
    const category = fullRequestData?.category || fullRequestData?.categoryData || fullRequestData?.responses?.['Categoría'] || 'General';

    const config = findConfigForCategory(ticketConfigs, category) ||
      ticketConfigs.find(c => c.key === 'domicilio_virtual');

    if (!config || !config.statuses || config.statuses.length === 0) return ['pendiente'].includes(fullRequestData?.status);
    return config.statuses[0].value === fullRequestData?.status;
  };

  // ... (existing effects)

  const handleStatusChange = async (newStatus) => {
    const response = await apiFetch(
      `${API_BASE_URL}/soporte/${request._id}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      }
    );

    const currentStatus = fullRequestData?.status;
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `No se pudo cambiar del estado "${currentStatus}" a "${newStatus}"`);
    }

    const result = await response.json();


    if (onUpdate && result.updatedRequest) {
      onUpdate(result.updatedRequest);

      setFullRequestData((prev) => ({
        ...prev,
        ...result.updatedRequest,
        adjuntos: prev.adjuntos,
      }));
    }

    return 'Estado cambiado a "' + newStatus + '" correctamente';
  };


  // const getPreviousStatus = (currentStatus) => {
  //   const statusFlow = getDynamicStatusFlow();
  //   const currentIndex = statusFlow.indexOf(currentStatus);
  //   return currentIndex > 0 ? statusFlow[currentIndex - 1] : null;
  // };

  // const getNextStatus = (currentStatus) => {
  //   const statusFlow = getDynamicStatusFlow();
  //   const currentIndex = statusFlow.indexOf(currentStatus);
  //   return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
  // };

  if (!isVisible || !request) return null;

  const handlePreviewDocument = (documentUrl, documentType) => {
    if (!documentUrl) {
      // alert('No hay documento disponible para vista previa');
      openInfoDialog('No hay documento disponible para vista previa');
      return;
    }
    setPreviewDocument({ url: documentUrl, type: documentType });
    setShowPreview(true);
  };


  const handlePreviewCorrectedFile = async (index = 0) => {
    const hasFiles = correctedFiles.length > 0 || approvedData || fullRequestData?.correctedFile;

    if (!hasFiles) {
      // alert('No hay documentos corregidos para vista previa');
      openInfoDialog('No hay documentos corregidos para vista previa');
      return;
    }

    try {
      setIsLoadingPreviewCorrected(true);
      setPreviewIndex(index);

      let documentUrl;

      if (correctedFiles.length > 0) {
        if (index < 0 || index >= correctedFiles.length) {
          openErrorDialog('El archivo seleccionado no es válido');
          // alert('El archivo seleccionado no es válido');
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
        // alert('El documento corregido está en proceso de revisión.');
        openInfoDialog('El documento corregido está en proceso de revisión.');
        return;
      } else {

        // alert('No hay documentos corregidos disponibles');
        openInfoDialog('No hay documentos corregidos disponibles');
        return;
      }

      handlePreviewDocument(documentUrl, 'pdf');
    } catch (error) {
      console.error('Error:', error);
      // alert('Error: ' + error.message);
      openErrorDialog('Error al abrir documento');
    } finally {
      setIsLoadingPreviewCorrected(false);
    }
  };


  const handlePreviewAdjunto = async (responseId, index) => {
    try {
      setIsLoadingPreviewAdjunto(true);
      const adjunto = fullRequestData.adjuntos[index];

      // Si tenemos la data en base64 directamente
      // Si tenemos la data en base64 directamente
      if (adjunto.fileData) {
        // ... (Base64 logic stays same but logging added above) ...
        const base64Data = adjunto.fileData.includes('base64,')
          ? adjunto.fileData.split('base64,')[1]
          : adjunto.fileData;

        try {
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: adjunto.mimeType || 'application/pdf' });
          const url = URL.createObjectURL(blob);

          handlePreviewDocument(url, adjunto.mimeType?.includes('image') ? 'image' : 'pdf');
        } catch (e) {
          console.error("Error creating blob:", e);
          // alert("Error procesando el archivo para vista previa.");
          openErrorDialog("Error al abrir documento");
        }
        return;
      }

      console.warn("No hay fileData local para adjunto", index);
      // alert("El contenido de este archivo no está disponible para vista previa.");
      openInfoDialog("El contenido de este archivo no está disponible para vista previa.");
      return;

      // Fallback a descarga si no hay data local
      // if (adjunto.mimeType !== 'application/pdf' && !adjunto.mimeType?.includes('image')) {
      //   alert('Vista previa solo disponible para PDF e Imágenes');
      //   return;
      // }

      // const pdfUrl = `${API_BASE_URL}/respuestas/${responseId}/adjuntos/${index}`;
      // const documentUrl = await downloadPdfForPreview(pdfUrl);

      // handlePreviewDocument(documentUrl, adjunto.mimeType?.includes('image') ? 'image' : 'pdf');

    } catch (error) {
      console.error('Error:', error);
      // alert('Error: ' + error.message);
      openErrorDialog('Error al abrir documento');
    } finally {
      setIsLoadingPreviewAdjunto(false);
    }
  };


  const handleDownloadAdjunto = async (responseId, index) => {
    setDownloadingAttachmentIndex(index);
    try {
      const adjunto = fullRequestData.adjuntos[index];

      // Intentar descarga local primero si existe fileData
      if (adjunto.fileData) {
        const base64Data = adjunto.fileData.includes('base64,')
          ? adjunto.fileData.split('base64,')[1]
          : adjunto.fileData;

        try {
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: adjunto.mimeType || 'application/octet-stream' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = adjunto.fileName || `archivo-${index}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (e) {
          console.error("Error creating download blob:", e);
          // alert("Error procesando el archivo para descarga.");
          openErrorDialog("Error al descargar archivo");
        }
        return;
      }

      // Si no hay data local, avisar y no llamar al endpoint (que daría 404)
      console.warn("No hay fileData local para descarga adjunto", index);
      // alert("El contenido de este archivo no está disponible para descarga.");
      openInfoDialog("El contenido de este archivo no está disponible para descarga.");
      return;

    } catch (error) {
      console.error('Error:', error);
      // alert('Error al descargar');
      openErrorDialog('Error al descargar archivo');
    } finally {
      setDownloadingAttachmentIndex(null);
    }
  };


  const handleTakeTicket = async () => {
    if (!currentUser) {
      throw new Error(
        "No se pudo identificar al usuario actual. Por favor, recarga la página o inicia sesión nuevamente."
      );
    }

    const currentAssigned = fullRequestData?.assignedTo;

    const isAssigned = Array.isArray(currentAssigned)
      ? currentAssigned.includes(currentUser)
      : currentAssigned === currentUser;

    // Seguridad extra (aunque el botón esté oculto)
    if (isAssigned) return;

    // Normalizar asignaciones previas
    let previousAssignments = [];

    if (Array.isArray(currentAssigned)) {
      previousAssignments = currentAssigned;
    } else if (
      currentAssigned &&
      currentAssigned !== "Sin asignar" &&
      currentAssigned !== "-"
    ) {
      previousAssignments = [currentAssigned];
    }

    previousAssignments = previousAssignments.filter((u) => {
      if (!u) return false;
      const clean = String(u).trim();
      return clean !== "-" && clean !== "Sin asignar" && clean !== "";
    });

    const newAssignedTo = [...new Set([...previousAssignments, currentUser])];

    const response = await apiFetch(
      `${API_BASE_URL}/soporte/${request._id}/status`,
      {
        method: "PUT",
        body: JSON.stringify({
          status: "en_revision",
          assignedTo: newAssignedTo,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "No se pudo tomar el ticket");
    }

    const result = await response.json();

    if (onUpdate && result.updatedRequest) {
      onUpdate(result.updatedRequest);

      setFullRequestData((prev) => ({
        ...prev,
        ...result.updatedRequest,
        adjuntos: prev.adjuntos, // preservar adjuntos
      }));
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
    // guard lógico (no UI)
    if (request?.status === "finalizado") return { type: "info", message: "Formulario ya finalizado" };

    const response = await apiFetch(
      `${API_BASE_URL}/soporte/${request._id}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status: "finalizado" }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(errorData);
      throw new Error("Error al finalizar el trabajo");
    }

    if (onUpdate) {
      const updatedResponse = await apiFetch(
        `${API_BASE_URL}/soporte/${request._id}`
      );
      const updatedRequest = await updatedResponse.json();
      onUpdate(updatedRequest);
    }
  };


  const handleArchieve = async () => {
    const response = await apiFetch(
      `${API_BASE_URL}/soporte/${request._id}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status: "archivado" }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(errorData);
      throw new Error("Error al archivar ticket");
    }

    if (onUpdate) {
      const updatedResponse = await apiFetch(
        `${API_BASE_URL}/soporte/${request._id}`
      );
      const updatedRequest = await updatedResponse.json();
      onUpdate(updatedRequest);
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

  const findResponseValue = (responses, searchKeys, ignore = []) => {
    if (!responses) return null;
    const responseKeys = Object.keys(responses);

    for (const searchKey of searchKeys) {
      const cleanSearch = searchKey.toLowerCase().trim();
      const foundKey = responseKeys.find(k => {
        const cleanK = k.toLowerCase().trim().replace(':', '');
        if (ignore.some(ign => cleanK.includes(ign))) return false;
        return cleanK.includes(cleanSearch);
      });
      if (foundKey) return responses[foundKey];
    }
    return null;
  };

  const renderDetailsTab = () => (
    <div className="space-y-6">

      {/* Subject Section */}
      {fullRequestData?.origin !== 'domicilio_virtual' && (
        <div className="bg-muted/10 p-5 rounded-lg border border-border/60 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Icon name="Type" size={16} className="text-accent" />
            Asunto
          </h3>
          <p className="text-lg font-bold text-foreground leading-tight">
            {findResponseValue(fullRequestData?.responses, ['Asunto', 'Título', 'Title', 'Subject', 'Tema']) || "Sin Asunto"}
          </p>
        </div>
      )}

      {/* Description Section */}
      {fullRequestData?.origin !== 'domicilio_virtual' && (
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
      )}

      {/* Meta Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Sender Info */}
        <div className="bg-muted/30 p-3 rounded-lg border border-border/50 flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            <Icon name="User" size={16} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Enviado por</p>
            <p className="text-sm font-semibold text-foreground">
              {fullRequestData?.origin === 'domicilio_virtual'
                ? (findResponseValue(fullRequestData?.responses, ['nombre o razón social', 'nombre que llevará la empresa', 'razón social', 'razon social', 'empresa', 'cliente'], ['rut', 'teléfono', 'telefono', 'celular', 'mail', 'correo', 'dirección', 'direccion', 'calle']) || 'Empresa Desconocida')
                : (fullRequestData?.submittedBy || fullRequestData?.user?.nombre || 'Usuario Desconocido')
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {fullRequestData?.origin === 'domicilio_virtual'
                ? (findResponseValue(fullRequestData?.responses, ['rut de la empresa', 'rut representante legal']) || 'Sin RUT')
                : (fullRequestData?.company || fullRequestData?.user?.empresa || 'Empresa Desconocida')
              }
            </p>
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
            <p className="text-sm font-semibold text-foreground">{formatDate(fullRequestData?.submittedAt || fullRequestData?.createdAt)}</p>
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
              {fullRequestData?.estimatedCompletionAt || fullRequestData?.expirationDate ? formatDate(fullRequestData?.estimatedCompletionAt || fullRequestData?.expirationDate) : '-'}
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
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    {/* Priorizamos la Subcategoría de la base de datos */}
                    {fullRequestData?.origin === 'domicilio_virtual' && fullRequestData?.relatedRequestId ? (
                      <Link
                        to={`/DomicilioVirtual?id=${fullRequestData.relatedRequestId}`}
                        className="flex items-center gap-2 hover:text-accent transition-colors"
                        title="Ver detalle en Domicilio Virtual"
                      >
                        {fullRequestData?.responses?.['Subcategoría'] || fullRequestData?.formTitle || fullRequestData?.title}
                        <Icon name="ExternalLink" size={16} className="text-muted-foreground" />
                      </Link>
                    ) : (
                      <span>
                        {fullRequestData?.responses?.['Subcategoría'] || fullRequestData?.formTitle || fullRequestData?.title}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground">ID: {fullRequestData?._id}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Dynamic Status Dropdown */}
                <div className="relative" ref={statusDropdownRef}>
                  {(() => {
                    const currentStatus = fullRequestData?.status;
                    const category = fullRequestData?.category || fullRequestData?.categoryData || fullRequestData?.responses?.['Categoría'] || 'General';
                    const config = findConfigForCategory(ticketConfigs, category) ||
                      ticketConfigs?.find(c => c.key === 'domicilio_virtual');

                    // Fallback configuration if none found or for default statuses
                    const statusDef = config?.statuses?.find(s => s.value === currentStatus);

                    const triggerColorClass = statusDef
                      ? getStatusColorClass(statusDef.color)
                      : getDefaultStatusColor(currentStatus);

                    const triggerIconName = statusDef ? statusDef.icon : getStatusIcon(currentStatus);
                    const triggerLabel = statusDef ? statusDef.label : formatStatusText(currentStatus);

                    return (
                      <>
                        <button
                          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-opacity hover:opacity-80 ${triggerColorClass}`}
                          title="Cambiar estado"
                        >
                          <Icon name={triggerIconName} size={14} className="mr-2" />
                          <span className="uppercase">{triggerLabel}</span>
                          <Icon name="ChevronDown" size={14} className="ml-2 opacity-50" />
                        </button>

                        {/* Dropdown Menu */}
                        {isStatusDropdownOpen && (
                          <div className="absolute top-full left-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-1">
                              {(() => {
                                // Combine configured statuses with global "Archivado"
                                const baseStatuses = config?.statuses || [];
                                const hasArchived = baseStatuses.some(s => s.value === 'archivado');

                                const allStatuses = [...baseStatuses];
                                if (!hasArchived) {
                                  allStatuses.push({
                                    value: 'archivado',
                                    label: 'Archivado',
                                    color: 'slate', // Default color, has text-white
                                    icon: 'Folder'
                                  });
                                }

                                return allStatuses.map((st) => (
                                  <button
                                    key={st.value}
                                    onClick={() => {
                                      openAsyncDialog({
                                        title: `¿Está seguro de que quiere cambiar el estado a "${st.label}"?`,
                                        loadingText: `Cambiando estado a "${st.label}"...`,
                                        successText: "Estado cambiado correctamente",
                                        errorText: "No se pudo cambiar el estado",
                                        onConfirm: () => handleStatusChange(st.value)
                                      });
                                      setIsStatusDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center space-x-3 transition-colors ${currentStatus === st.value
                                      ? 'bg-accent/10 text-accent font-medium'
                                      : 'hover:bg-accent/5 text-foreground'
                                      }`}
                                  >
                                    {/* Dot indicator matching the status color */}
                                    {/* Icon matching the status */}
                                    <Icon name={st.icon || 'Circle'} size={14} className={`${getStatusColorClass(st.color).replace('bg-', 'text-').replace('/10', '').split(' ')[0]}`} />
                                    <span>{st.label}</span>
                                    {currentStatus === st.value && <Icon name="Check" size={14} className="ml-auto opacity-70" />}
                                  </button>
                                ));
                              })()}
                            </div>
                          </div>
                        )}


                      </>
                    );
                  })()}
                </div>
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
            {fullRequestData?.origin !== 'domicilio_virtual' && (
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
            )}
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

              {(isInitialStatus() || (fullRequestData?.status === 'en_revision' && !isUserAssigned())) && (


                <Button
                  variant="default"
                  iconName={isApproving ? "Loader" : "UserCheck"}
                  iconPosition="left"
                  iconSize={16}
                  onClick={() => {
                    openAsyncDialog({
                      title: `¿Está seguro de que quiere tomar este ticket?`,
                      loadingText: `Tomando ticket...`,
                      successText: "Ticket tomado exitosamente",
                      errorText: "Error al tomar ticket",
                      onConfirm: handleTakeTicket
                    });
                  }}
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
                  onClick={() => {
                    openAsyncDialog({
                      title: `¿Está seguro de que quiere finalizar este ticket?`,
                      loadingText: `Finalizando ticket...`,
                      successText: "Ticket finalizado exitosamente",
                      errorText: "Error al finalizar ticket",
                      onConfirm: handleApprovewithoutFile
                    });
                  }}
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
                  onClick={() => {
                    openAsyncDialog({
                      title: `¿Está seguro de que quiere archivar este ticket?`,
                      loadingText: `Archivando ticket...`,
                      successText: "Ticket archivado exitosamente",
                      errorText: "Error al archivar ticket",
                      onConfirm: handleArchieve
                    });
                  }}
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
      <AsyncActionDialog {...dialogProps} />
    </div>
  );
};

export default RequestDetails;