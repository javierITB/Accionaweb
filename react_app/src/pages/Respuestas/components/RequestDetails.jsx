import React, { useState, useEffect, useRef } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import CleanDocumentPreview from "./CleanDocumentPreview";
import { apiFetch, API_BASE_URL } from "../../../utils/api";
import useAsyncDialog from "hooks/useAsyncDialog";
import AsyncActionDialog from "@/components/AsyncActionDialog";
import {
   getStatusColorClass,
   getStatusIcon as getStatusIconUtil,
   getDefaultStatusColor,
   formatStatusText,
} from "../../../utils/ticketStatusStyles";

import TimelineView from "../components/TimelineView";

// Límites configurados
const MAX_FILES = 5; // Máximo de archivos
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 1MB en bytes

const RequestDetails = ({
   request,
   isVisible,
   onClose,
   onUpdate,
   onSendMessage,
   isStandalone = false,
   endpointPrefix = "respuestas",
   onGenerateDoc,
   userPermissions,
}) => {
   // --- CONFIGURACIÓN DE ESTADOS ---
   const requestsConfig = {
      statuses: [
         {
            value: "pendiente",
            label: "Pendiente",
            className: "bg-error text-error-foreground",
            listIconClass: "text-error",
            icon: "Clock",
         },
         {
            value: "en_revision",
            label: "En Revisión",
            className: "bg-secondary text-secondary-foreground",
            listIconClass: "text-secondary",
            icon: "Eye",
         },
         {
            value: "aprobado",
            label: "Aprobado",
            className: "bg-warning text-warning-foreground",
            listIconClass: "text-yellow-600",
            icon: "CheckCircle",
         },
         {
            value: "firmado",
            label: "Firmado",
            className: "bg-success text-success-foreground",
            listIconClass: "text-success",
            icon: "CheckSquare",
         },
         {
            value: "finalizado",
            label: "Finalizado",
            className: "bg-accent text-accent-foreground",
            listIconClass: "text-accent",
            icon: "CheckCircle",
         },
         {
            value: "archivado",
            label: "Archivado",
            className: "bg-card text-primary",
            listIconClass: "text-muted-foreground",
            icon: "Folder",
         },
      ],
   };

   // --- ESTADOS DE UI ---
   const [activeTab, setActiveTab] = useState("details");

   const [correctedFiles, setCorrectedFiles] = useState([]);
   const [isDownloading, setIsDownloading] = useState(false);
   const [clientSignature, setClientSignature] = useState(null);
   const [isApproving, setIsApproving] = useState(false);
   const fileInputRef = useRef(null);
   const [isRegenerating, setIsRegenerating] = useState(false);
   const [downloadingCorrectedIndex, setDownloadingCorrectedIndex] = useState(null);
   const [showPreview, setShowPreview] = useState(false);
   const [previewDocument, setPreviewDocument] = useState(null);

   const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
   const statusDropdownRef = useRef(null);

   useEffect(() => {
      const handleClickOutside = (event) => {
         if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
            setIsStatusDropdownOpen(false);
         }
      };

      if (isStatusDropdownOpen) {
         document.addEventListener("mousedown", handleClickOutside);
      } else {
         document.removeEventListener("mousedown", handleClickOutside);
      }

      return () => {
         document.removeEventListener("mousedown", handleClickOutside);
      };
   }, [isStatusDropdownOpen]);

   // Estados de carga para vistas previas
   const [isLoadingPreviewGenerated, setIsLoadingPreviewGenerated] = useState(false);
   const [isLoadingPreviewCorrected, setIsLoadingPreviewCorrected] = useState(false);
   const [isLoadingPreviewSignature, setIsLoadingPreviewSignature] = useState(false);
   const [isLoadingPreviewAdjunto, setIsLoadingPreviewAdjunto] = useState(false);

   const [documentInfo, setDocumentInfo] = useState(null);

   // --- NUEVO ESTADO PARA DATOS APROBADOS ---
   const [approvedData, setApprovedData] = useState(null);
   const [isLoadingApprovedData, setIsLoadingApprovedData] = useState(false);
   const [isUploading, setIsUploading] = useState(false);

   // Estado principal de datos
   const [fullRequestData, setFullRequestData] = useState({ ...request });

   // Estados de carga de secciones
   const [isDetailLoading, setIsDetailLoading] = useState(false);
   const [attachmentsLoading, setAttachmentsLoading] = useState(false);
   const [isCheckingSignature, setIsCheckingSignature] = useState(false);

   const [downloadingAttachmentIndex, setDownloadingAttachmentIndex] = useState(null);
   const [isDownloadingSignature, setIsDownloadingSignature] = useState(false);

   const [previewIndex, setPreviewIndex] = useState(0);
   const [isDeletingFile, setIsDeletingFile] = useState(null); // Para trackear qué archivo se está eliminando
   const [filesToDelete, setFilesToDelete] = useState([]);
   const [isCopied, setIsCopied] = useState(false); // Feedback visual de copiado

   const { dialogProps, openAsyncDialog, openInfoDialog, openErrorDialog } = useAsyncDialog();

   useEffect(() => {
      if (request) {
         setFullRequestData((prev) => {
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
         setActiveTab("details");
      }
   }, [isVisible, request?._id]);

   const fetchApprovedData = async (responseId) => {
      setIsLoadingApprovedData(true);
      try {
         const response = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/data-approved/${responseId}`);
         if (response.ok) {
            const data = await response.json();
            setApprovedData(data);
         } else {
            setApprovedData(null);
         }
      } catch (error) {
         console.error("Error obteniendo datos de aprobado:", error);
         setApprovedData(null);
      } finally {
         setIsLoadingApprovedData(false);
      }
   };

   const checkClientSignature = async () => {
      setIsCheckingSignature(true);
      setIsCheckingSignature(true);
      try {
         const response = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}/has-client-signature`);
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
         console.error("Error verificando firma del cliente:", error);
         setClientSignature(null);
      } finally {
         setIsCheckingSignature(false);
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
         console.error("Error obteniendo información del documento:", error);
         return null;
      }
   };

   const refreshClientSignature = async () => {
      await checkClientSignature();
   };

   useEffect(() => {
      const fetchFreshData = async () => {
         if (request?._id) {
            try {
               const response = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}`);
               if (response.ok) {
                  const data = await response.json();
                  setFullRequestData((prev) => ({ ...prev, ...data }));
               }
            } catch (error) {
               console.error("Error fetching fresh request data:", error);
            }
         }
      };
      fetchFreshData();
   }, [request?._id, endpointPrefix]);

   const fetchAttachments = async (responseId) => {
      setAttachmentsLoading(true);
      try {
         const response = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${responseId}/adjuntos`);

         if (response.ok) {
            const data = await response.json();
            let extractedAdjuntos = [];
            if (data && Array.isArray(data) && data.length > 0 && data[0]?.adjuntos) {
               extractedAdjuntos = data[0].adjuntos;
            } else if (data && data.adjuntos) {
               extractedAdjuntos = data.adjuntos;
            } else if (Array.isArray(data)) {
               extractedAdjuntos = data;
            }

            setFullRequestData((prev) => ({
               ...prev,
               adjuntos: extractedAdjuntos,
            }));
         }
      } catch (error) {
         console.error("Error cargando adjuntos:", error);
      } finally {
         setAttachmentsLoading(false);
      }
   };

   useEffect(() => {
      if (request?.correctedFile) {
         setCorrectedFiles([
            {
               name: request.correctedFile.fileName,
               size: request.correctedFile.fileSize,
               url: `${API_BASE_URL}/${endpointPrefix}/${request._id}/corrected-file`,
               isServerFile: true,
            },
         ]);
      } else {
         setCorrectedFiles([]);
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
            const response = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${responseId}`);
            if (response.ok) {
               const data = await response.json();
               setFullRequestData((prev) => ({
                  ...prev,
                  ...data,
               }));
               await getDocumentInfo(responseId);
            }
         } catch (error) {
            console.error("Error cargando detalles completos:", error);
         } finally {
            setIsDetailLoading(false);
         }
      };

      fetchFullDetailsAndDocs();
      fetchAttachments(responseId);
      checkClientSignature(responseId);
      fetchApprovedData(responseId);
   }, [isVisible, request?._id]);

   const downloadPdfForPreview = async (url) => {
      try {
         const token = sessionStorage.getItem("token");
         const headers = token ? { Authorization: `Bearer ${token}` } : {};

         const response = await fetch(url, { headers });
         if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
         const blob = await response.blob();
         if (blob.type !== "application/pdf") throw new Error("El archivo no es un PDF válido");
         return URL.createObjectURL(blob);
      } catch (error) {
         console.error("Error descargando PDF para vista previa:", error);
         throw error;
      }
   };

   const cleanupPreviewUrl = (url) => {
      if (url && url.startsWith("blob:")) {
         URL.revokeObjectURL(url);
      }
   };

   useEffect(() => {
      const handleBeforeUnload = (e) => {
         if (correctedFiles.length > 0 && !isApproving) {
            e.preventDefault();
            e.returnValue = "Tienes archivos cargados sin guardar. ¿Deseas salir?";
         }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
   }, [correctedFiles.length, isApproving]);

   useEffect(() => {
      if (!isVisible || !request?._id) return;

      const interval = setInterval(async () => {
         try {
            const response = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}`);
            if (response.ok) {
               const updatedRequest = await response.json();
               if (updatedRequest.status !== request.status) {
                  if (onUpdate) onUpdate(updatedRequest);
                  setFullRequestData((prev) => ({ ...prev, status: updatedRequest.status }));
                  fetchApprovedData(request._id);
               }
            }
         } catch (error) {
            console.error("Error verificando actualización del request:", error);
         }
      }, 30000);

      return () => clearInterval(interval);
   }, [isVisible, request?._id, request?.status, onUpdate]);

   useEffect(() => {
      return () => {
         if (previewDocument?.url && previewDocument?.type === "pdf") {
            cleanupPreviewUrl(previewDocument.url);
         }
      };
   }, [previewDocument]);

   const handleStatusChange = async (newStatus) => {
      try {
         const response = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: newStatus }),
         });

         const data = await response.json();

         if (!response.ok) {
            throw new Error(data.error || "No se pudo cambiar el estado");
         }

         // Si hay onUpdate, normaliza los datos
         if (onUpdate && data.updatedRequest) {
            const normalizedRequest = {
               ...data.updatedRequest,
               submittedBy: data.updatedRequest.user?.nombre || data.updatedRequest.submittedBy || "Usuario Desconocido",
               company: data.updatedRequest.user?.empresa || data.updatedRequest.company || "Empresa Desconocida",
               submittedAt: data.updatedRequest.submittedAt || data.updatedRequest.createdAt,
            };

            onUpdate(normalizedRequest);
            setFullRequestData(normalizedRequest);
         }

         return `Estado cambiado a "${newStatus}"`;
      } catch (err) {
         console.error("Error cambiando estado:", err);
         throw new Error(err.message || "Error cambiando estado");
      }
   };

   const getPreviousStatus = (currentStatus) => {
      const statusFlow = ["pendiente", "en_revision", "aprobado", "firmado", "finalizado", "archivado"];
      const currentIndex = statusFlow.indexOf(currentStatus);
      return currentIndex > 0 ? statusFlow[currentIndex - 1] : null;
   };

   const getNextStatus = (currentStatus) => {
      const statusFlow = ["pendiente", "en_revision", "aprobado", "firmado", "finalizado", "archivado"];
      const currentIndex = statusFlow.indexOf(currentStatus);
      return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
   };

   if (!isVisible || !request) return null;

   const handlePreviewDocument = (documentUrl, documentType) => {
      if (!documentUrl) {
         openInfoDialog("No hay documento disponible para vista previa");
         return;
      }
      setPreviewDocument({ url: documentUrl, type: documentType });
      setShowPreview(true);
   };

   const handlePreviewGenerated = async () => {
      try {
         setIsLoadingPreviewGenerated(true);
         const info = documentInfo || (await getDocumentInfo(request._id));
         if (!info || !info.IDdoc) {
            openInfoDialog("No hay documento generado disponible para vista previa");
            return;
         }
         const documentUrl = `${API_BASE_URL}/generador/download/${info.IDdoc}`;
         const extension = info.tipo || "docx";
         handlePreviewDocument(documentUrl, extension);
      } catch (error) {
         console.error("Error en vista previa:", error);
         openErrorDialog("Error al abrir documento");
      } finally {
         setIsLoadingPreviewGenerated(false);
      }
   };

   const handlePreviewCorrectedFile = async (index = 0, source = "auto") => {
      // source: 'approved' (archivos aprobados), 'new' (archivos nuevos), 'auto' (detecta automáticamente)

      try {
         setIsLoadingPreviewCorrected(true);
         setPreviewIndex(index);

         let documentUrl;
         let useApprovedFiles = false;

         // Determinar qué archivos usar
         if (source === "approved") {
            useApprovedFiles = true;
         } else if (source === "new") {
            useApprovedFiles = false;
         } else {
            // 'auto' - intentar determinar basado en contexto
            // Si estamos en la sección de archivos aprobados, probablemente es archivo aprobado
            // Pero esto no es confiable, mejor pasar el source explícitamente
            useApprovedFiles = correctedFiles.length === 0;
         }

         // Archivos aprobados
         if (useApprovedFiles) {
            const hasApprovedFiles = approvedData?.correctedFiles || fullRequestData?.correctedFile;

            if (!hasApprovedFiles) {
               openInfoDialog("No hay archivos aprobados disponibles");
               return;
            }

            // Si hay múltiples archivos aprobados
            if (approvedData?.correctedFiles && approvedData.correctedFiles.length > 0) {
               if (index < 0 || index >= approvedData.correctedFiles.length) {
                  openInfoDialog("Índice de archivo aprobado inválido");
                  return;
               }
               const pdfUrl = `${API_BASE_URL}/${endpointPrefix}/download-approved-pdf/${request._id}?index=${index}`;
               documentUrl = await downloadPdfForPreview(pdfUrl);
            }
            // Formato antiguo (un solo archivo)
            else if (fullRequestData?.correctedFile) {
               const pdfUrl = `${API_BASE_URL}/${endpointPrefix}/${request._id}/corrected-file`;
               documentUrl = await downloadPdfForPreview(pdfUrl);
            }
         }
         // Archivos nuevos/seleccionados
         else {
            if (correctedFiles.length === 0) {
               openInfoDialog("No hay archivos seleccionados para previsualizar");
               return;
            }

            if (index < 0 || index >= correctedFiles.length) {
               openInfoDialog("Índice de archivo nuevo inválido");
               return;
            }

            const file = correctedFiles[index];
            documentUrl = URL.createObjectURL(file);
         }

         handlePreviewDocument(documentUrl, "pdf");
      } catch (error) {
         console.error("Error:", error);
         openErrorDialog("Error al abrir documento");
      } finally {
         setIsLoadingPreviewCorrected(false);
      }
   };

   const handlePreviewClientSignature = async () => {
      if (!clientSignature) {
         openInfoDialog("No hay documento firmado para vista previa");
         return;
      }
      try {
         setIsLoadingPreviewSignature(true);
         const pdfUrl = `${API_BASE_URL}/${endpointPrefix}/${request._id}/client-signature`;
         const documentUrl = await downloadPdfForPreview(pdfUrl);
         handlePreviewDocument(documentUrl, "pdf");
      } catch (error) {
         console.error("Error:", error);
         openErrorDialog("Error al abrir documento");
      } finally {
         setIsLoadingPreviewSignature(false);
      }
   };

   const handlePreviewAdjunto = async (responseId, index) => {
      try {
         setIsLoadingPreviewAdjunto(true);
         const adjunto = fullRequestData.adjuntos[index];
         if (adjunto.mimeType !== "application/pdf") {
            openInfoDialog("Solo disponible para PDF");
            return;
         }
         const pdfUrl = `${API_BASE_URL}/${endpointPrefix}/${responseId}/adjuntos/${index}`;
         const documentUrl = await downloadPdfForPreview(pdfUrl);
         handlePreviewDocument(documentUrl, "pdf");
      } catch (error) {
         console.error("Error:", error);
         openErrorDialog("Error al abrir documento");
      } finally {
         setIsLoadingPreviewAdjunto(false);
      }
   };

   const handleRegenerateDocument = async () => {
      setIsRegenerating(true);

      try {
         const response = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}/regenerate-document`, {
            method: "POST",
         });

         const data = await response.json();

         if (!response.ok) {
            throw new Error(data.error || "Desconocido");
         }

         // Si todo va bien
         await getDocumentInfo(request._id); // recargar info del documento
         return "Documento regenerado exitosamente"; // ✅ mensaje dinámico
      } catch (err) {
         console.error("Error regenerando documento:", err);
         throw new Error(err.message || "Error regenerando documento"); // ✅ mensaje de error dinámico
      } finally {
         setIsRegenerating(false);
      }
   };

   const handleDownload = async () => {
      try {
         setIsDownloading(true);
         const info = documentInfo || (await getDocumentInfo(request._id));
         if (!info || !info.IDdoc) {
            openInfoDialog("No hay documento disponible");
            return;
         }
         window.open(`${API_BASE_URL}/generador/download/${info.IDdoc}`, "_blank");
      } catch (error) {
         console.error("Error:", error);
         openErrorDialog("Error al descargar");
      } finally {
         setIsDownloading(false);
      }
   };

   const handleDownloadAdjunto = async (responseId, index) => {
      setDownloadingAttachmentIndex(index);
      try {
         const token = sessionStorage.getItem("token");
         const headers = token ? { Authorization: `Bearer ${token}` } : {};

         const response = await fetch(`${API_BASE_URL}/${endpointPrefix}/${responseId}/adjuntos/${index}`, {
            headers,
         });

         if (!response.ok) throw new Error("Error descargando archivo");

         const blob = await response.blob();
         const adjunto = fullRequestData.adjuntos[index];
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement("a");
         a.href = url;
         a.download = adjunto.fileName;
         document.body.appendChild(a);
         a.click();
         window.URL.revokeObjectURL(url);
         document.body.removeChild(a);
      } catch (error) {
         console.error("Error:", error);
         openErrorDialog("Error al descargar");
      } finally {
         setDownloadingAttachmentIndex(null);
      }
   };

   const handleDownloadClientSignature = async (responseId) => {
      setIsDownloadingSignature(true);
      try {
         const token = sessionStorage.getItem("token");
         const headers = token ? { Authorization: `Bearer ${token}` } : {};

         const response = await fetch(`${API_BASE_URL}/${endpointPrefix}/${responseId}/client-signature`, {
            headers,
         });

         if (!response.ok) throw new Error("Error descargando firma");

         const blob = await response.blob();
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement("a");
         a.href = url;
         a.download = clientSignature.fileName;
         document.body.appendChild(a);
         a.click();
         window.URL.revokeObjectURL(url);
         document.body.removeChild(a);
      } catch (error) {
         console.error("Error:", error);
         openErrorDialog("Error al descargar");
      } finally {
         setIsDownloadingSignature(false);
      }
   };

   const handleDeleteClientSignature = async (responseId) => {
      openAsyncDialog({
         title: "¿Estás seguro de eliminar la firma del cliente? El estado de la solicitud volverá a 'Aprobado'.",
         loadingText: "Eliminando firma...",
         successText: "Firma eliminada correctamente",
         errorText: "Error al eliminar la firma",
         onConfirm: async () => {
            try {
               const response = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${responseId}/client-signature`, {
                  method: "DELETE",
               });

               if (response.ok) {
                  setClientSignature(null); // Limpiar estado local
                  // Refrescar datos para ver el cambio de estado (de 'firmado' a 'aprobado')
                  const updatedRes = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${responseId}`);
                  if (updatedRes.ok) {
                     const data = await updatedRes.json();
                     setFullRequestData((prev) => ({ ...prev, ...data }));
                     if (onUpdate) onUpdate(data);
                  }
                  return true;
               } else {
                  const errorData = await response.json();
                  throw new Error(errorData.error || "No se pudo eliminar");
               }
            } catch (error) {
               console.error("Error eliminando firma:", error);
               throw error;
            }
         },
      });
   };

   const renameDuplicatedFiles = (newFiles) => {
      const allExistingNames = new Set();

      // Agregar nombres existentes (ya normalizados por el backend)
      approvedData?.correctedFiles?.forEach((file) => {
         const name = file.fileName || file.name || file.originalname;
         if (name) allExistingNames.add(name);
      });

      correctedFiles.forEach((file) => {
         allExistingNames.add(file.name);
      });

      return newFiles.map((file) => {
         const originalFileName = file.name;

         // Normalizar el nombre como lo hace el backend
         const baseName = originalFileName.replace(/\.[^/.]+$/, "");
         const extension = originalFileName.includes(".")
            ? originalFileName.substring(originalFileName.lastIndexOf("."))
            : ".pdf";

         // Patrón de normalización (igual que el backend)
         let normalizedBase = baseName
            .replace(/[-\s]/g, "_") // Reemplazar espacios y guiones por underscore
            .replace(/[^\w_]/g, "") // Eliminar caracteres no alfanuméricos ni underscore
            .replace(/_{2,}/g, "_"); // Reemplazar múltiples underscores por uno solo

         const normalizedFileName = `${normalizedBase}${extension}`;

         //  Verificar si el nombre normalizado ya existe
         if (!allExistingNames.has(normalizedFileName)) {
            // NO existe, usar el nombre normalizado sin número
            allExistingNames.add(normalizedFileName);
            return new File([file], normalizedFileName, {
               type: file.type,
               lastModified: file.lastModified,
            });
         }

         // Si ya existe, encontrar el siguiente número disponible
         let number = 1;
         let newFileName;

         while (true) {
            newFileName = `${normalizedBase}_${number}${extension}`;
            if (!allExistingNames.has(newFileName)) {
               break;
            }
            number++;
         }

         allExistingNames.add(newFileName);

         return new File([file], newFileName, {
            type: file.type,
            lastModified: file.lastModified,
         });
      });
   };
   const handleFileSelect = (event) => {
      const files = Array.from(event.target.files);
      const pdfFiles = files.filter((file) => file.type === "application/pdf");

      if (pdfFiles.length === 0) {
         openInfoDialog("Por favor, sube solo archivos PDF");
         event.target.value = "";
         return;
      }

      const totalApprovedFiles = approvedData?.correctedFiles?.length || 0;
      const currentlySelectedFiles = correctedFiles.length;
      const newFilesCount = pdfFiles.length;

      const remainingSlots = MAX_FILES - totalApprovedFiles - currentlySelectedFiles;

      // 1. Validar límite total de archivos
      if (newFilesCount > remainingSlots) {
         openInfoDialog(
            `Máximo ${MAX_FILES} archivos permitidos.
Ya tienes ${totalApprovedFiles} aprobado(s) y ${currentlySelectedFiles} seleccionado(s).
Puedes agregar máximo ${remainingSlots} archivo(s) más.`,
         );
         event.target.value = "";
         return;
      }

      // 2. Validar tamaño por archivo
      const oversizedFiles = pdfFiles.filter((file) => file.size > MAX_FILE_SIZE);

      if (oversizedFiles.length > 0) {
         const names = oversizedFiles.map((f) => f.name).join(", ");
         openInfoDialog(`Los siguientes archivos exceden el límite de 3MB: ${names}`);
         event.target.value = "";
         return;
      }

      setCorrectedFiles((prev) => [...prev, ...pdfFiles]);
      event.target.value = "";
   };

   const canAddMoreFiles = () => {
      const totalApprovedFiles = approvedData?.correctedFiles?.length || 0;
      const currentlySelectedFiles = correctedFiles.length;
      const availableSlots = MAX_FILES - totalApprovedFiles - currentlySelectedFiles;
      return availableSlots > 0;
   };

   // const getAvailableSlots = () => {
   //   const totalApprovedFiles = approvedData?.correctedFiles?.length || 0;
   //   const currentlySelectedFiles = correctedFiles.length;
   //   return MAX_FILES - totalApprovedFiles - currentlySelectedFiles;
   // };

   const handleUploadAdditionalFiles = async () => {
      if (correctedFiles.length === 0 && filesToDelete.length === 0) {
         return "No hay cambios para aplicar";
      }

      setIsUploading(true);

      try {
         const results = {
            added: 0,
            deleted: 0,
            errors: [],
         };

         // 1. AGREGAR ARCHIVOS
         if (correctedFiles.length > 0) {
            const uploadSuccess = await uploadFilesOneByOne();
            if (uploadSuccess) {
               results.added = correctedFiles.length;
            }
         }

         // 2. ELIMINAR ARCHIVOS
         if (filesToDelete.length > 0) {
            for (const fileToDelete of filesToDelete) {
               try {
                  const response = await apiFetch(
                     `${API_BASE_URL}/${endpointPrefix}/delete-corrected-file/${request._id}`,
                     {
                        method: "DELETE",
                        body: JSON.stringify({ fileName: fileToDelete.fileName }),
                     },
                  );

                  if (response.ok) {
                     results.deleted++;
                  } else {
                     const errorData = await response.json();
                     results.errors.push(`✗ ${fileToDelete.fileName}: ${errorData.error}`);
                  }
               } catch (err) {
                  results.errors.push(`✗ ${fileToDelete.fileName}: ${err.message}`);
               }
            }
         }

         await fetchApprovedData(request._id);

         setCorrectedFiles([]);
         setFilesToDelete([]);
         if (fileInputRef.current) fileInputRef.current.value = "";

         let message = "";
         if (results.added > 0) message += `✓ ${results.added} archivo(s) agregados\n`;
         if (results.deleted > 0) message += `\n✓ ${results.deleted} archivo(s) eliminados\n`;
         if (results.errors.length > 0) {
            message += `\nErrores:\n${results.errors.join("\n")}`;
         }

         return message;
      } catch (error) {
         console.error("Error aplicando cambios:", error);
         throw new Error(error.message || "Ocurrió un error al aplicar los cambios");
      } finally {
         setIsUploading(false);
      }
   };

   const handleRemoveFile = (index) => {
      setCorrectedFiles((prev) => prev.filter((_, i) => i !== index));
   };

   const handleUndoDelete = (fileName) => {
      setFilesToDelete((prev) => prev.filter((f) => f.fileName !== fileName));

      // Restaurar visualmente el archivo
      if (approvedData?.correctedFiles) {
         const updatedApprovedFiles = approvedData.correctedFiles.map((file) =>
            file.fileName === fileName ? { ...file, markedForDelete: false } : file,
         );

         setApprovedData((prev) => ({
            ...prev,
            correctedFiles: updatedApprovedFiles,
         }));
      }

      // alert(`Eliminación de "${fileName}" cancelada`);
   };

   const handleUploadClick = () => {
      if (["finalizado", "archivado"].includes(fullRequestData?.status)) return;
      if (!canAddMoreFiles()) {
         const message = `No puedes agregar más archivos. 
Ya tienes ${approvedData?.correctedFiles?.length || 0} archivo(s) aprobado(s) y ${correctedFiles.length} archivo(s) seleccionado(s).
Máximo permitido: ${MAX_FILES} archivos.`;
         openInfoDialog(message);

         return;
      }
      fileInputRef.current?.click();
   };

   // const handleRemoveCorrection = async () => {
   //   if (correctedFiles.length > 0) {
   //     if (!confirm('¿Eliminar todos los archivos seleccionados?')) return;
   //     setCorrectedFiles([]);
   //     if (fileInputRef.current) fileInputRef.current.value = '';
   //     return;
   //   }

   //   try {
   //     const signatureCheck = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}/has-client-signature`);
   //     const signatureData = await signatureCheck.json();
   //     const hasSignature = signatureData.exists;
   //     let warningMessage = '¿Eliminar corrección y volver a revisión?';
   //     if (hasSignature) warningMessage = 'ADVERTENCIA: Existe documento firmado. ¿Continuar?';
   //     if (!confirm(warningMessage)) return;

   //     const response = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}/remove-correction`, { method: 'DELETE' });
   //     const result = await response.json();
   //     if (response.ok) {
   //       if (onUpdate && result.updatedRequest) onUpdate(result.updatedRequest);
   //       setCorrectedFiles([]);
   //       setApprovedData(null);
   //       if (result.hasExistingSignature) alert('Corrección eliminada. Estado volverá a firmado al subir nueva.');
   //       else alert('Corrección eliminada, vuelve a revisión.');
   //     } else {
   //       alert(result.error || 'Error al eliminar');
   //     }
   //   } catch (error) {
   //     console.error('Error:', error);
   //     alert('Error al eliminar');
   //   }
   // };

   // Función para eliminar un archivo ya subido en el backend
   const handleDeleteUploadedFile = async (fileName, index) => {
      // if (!confirm(`¿Estás seguro de eliminar el archivo "${fileName}"?`)) return;

      setIsDeletingFile(index);

      try {
         // En lugar de eliminar inmediatamente, agregamos a la lista de archivos a eliminar
         setFilesToDelete((prev) => [
            ...prev,
            {
               fileName,
               index,
               id: approvedData?.correctedFiles?.[index]?._id, // Si hay ID del archivo
            },
         ]);

         // También eliminamos visualmente el archivo de la lista aprobada
         if (approvedData?.correctedFiles) {
            const updatedApprovedFiles = [...approvedData.correctedFiles];
            updatedApprovedFiles[index] = {
               ...updatedApprovedFiles[index],
               markedForDelete: true, // Marcamos para eliminación
            };

            setApprovedData((prev) => ({
               ...prev,
               correctedFiles: updatedApprovedFiles,
            }));
         }

         // alert(`Archivo "${fileName}" marcado para eliminación. Presiona "Actualizar" para aplicar los cambios.`);
      } catch (error) {
         console.error("Error marcando archivo para eliminación:", error);
         openErrorDialog("Error marcando archivo para eliminación");
      } finally {
         setIsDeletingFile(null);
      }
   };

   // Función para subir archivos uno por uno (igual que adjuntos)
   const uploadFilesOneByOne = async () => {
      if (correctedFiles.length === 0) {
         return false;
      }

      let successfulUploads = 0;

      // bob el contructor

      const filesToUpload = renameDuplicatedFiles(correctedFiles);

      try {
         for (let i = 0; i < filesToUpload.length; i++) {
            const file = filesToUpload[i];
            const formData = new FormData();

            // Agregar el archivo individual
            formData.append("files", file);

            // Agregar metadata como en adjuntos
            formData.append("responseId", request._id);
            formData.append("index", i.toString());
            formData.append("total", filesToUpload.length.toString());

            console.log(`Subiendo archivo ${i + 1} de ${filesToUpload.length}: ${file.name}`);

            const response = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/upload-corrected-files`, {
               method: "POST",
               body: formData,
            });

            if (response.ok) {
               const result = await response.json();
               console.log(`Archivo ${i + 1} subido:`, result);
               successfulUploads++;

               // Subida completada exitosamente
               successfulUploads++;
            } else {
               const error = await response.json();
               console.error(`Error subiendo archivo ${i + 1}:`, error);

               // Preguntar si quiere continuar
               const shouldContinue = window.confirm(
                  `Error subiendo "${file.name}": ${error.error}\n\n¿Continuar con los demás archivos?`,
               );

               if (!shouldContinue) {
                  return false;
               }
            }
         }

         console.log(`Subida completada: ${successfulUploads}/${correctedFiles.length} archivos exitosos`);
         return successfulUploads > 0; // Retorna true si al menos uno se subió
      } catch (error) {
         console.error("Error en proceso de subida:", error);
         return false;
      }
   };

   const handleApprove = async () => {
      // 1️⃣ Validaciones previas
      if (correctedFiles.length === 0) {
         throw new Error("Debe subir al menos un archivo PDF para aprobar");
      }

      if (correctedFiles.length > MAX_FILES) {
         throw new Error(`Máximo ${MAX_FILES} archivos permitidos. Tienes ${correctedFiles.length} archivos.`);
      }

      const oversizedFiles = correctedFiles.filter((f) => f.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
         throw new Error(
            `No se puede aprobar. Los siguientes archivos exceden 3MB: ${oversizedFiles.map((f) => f.name).join(", ")}`,
         );
      }

      if (isApproving || ["aprobado", "firmado"].includes(request?.status)) {
         return "Formulario ya aprobado o firmado";
      }

      setIsApproving(true);
      setIsUploading(true);

      try {
         // 2️⃣ Subir archivos uno por uno
         const uploadSuccess = await uploadFilesOneByOne();
         if (!uploadSuccess) {
            throw new Error("Error subiendo archivos. No se pudo aprobar.");
         }

         // 3️⃣ Esperar un momento para asegurar persistencia
         await new Promise((resolve) => setTimeout(resolve, 1000));

         // 4️⃣ Aprobar el formulario
         let approveResponse = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
         });

         const handleUpdate = async () => {
            if (!onUpdate) return;

            const updatedResponse = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}`);
            if (updatedResponse.ok) {
               const updatedRequest = await updatedResponse.json();
               const normalizedRequest = {
                  ...updatedRequest,
                  submittedBy: updatedRequest.user?.nombre || updatedRequest.submittedBy || "Usuario Desconocido",
                  company: updatedRequest.user?.empresa || updatedRequest.company || "Empresa Desconocida",
                  submittedAt: updatedRequest.submittedAt || updatedRequest.createdAt,
               };
               onUpdate(normalizedRequest);
            }
            fetchApprovedData(request._id);
         };

         if (!approveResponse.ok) {
            const errorData = await approveResponse.json();
            // Reintento si no encuentra archivos
            if (errorData.error?.includes("No hay archivos corregidos")) {
               await new Promise((resolve) => setTimeout(resolve, 3000));
               approveResponse = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}/approve`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({}),
               });
               if (!approveResponse.ok) {
                  const retryError = await approveResponse.json();
                  throw new Error(`Error en reintento: ${retryError.error}`);
               }
            } else {
               throw new Error(`Error aprobando: ${errorData.error}`);
            }
         }

         // 5️⃣ Si todo salió bien
         await handleUpdate();
         setCorrectedFiles([]);
         return `✅ Formulario aprobado exitosamente\n${correctedFiles.length} archivo(s) subido(s)`;
      } catch (err) {
         console.error("Error aprobando formulario:", err);
         throw new Error(err.message || "Error aprobando formulario");
      } finally {
         setIsApproving(false);
         setIsUploading(false);
      }
   };

   const handleApprovewithoutFile = async () => {
      if (isApproving || request?.status === "finalizado")
         return {
            type: "info",
            message: "No hay cambios para aplicar",
         };

      setIsApproving(true);
      try {
         const approveResponse = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}/finalized`);
         if (approveResponse.ok) {
            if (onUpdate) {
               const updatedResponse = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}`);
               if (updatedResponse.ok) {
                  const updatedRequest = await updatedResponse.json();
                  const normalizedRequest = {
                     ...updatedRequest,
                     submittedBy: updatedRequest.user?.nombre || updatedRequest.submittedBy || "Usuario Desconocido",
                     company: updatedRequest.user?.empresa || updatedRequest.company || "Empresa Desconocida",
                     submittedAt: updatedRequest.submittedAt || updatedRequest.createdAt,
                  };
                  onUpdate(normalizedRequest);
               }
            }
         } else {
            const errorData = await approveResponse.json();
            console.error(errorData);
            throw new Error("Error finalizando trabajo");
         }
      } catch (error) {
         console.error("Error:", error);
         throw new Error("Error finalizando trabajo");
      } finally {
         setIsApproving(false);
      }
   };

   const handleArchieve = async () => {
      if (isApproving) return;
      setIsApproving(true);
      try {
         const approveResponse = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}/archived`);
         if (approveResponse.ok) {
            if (onUpdate) {
               const updatedResponse = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}`);
               if (updatedResponse.ok) {
                  const updatedRequest = await updatedResponse.json();
                  onUpdate(updatedRequest);
               }
            }
         } else {
            const errorData = await approveResponse.json();
            console.error(errorData);
            throw new Error("Error archivando trabajo");
         }
      } catch (error) {
         console.error(error);

         throw new Error("Error archivando trabajo");
      } finally {
         setIsApproving(false);
      }
   };

   const getRealAttachments = () => {
      // Si es Domicilio Virtual, usamos los adjuntos como "Documento Generado" (que en realidad son adjuntos)
      if (endpointPrefix.includes("domicilio-virtual") && fullRequestData?.adjuntos?.length > 0) {
         return fullRequestData.adjuntos.map((adj) => ({
            id: adj._id || Math.random(), // fallback id
            name: adj.fileName,
            size: formatFileSize(adj.size),
            type: adj.mimeType,
            uploadedAt: adj.uploadedAt,
         }));
      }

      if (!fullRequestData) return [];
      if (documentInfo && documentInfo.IDdoc) {
         let fileName = documentInfo.fileName;
         if (!fileName) {
            const formTitle = fullRequestData?.formTitle || "Documento";
            const nombreTrabajador = fullRequestData?.responses?.["Nombre del trabajador"] || "Trabajador";
            fileName = `${formTitle}_${nombreTrabajador}`
               .normalize("NFD")
               .replace(/ñ/g, "n")
               .replace(/Ñ/g, "N")
               .replace(/á/g, "a")
               .replace(/é/g, "e")
               .replace(/í/g, "i")
               .replace(/ó/g, "o")
               .replace(/ú/g, "u")
               .replace(/Á/g, "A")
               .replace(/É/g, "E")
               .replace(/Í/g, "I")
               .replace(/Ó/g, "O")
               .replace(/Ú/g, "U")
               .replace(/ü/g, "u")
               .replace(/Ü/g, "U")
               .replace(/[\u0300-\u036f]/g, "")
               .replace(/[^a-zA-Z0-9\s._-]/g, "")
               .replace(/\s+/g, "_")
               .substring(0, 100)
               .toUpperCase();
         }
         const tipo = documentInfo.tipo || "docx";
         return [
            {
               id: documentInfo.IDdoc,
               name: `${fileName}.${tipo}`,
               size: "Calculando...",
               type: tipo,
               uploadedAt: documentInfo.createdAt || fullRequestData?.submittedAt,
               downloadUrl: `/api/documents/download/${documentInfo.IDdoc}`,
            },
         ];
      }
      return [];
   };

   const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
         case "pending":
         case "pendiente":
            return "bg-error text-error-foreground";
         case "in_review":
         case "en_revision":
            return "bg-secondary text-secondary-foreground";
         case "approved":
         case "aprobado":
            return "bg-warning text-warning-foreground";
         case "signed":
         case "firmado":
            return "bg-success text-success-foreground";
         case "finalizado":
            return "bg-accent text-accent-foreground";
         default:
            return "bg-muted text-muted-foreground";
      }
   };

   const getStatusIcon = (status) => {
      switch (status?.toLowerCase()) {
         case "approved":
         case "aprobado":
            return "CheckCircle";
         case "pending":
         case "pendiente":
            return "Clock";
         case "in_review":
         case "en_revision":
            return "Eye";
         case "rejected":
         case "rechazado":
            return "XCircle";
         case "borrador":
            return "FileText";
         case "signed":
         case "firmado":
            return "CheckSquare";
         default:
            return "Circle";
      }
   };

   const formatDate = (dateString) => {
      if (!dateString) return "Fecha no disponible";
      return new Date(dateString)?.toLocaleDateString("es-CL", {
         day: "2-digit",
         month: "2-digit",
         year: "numeric",
         hour: "2-digit",
         minute: "2-digit",
      });
   };

   const formatFileSize = (bytes) => {
      if (!bytes) return "0 KB";
      if (bytes < 1024) return bytes + " B";

      // Si es menor a 1 MB, mostrar en KB
      if (bytes < 1048576) {
         return (bytes / 1024).toFixed(2) + " KB";
      }

      // Si es mayor a 1 MB, calculamos los MB
      const mb = (bytes / 1048576).toFixed(2);

      // ✅ Aquí está la clave: solo muestra (EXCEDE LÍMITE) si pasa los 3MB reales
      if (bytes > MAX_FILE_SIZE) {
         return `${mb} MB (EXCEDE LÍMITE)`;
      }

      // Si está entre 1MB y 3MB, se muestra normal: "2.50 MB"
      return `${mb} MB`;
   };

   const getFileIcon = (type) => {
      switch (type?.toLowerCase()) {
         case "pdf":
            return "FileText";
         case "docx":
         case "doc":
            return "FileText";
         case "xlsx":
         case "xls":
            return "FileSpreadsheet";
         case "jpg":
         case "jpeg":
         case "png":
            return "Image";
         default:
            return "File";
      }
   };

   const getMimeTypeIcon = (mimeType) => {
      if (mimeType?.includes("pdf")) return "FileText";
      if (mimeType?.includes("word") || mimeType?.includes("document")) return "FileText";
      if (mimeType?.includes("excel") || mimeType?.includes("spreadsheet")) return "FileSpreadsheet";
      if (mimeType?.includes("image")) return "Image";
      return "File";
   };

   const canPreviewAdjunto = (mimeType) => mimeType === "application/pdf";

   const realAttachments = getRealAttachments();

   const renderDetailsTab = () => (
      <div className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex justify-between">
               <span className="text-sm text-muted-foreground">Enviado por:</span>
               <span className="text-sm font-medium text-foreground">
                  {endpointPrefix.includes("domicilio-virtual") && fullRequestData?.user
                     ? `${fullRequestData.user.nombre}, ${fullRequestData.user.empresa}`
                     : `${fullRequestData?.submittedBy}, ${fullRequestData?.company}`}
               </span>
            </div>
            <div className="flex justify-between">
               <span className="text-sm text-muted-foreground">Fecha de envío:</span>
               <span className="text-sm font-medium text-foreground">{formatDate(fullRequestData?.submittedAt)}</span>
            </div>
         </div>

         {userPermissions?.viewAttachments && (
            <div>
               {attachmentsLoading && (
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                     Archivos Adjuntos
                     {attachmentsLoading && <Icon name="Loader" size={16} className="animate-spin text-accent" />}
                  </h3>
               )}
               {!attachmentsLoading && fullRequestData?.adjuntos?.length > 0 && (
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                     Archivos Adjuntos
                  </h3>
               )}
               {fullRequestData?.adjuntos?.length > 0 && (
                  <div className="space-y-2">
                     {fullRequestData.adjuntos.map((adjunto, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                           <div className="flex items-center space-x-3">
                              <Icon name={getMimeTypeIcon(adjunto.mimeType)} size={20} className="text-accent" />
                              <div>
                                 <p className="text-sm font-medium text-foreground">{adjunto.fileName}</p>
                                 <p className="text-xs text-muted-foreground">
                                    {adjunto.pregunta} • {formatFileSize(adjunto.size)} •{" "}
                                    {formatDate(adjunto.uploadedAt)}
                                 </p>
                              </div>
                           </div>
                           <div className="flex items-center space-x-2">
                              {userPermissions?.downloadAttachment && (
                                 <Button
                                    variant="outline"
                                    size="sm"
                                    iconName={downloadingAttachmentIndex === index ? "Loader" : "Download"}
                                    iconPosition="left"
                                    iconSize={16}
                                    onClick={() => handleDownloadAdjunto(fullRequestData._id, index)}
                                    disabled={downloadingAttachmentIndex !== null}
                                 >
                                    {downloadingAttachmentIndex === index ? "Descargando..." : "Descargar"}
                                 </Button>
                              )}
                              {canPreviewAdjunto(adjunto.mimeType) && userPermissions?.previewAttachment && (
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                    iconName={isLoadingPreviewAdjunto ? "Loader" : "Eye"}
                                    iconPosition="left"
                                    iconSize={16}
                                    onClick={() => handlePreviewAdjunto(fullRequestData._id, index)}
                                    disabled={isLoadingPreviewAdjunto}
                                 >
                                    {isLoadingPreviewAdjunto ? "Cargando..." : "Vista Previa"}
                                 </Button>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         )}

         {/* SECCIÓN DOCUMENTO GENERADO */}
         {(documentInfo || endpointPrefix.includes("domicilio-virtual")) && userPermissions?.viewGenerated && (
            <div>
               <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  {endpointPrefix.includes("domicilio-virtual") ? "Documentos Adjuntos" : "Documento Generado"}

                  {/* Botón Regenerar al lado del título (Si hay plantilla y NO es domicilio virtual) */}
                  {fullRequestData?.formId &&
                     !endpointPrefix.includes("domicilio-virtual") &&
                     userPermissions?.regenerate && (
                        <Button
                           variant="ghost"
                           size="icon"
                           className="h-6 w-6 text-muted-foreground hover:text-primary ml-1"
                           title="Regenerar Documento"
                           onClick={(e) => {
                              e.stopPropagation();
                              openAsyncDialog({
                                 title: "¿Estás seguro de regenerar el documento? Esto sobrescribirá el documento actual.",
                                 loadingText: "Regenerando documento...",
                                 successText: "Documento regenerado exitosamente",
                                 errorText: "Error al regenerar documento",
                                 onConfirm: handleRegenerateDocument,
                              });
                           }}
                           disabled={isRegenerating}
                        >
                           <Icon
                              name={isRegenerating ? "Loader" : "RefreshCw"}
                              size={14}
                              className={isRegenerating ? "animate-spin" : ""}
                           />
                        </Button>
                     )}

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
                              {userPermissions?.downloadGenerated && (
                                 <Button
                                    variant="outline"
                                    size="sm"
                                    iconName={isDownloading ? "Loader" : "Download"}
                                    iconPosition="left"
                                    iconSize={16}
                                    onClick={
                                       endpointPrefix.includes("domicilio-virtual")
                                          ? () => handleDownloadAdjunto(fullRequestData._id, 0)
                                          : handleDownload
                                    }
                                    disabled={isDownloading}
                                 >
                                    {isDownloading ? "Descargando..." : "Descargar"}
                                 </Button>
                              )}
                              {userPermissions?.previewGenerated && (
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={
                                       endpointPrefix.includes("domicilio-virtual")
                                          ? () => handlePreviewAdjunto(fullRequestData._id, 0)
                                          : handlePreviewGenerated
                                    }
                                    iconName={isLoadingPreviewGenerated ? "Loader" : "Eye"}
                                    iconPosition="left"
                                    iconSize={16}
                                    disabled={isLoadingPreviewGenerated}
                                 >
                                    {isLoadingPreviewGenerated ? "Cargando..." : "Vista Previa"}
                                 </Button>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="text-center py-8 text-muted-foreground">
                     <p className="text-sm">
                        {endpointPrefix.includes("domicilio-virtual")
                           ? "No hay archivos adjuntos"
                           : "No hay documentos generados para este formulario"}
                     </p>
                  </div>
               )}
            </div>
         )}

         {userPermissions?.viewSent && (
            <div>
               <div className="flex items-center justify-between mb-3 pr-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                     Enviados a Cliente
                     {isLoadingApprovedData && <Icon name="Loader" size={16} className="animate-spin text-accent" />}
                  </h3>
                  {/* Información de límites */}
                  {/* <div>
    <p className="text-xs text-muted-foreground">
      Límite: {MAX_FILES} archivos máximo • 1MB por archivo • Solo PDF
    </p>
  </div> */}

                  {/* BOTÓN PARA SUBIR ARCHIVOS */}
                  <div className="flex items-center gap-2">
                     <span
                        className={`text-sm pr-1  ${
                           (approvedData?.correctedFiles?.length || 0) + correctedFiles.length >= MAX_FILES
                              ? "text-blue-600"
                              : "text-muted-foreground"
                        }`}
                     >
                        Archivos: {(approvedData?.correctedFiles?.length || 0) + correctedFiles.length}/{MAX_FILES}
                     </span>
                     {!["archivado", "finalizado"].includes(fullRequestData?.status) &&
                        userPermissions?.create_solicitudes_clientes_send && (
                           <Button
                              variant="outlineTeal"
                              size="sm"
                              onClick={handleUploadClick}
                              iconName="Plus"
                              iconPosition="left"
                              disabled={(approvedData?.correctedFiles?.length || 0) + correctedFiles.length >= MAX_FILES}
                           >
                              Añadir Archivos
                           </Button>
                        )}
                  </div>

                  {/* Input de archivo oculto */}
                  <input
                     type="file"
                     ref={fileInputRef}
                     onChange={handleFileSelect}
                     accept=".pdf"
                     multiple={true}
                     className="hidden"
                  />
               </div>

               <div className="bg-muted/50 rounded-lg pb-4 px-4 space-y-4">
                  {/* ===== SECCIÓN 1: NUEVOS ARCHIVOS SELECCIONADOS ===== */}
                  {correctedFiles.length > 0 && (
                     <div className="space-y-3">
                        <div className="flex items-center justify-between">
                           <span className="text-base font-xl text-accent">
                              Archivos por subir ({correctedFiles.length})
                           </span>
                           <Button
                              variant="ghostError"
                              size="sm"
                              onClick={() => setCorrectedFiles([])}
                              iconName="Trash2"
                              iconPosition="left"
                              // className="text-error hover:bg-error/10"
                           >
                              Eliminar todos
                           </Button>
                        </div>

                        {correctedFiles.map((file, index) => (
                           <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-accent/5 rounded border border-accent/20"
                           >
                              <div className="flex items-center space-x-3">
                                 <Icon name="FileText" size={20} className="text-accent" />
                                 <div>
                                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                       {formatFileSize(file.size)} • PDF •{" "}
                                       {file.size > MAX_FILE_SIZE ? (
                                          <span className="text-error">EXCEDE LÍMITE</span>
                                       ) : (
                                          "Válido"
                                       )}
                                    </p>
                                 </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePreviewCorrectedFile(index, "new")}
                                    iconName={isLoadingPreviewCorrected && previewIndex === index ? "Loader" : "Eye"}
                                    iconPosition="left"
                                    iconSize={16}
                                    disabled={isLoadingPreviewCorrected}
                                 >
                                    Vista Previa
                                 </Button>
                                 {userPermissions?.deleteSent && (
                                    <Button variant="ghostError" size="icon" onClick={() => handleRemoveFile(index)}>
                                       <Icon name="Trash2" size={16} />
                                    </Button>
                                 )}
                              </div>
                           </div>
                        ))}

                        {!canAddMoreFiles() && (
                           <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 flex items-center">
                              <Icon name="Info" size={14} className="inline mr-1" />
                              Límite máximo alcanzado. Puedes eliminar algunos archivos para agregar otros nuevos.
                           </div>
                        )}

                        {!["archivado", "finalizado"].includes(fullRequestData?.status) && (
                           <div className="flex justify-end pt-2">
                              <Button
                                 variant="outlineTeal"
                                 size="sm"
                                 onClick={() => {
                                    openAsyncDialog({
                                       title: "Confirmar Subida",
                                       message: `¿Estás seguro de que deseas subir ${correctedFiles.length} archivo(s)?`,
                                       confirmLabel: "Subir Archivos",
                                       onConfirm: handleUploadAdditionalFiles,
                                    });
                                 }}
                                 iconName="Upload"
                                 iconPosition="left"
                              >
                                 Subir Archivos
                              </Button>
                           </div>
                        )}
                     </div>
                  )}

                  {/* ===== SECCIÓN 2: ARCHIVOS YA APROBADOS ===== */}
                  {(approvedData?.correctedFiles || fullRequestData?.correctedFile) && (
                     <div className="space-y-3">
                        {correctedFiles.length > 0 && (
                           <span className="text-base font-lg text-accent">
                              Archivos aprobados ({approvedData?.correctedFiles?.length || 1})
                           </span>
                        )}

                        {approvedData?.correctedFiles?.map((file, index) => {
                           const isMarkedForDelete =
                              file.markedForDelete || filesToDelete.some((f) => f.fileName === file.fileName);

                           return (
                              <div
                                 key={index}
                                 className={`flex items-center justify-between p-3 rounded border ${
                                    isMarkedForDelete ? "bg-error/10 border-error/30" : "bg-success/5 border-success/20"
                                 }`}
                              >
                                 <div className="flex items-center space-x-3">
                                    <Icon
                                       name="FileText"
                                       size={20}
                                       className={isMarkedForDelete ? "text-error" : "text-success"}
                                    />
                                    <div>
                                       <p
                                          className={`text-sm font-medium ${
                                             isMarkedForDelete ? "text-error line-through" : "text-foreground"
                                          }`}
                                       >
                                          {file.fileName}
                                          {isMarkedForDelete && (
                                             <span className="ml-2 text-xs text-error font-medium">(Eliminar)</span>
                                          )}
                                       </p>
                                       <p className="text-xs text-muted-foreground">
                                          {formatFileSize(file.fileSize)} • Subido el {formatDate(file.uploadedAt)} •
                                          Archivo {index + 1}
                                       </p>
                                    </div>
                                 </div>
                                 <div className="flex items-center space-x-2">
                                    {userPermissions?.downloadSent && (
                                       <Button
                                          variant="ghost"
                                          size="sm"
                                          iconName={downloadingCorrectedIndex === index ? "Loader" : "Download"}
                                          iconPosition="left"
                                          iconSize={16}
                                          onClick={() => handleDownloadCorrected(index, "approved")}
                                          disabled={downloadingCorrectedIndex === index || isMarkedForDelete}
                                       >
                                          {downloadingCorrectedIndex === index ? "Descargando..." : "Descargar"}
                                       </Button>
                                    )}
                                    {userPermissions?.previewSent && (
                                       <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handlePreviewCorrectedFile(index, "approved")}
                                          iconName={
                                             isLoadingPreviewCorrected && previewIndex === index ? "Loader" : "Eye"
                                          }
                                          iconPosition="left"
                                          iconSize={16}
                                          disabled={isLoadingPreviewCorrected || isMarkedForDelete}
                                       >
                                          {isLoadingPreviewCorrected && previewIndex === index
                                             ? "Cargando..."
                                             : "Vista Previa"}
                                       </Button>
                                    )}
                                    {fullRequestData?.status !== "archivado" &&
                                       (isMarkedForDelete ? (
                                          <Button
                                             variant="ghost"
                                             size="icon"
                                             onClick={() => handleUndoDelete(file.fileName)}
                                          >
                                             <Icon name="RotateCcw" size={16} />
                                          </Button>
                                       ) : (
                                          userPermissions?.deleteSent && (
                                             <Button
                                                variant="ghostError"
                                                size="icon"
                                                onClick={() => handleDeleteUploadedFile(file.fileName, index)}
                                                disabled={isDeletingFile === index}
                                             >
                                                <Icon
                                                   name={isDeletingFile === index ? "Loader" : "Trash2"}
                                                   size={16}
                                                   className={isDeletingFile === index ? "animate-spin" : ""}
                                                />
                                             </Button>
                                          )
                                       ))}
                                 </div>
                              </div>
                           );
                        })}

                        {/* Formato antiguo (un solo archivo) */}
                        {!approvedData?.correctedFiles && fullRequestData?.correctedFile && (
                           <div className="flex items-center justify-between p-3 bg-success/5 rounded border border-success/20">
                              <div className="flex items-center space-x-3">
                                 <Icon name="FileText" size={20} className="text-success" />
                                 <div>
                                    <p className="text-sm font-medium text-foreground">
                                       {fullRequestData.correctedFile.fileName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                       {formatFileSize(fullRequestData.correctedFile.fileSize)} • Subido el{" "}
                                       {formatDate(fullRequestData.submittedAt)}
                                    </p>
                                 </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                    iconName={downloadingCorrectedIndex === 0 ? "Loader" : "Download"}
                                    iconPosition="left"
                                    iconSize={16}
                                    onClick={() => handleDownloadCorrected(0, "approved")}
                                    disabled={downloadingCorrectedIndex === 0}
                                 >
                                    {downloadingCorrectedIndex === 0 ? "Descargando..." : "Descargar"}
                                 </Button>
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePreviewCorrectedFile(0, "approved")}
                                    iconName={isLoadingPreviewCorrected && previewIndex === 0 ? "Loader" : "Eye"}
                                    iconPosition="left"
                                    iconSize={16}
                                    disabled={isLoadingPreviewCorrected}
                                 >
                                    {isLoadingPreviewCorrected && previewIndex === 0 ? "Cargando..." : "Vista Previa"}
                                 </Button>
                              </div>
                           </div>
                        )}
                     </div>
                  )}

                  {/* Mensaje cuando no hay archivos */}
                  {!correctedFiles.length && !approvedData?.correctedFiles && !fullRequestData?.correctedFile && (
                     <div className="text-center py-6 text-muted-foreground">
                        <Icon name="FileText" size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay documentos corregidos aún</p>
                        <p className="text-xs mt-1">Usa el botón "Añadir Archivos" para agregar documentos PDF</p>
                     </div>
                  )}
               </div>
            </div>
         )}

         {fullRequestData?.status !== "pendiente" &&
            fullRequestData?.status !== "en_revision" &&
            userPermissions?.viewSigned && (
               <div>
                  {isCheckingSignature && (
                     <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                        Documento Firmado por Cliente
                        {isCheckingSignature && <Icon name="Loader" size={16} className="animate-spin text-accent" />}
                     </h3>
                  )}
                  {!isCheckingSignature && clientSignature && (
                     <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                        Documento Firmado por Cliente
                     </h3>
                  )}

                  {clientSignature && (
                     <div className="bg-success/10 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-3">
                              <Icon name="FileSignature" size={20} className="text-success" />
                              <div>
                                 <p className="text-sm font-medium text-foreground">{clientSignature.fileName}</p>
                                 <p className="text-xs text-muted-foreground">
                                    Subido el {formatDate(clientSignature.uploadedAt)} •{" "}
                                    {formatFileSize(clientSignature.fileSize)}
                                 </p>
                              </div>
                           </div>
                           <div className="flex items-center space-x-2">
                              {userPermissions?.downloadSigned && (
                                 <Button
                                    variant="outline"
                                    size="sm"
                                    iconName={isDownloadingSignature ? "Loader" : "Download"}
                                    iconPosition="left"
                                    iconSize={16}
                                    onClick={() => handleDownloadClientSignature(fullRequestData._id)}
                                    disabled={isDownloadingSignature}
                                 >
                                    {isDownloadingSignature ? "Descargando..." : "Descargar"}
                                 </Button>
                              )}
                              {userPermissions?.previewSigned && (
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handlePreviewClientSignature}
                                    iconName={isLoadingPreviewSignature ? "Loader" : "Eye"}
                                    iconPosition="left"
                                    iconSize={16}
                                    disabled={isLoadingPreviewSignature}
                                 >
                                    {isLoadingPreviewSignature ? "Cargando..." : "Vista Previa"}
                                 </Button>
                              )}
                              {/* Solo ocultamos el botón de eliminar firma si la solicitud está archivada */}
                              {fullRequestData?.status !== "archivado" && userPermissions?.deleteSignature && (
                                 <Button
                                    variant="ghostError"
                                    size="icon"
                                    onClick={() => handleDeleteClientSignature(fullRequestData._id)}
                                 >
                                    <Icon name="Trash2" size={16} />
                                 </Button>
                              )}
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            )}
      </div>
   );

const mockTimeline = [
    {
      id: 1,
      title: "Solicitud Enviada",
      description: "La solicitud ha sido enviada y está pendiente de revisión inicial.",
      status: "completed",
      completedAt: "2025-01-18T09:30:00Z",
      assignedTo: "Sistema Automático",
      notes: "Solicitud recibida correctamente."
    },
    {
      id: 2,
      title: "Revisión Inicial",
      description: "El equipo de RR.HH. está realizando la revisión inicial.",
      status: "completed",
      completedAt: "2025-01-22T17:00:00Z",
      assignedTo: "María González",
      estimatedCompletion: "2025-01-22T17:00:00Z"
    }
    ,
    {
      id: 3,
      title: "Aprobación Final",
      description: "La solicitud ha sido aprobada por el responsable.",
      status: "completed",
      completedAt: "2025-01-23T10:00:00Z",
      assignedTo: "María González",
      estimatedCompletion: "2025-01-22T17:00:00Z"
    },
    {
      id: 4,
      title: "cierre de la solicitud",
      description: "La solicitud ha sido cerrada por el responsable.",
      status: "current",
      completedAt: null,
      assignedTo: "María González",
      estimatedCompletion: "2025-01-22T17:00:00Z"
    }
  ];

   // const handleUploadFiles = async () => {
   //    if (correctedFiles.length === 0) {
   //       alert("No hay archivos para subir");
   //       return;
   //    }

   //    try {
   //       const formData = new FormData();

   //       // Agregar cada archivo
   //       correctedFiles.forEach((file) => {
   //          formData.append("files", file);
   //       });

   //       // Agregar responseId
   //       formData.append("responseId", request._id);

   //       // Obtener token si es necesario (ajusta según tu auth)
   //       // Usar apiFetch para upload (automáticamente maneja headers y formData)
   //       const response = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/upload-corrected-files`, {
   //          method: "POST",
   //          body: formData,
   //       });

   //       if (response.ok) {
   //          const result = await response.json();
   //          console.log("Archivos subidos exitosamente:", result);
   //          alert(`${correctedFiles.length} archivo(s) subido(s) exitosamente`);
   //          return true;
   //       } else {
   //          const error = await response.json();
   //          alert(`Error subiendo archivos: ${error.error}`);
   //          return false;
   //       }
   //    } catch (error) {
   //       console.error("Error subiendo archivos:", error);
   //       alert("Error subiendo archivos: " + error.message);
   //       return false;
   //    }
   // };

   const handleDownloadCorrected = async (index = 0, source = "auto") => {
      try {
         setDownloadingCorrectedIndex(index);

         let url;
         let filename;
         let useApprovedFiles = false;

         // Determinar qué archivos usar
         if (source === "approved") {
            useApprovedFiles = true;
         } else if (source === "new") {
            useApprovedFiles = false;
         } else {
            useApprovedFiles = correctedFiles.length === 0;
         }

         // Archivos aprobados
         if (useApprovedFiles) {
            const hasApprovedFiles = approvedData?.correctedFiles || fullRequestData?.correctedFile;

            if (!hasApprovedFiles) {
               openInfoDialog("No hay archivos aprobados disponibles");
               return;
            }

            // Si hay múltiples archivos aprobados
            if (approvedData?.correctedFiles && approvedData.correctedFiles.length > 0) {
               if (index < 0 || index >= approvedData.correctedFiles.length) {
                  openErrorDialog("Índice de archivo aprobado inválido");
                  return;
               }

               const fileInfo = approvedData.correctedFiles[index];
               url = `${API_BASE_URL}/${endpointPrefix}/download-approved-pdf/${fullRequestData._id}?index=${index}`;
               filename = fileInfo.fileName || `documento_corregido_${index + 1}.pdf`;
            }
            // Formato antiguo (un solo archivo)
            else if (fullRequestData?.correctedFile) {
               url = `${API_BASE_URL}/${endpointPrefix}/${fullRequestData._id}/corrected-file`;
               filename = fullRequestData.correctedFile.fileName;
            }

            const token = sessionStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await fetch(url, { headers });

            if (!response.ok) throw new Error("Error en descarga");

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
         }
         // Archivos nuevos/seleccionados
         else {
            if (correctedFiles.length === 0) {
               openInfoDialog("No hay archivos seleccionados para descargar");
               return;
            }

            if (index < 0 || index >= correctedFiles.length) {
               openInfoDialog("Índice de archivo nuevo inválido");
               return;
            }

            const file = correctedFiles[index];
            url = URL.createObjectURL(file);
            filename = file.name;

            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
         }
      } catch (error) {
         console.error("Error descargando archivo corregido:", error);
         openErrorDialog("Error al descargar archivo corregido");
      } finally {
         setDownloadingCorrectedIndex(null);
      }
   };

   const renderResponsesTab = () => {
      const responses = fullRequestData?.responses || {};
      const entries = Object.entries(responses);

      // Preparar lista de archivos corregidos para mostrar
      // let filesToShow = [];
      // let isLocal = false;

      // if (correctedFiles.length > 0) {
      //    filesToShow = correctedFiles.map((f) => ({
      //       name: f.name,
      //       size: f.size,
      //       uploadedAt: new Date().toISOString(),
      //    }));
      //    isLocal = true;
      // } else if (approvedData?.correctedFiles && approvedData.correctedFiles.length > 0) {
      //    filesToShow = approvedData.correctedFiles.map((f) => ({
      //       name: f.fileName,
      //       size: f.fileSize,
      //       uploadedAt: f.uploadedAt,
      //    }));
      // } else if (fullRequestData?.correctedFile) {
      //    filesToShow = [
      //       {
      //          name: fullRequestData.correctedFile.fileName,
      //          size: fullRequestData.correctedFile.fileSize,
      //          uploadedAt: fullRequestData.submittedAt, // Fallback
      //       },
      //    ];
      // }

      /* 
       Si no hay respuestas y no hay archivos corregidos, mostramos mensaje de vacío.
       Pero si hay archivos corregidos, queremos mostrarlos aunque no haya respuestas (o mostrarlos junto con el mensaje de no respuestas).
       Mantendremos la estructura original pero agregamos la sección de documentos abajo.
    */

      return (
         <div className="space-y-6">
            <div>
               <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Icon name="List" size={20} className="text-accent" />
                  Respuestas del Formulario
               </h3>

               {entries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border mb-6">
                     <Icon name="FileText" size={32} className="mb-2 opacity-50" />
                     <p>No hay respuestas registradas en este formulario.</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                     {entries.map(([pregunta, respuesta], index) => (
                        <div
                           key={index}
                           className="bg-muted/30 rounded-lg p-4 border border-border/50 hover:bg-muted/50 transition-colors"
                        >
                           <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 break-words">
                              {pregunta}
                           </h4>
                           <div className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap break-words">
                              {respuesta !== null && typeof respuesta === "object"
                                 ? JSON.stringify(respuesta)
                                 : String(respuesta || "-")}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>

            {/* Sección Documento Corregido */}
            {/* {(filesToShow.length > 0) && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              Documento Corregido
              {isLoadingApprovedData && <Icon name="Loader" size={16} className="animate-spin text-accent" />}
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              {filesToShow.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-card rounded border border-border">
                  <div className="flex items-center space-x-3">
                    <Icon name="FileText" size={20} className="text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {isLocal ? 'Local' : (file.uploadedAt ? `Subido el ${formatDate(file.uploadedAt)}` : 'Archivo del servidor')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      iconName={downloadingCorrectedIndex === index ? "Loader" : "Download"}
                      iconPosition="left"
                      iconSize={16}
                      onClick={() => handleDownloadCorrected(index, "approved")}
                      disabled={downloadingCorrectedIndex === index}
                    >
                      {downloadingCorrectedIndex === index ? "Descargando..." : "Descargar"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName={isLoadingPreviewCorrected && previewIndex === index ? "Loader" : "Eye"}
                      iconPosition="left"
                      iconSize={16}
                      onClick={() => handlePreviewCorrectedFile(index, "approved")}
                      disabled={isLoadingPreviewCorrected}
                    >
                      {isLoadingPreviewCorrected && previewIndex === index ? "Cargando..." : "Vista Previa"}
                    </Button>
                  </div>
                </div>
              ))}

              {(fullRequestData?.status === 'aprobado' || fullRequestData?.status === 'firmado') && (
                <p className="text-xs text-success font-medium mt-2">
                  ✓ Documento aprobado y listo
                </p>
              )}
            </div>
          </div>
        )} */}
         </div>
      );
   };

   const renderSharedTab = () => {
      // Preferimos la data poblada, sino usamos los IDs
      const sharedUsers = fullRequestData?.user?.compartidos_data || fullRequestData?.user?.compartidos || [];

      return (
         <div className="space-y-6">
            <div>
               <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Icon name="Users" size={20} className="text-accent" />
                  Usuarios Compartidos
               </h3>

               {sharedUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border mb-6">
                     <Icon name="UserX" size={32} className="mb-2 opacity-50" />
                     <p>Esta solicitud no se ha compartido con nadie.</p>
                  </div>
               ) : (
                  <div className="space-y-3">
                     {sharedUsers.map((user, index) => {
                        // Manejar tanto si es objeto poblado o ID string
                        const isPopulated = typeof user === "object" && user !== null;
                        const displayName = isPopulated ? user.nombre : `Usuario ID: ${user}`;
                        const displayEmail = isPopulated ? user.email : "Sin información";

                        return (
                           <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50 hover:border-accent/30 transition-colors"
                           >
                              <div className="flex items-center space-x-3">
                                 <div className="p-2 bg-primary/10 rounded-full text-primary">
                                    <Icon name="User" size={16} />
                                 </div>
                                 <div>
                                    <p className="text-sm font-medium text-foreground">{displayName}</p>
                                    <p className="text-xs text-muted-foreground">
                                       {isPopulated ? displayEmail : "Acceso concedido"}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
         </div>
      );
   };

   const totalFiles = correctedFiles.length > 0 ? correctedFiles.length : approvedData?.correctedFiles?.length || 1;

   const containerClass = isStandalone
      ? "w-full h-full flex flex-col bg-card"
      : "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm";

   const modalClass = isStandalone
      ? "flex flex-col flex-1 h-full w-full overflow-y-auto"
      : "bg-card border border-border rounded-lg shadow-brand-active w-full max-w-4xl min-h-[75vh] max-h-[75vh] flex flex-col";

   return (
      <div className={containerClass}>
         <div className={modalClass}>
            <div className="sticky top-0 bg-card border-b border-border z-10">
               <div className="flex items-center justify-between p-6 pb-2">
                  <div className="flex items-center space-x-4">
                     <div className="flex items-center space-x-3">
                        <Icon name="FileText" size={24} className="text-accent" />
                        <div>
                           <h2 className="text-xl font-semibold text-foreground">
                              {fullRequestData?.formTitle || fullRequestData?.title}
                           </h2>
                           <p
                              className="text-sm text-muted-foreground cursor-pointer hover:text-accent transition-colors flex items-center gap-2"
                              onClick={() => {
                                 const url = `${window.location.origin}${window.location.pathname}?id=${fullRequestData?._id}`;
                                 navigator.clipboard.writeText(url).then(() => {
                                    setIsCopied(true);
                                    setTimeout(() => setIsCopied(false), 2000);
                                 });
                              }}
                              title="Click para copiar enlace directo"
                           >
                              ID: {fullRequestData?._id}
                              {isCopied && (
                                 <span className="text-xs text-muted-foreground ml-2 transition-all duration-300">
                                    Enlace copiado
                                 </span>
                              )}
                           </p>
                        </div>
                     </div>

                     <div className="flex items-center space-x-2">
                        <div className="relative" ref={statusDropdownRef}>
                           {(() => {
                              const currentStatus = fullRequestData?.status;
                              // Find config or fallback
                              const statusDef = requestsConfig.statuses.find((s) => s.value === currentStatus);

                              // Calculate classes based on config or default utils
                              const triggerColorClass = statusDef
                                 ? statusDef.className
                                 : getDefaultStatusColor(currentStatus);

                              const triggerIconName = statusDef ? statusDef.icon : getStatusIcon(currentStatus);
                              const triggerLabel = statusDef ? statusDef.label : formatStatusText(currentStatus);

                              return (
                                 <>
                                    <button
                                       onClick={() =>
                                          !isStandalone &&
                                          userPermissions?.editState &&
                                          setIsStatusDropdownOpen(!isStatusDropdownOpen)
                                       }
                                       className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-80 whitespace-nowrap ${triggerColorClass} ${!userPermissions?.editState ? "cursor-default" : ""}`}
                                       title={userPermissions?.editState ? "Cambiar estado" : "Estado actual"}
                                       disabled={!userPermissions?.editState}
                                    >
                                       <Icon name={triggerIconName} size={14} className="mr-2" />
                                       <span className="uppercase">{triggerLabel}</span>
                                       {userPermissions?.editState && (
                                          <Icon name="ChevronDown" size={14} className="ml-2 opacity-50" />
                                       )}
                                    </button>

                                    {isStatusDropdownOpen && userPermissions?.editState && (
                                       <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                          <div className="p-1">
                                             {requestsConfig.statuses
                                                .filter((st) => {
                                                   if (st.value === "finalizado") return userPermissions?.finalize;
                                                   if (st.value === "archivado") return userPermissions?.archive;
                                                   return true;
                                                })
                                                .map((st) => (
                                                   <button
                                                      key={st.value}
                                                      onClick={() => {
                                                         openAsyncDialog({
                                                            title: `¿Está seguro de que quiere cambiar el estado a "${st.label}"?`,
                                                            loadingText: `Cambiando estado a "${st.label}"...`,
                                                            successText: "Estado cambiado correctamente",
                                                            errorText: "No se pudo cambiar el estado",
                                                            onConfirm: () => handleStatusChange(st.value),
                                                         });
                                                         setIsStatusDropdownOpen(false);
                                                      }}
                                                      className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center space-x-3 transition-colors ${
                                                         currentStatus === st.value
                                                            ? "bg-accent/10 text-accent font-medium"
                                                            : "hover:bg-accent/5 text-foreground"
                                                      }`}
                                                   >
                                                      <Icon
                                                         name={st.icon || "Circle"}
                                                         size={14}
                                                         className={st.listIconClass || "text-foreground"}
                                                      />
                                                      <span className="text-foreground">{st.label}</span>
                                                      {currentStatus === st.value && (
                                                         <Icon
                                                            name="Check"
                                                            size={14}
                                                            className="ml-auto opacity-70 text-accent"
                                                         />
                                                      )}
                                                   </button>
                                                ))}
                                          </div>
                                       </div>
                                    )}
                                 </>
                              );
                           })()}
                        </div>
                     </div>

                     {/* Botón Regenerar en Header (Si hay plantilla asignada y NO hay documento) */}
                     {fullRequestData?.hasTemplate && !documentInfo && !endpointPrefix.includes("domicilio-virtual") && (
                        <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8 text-muted-foreground hover:text-primary ml-2 border border-dashed border-border"
                           title="Generar Documento"
                           onClick={(e) => {
                              e.stopPropagation();
                              openAsyncDialog({
                                 title: "¿Generar documento desde la plantilla asignada?",
                                 loadingText: "Generando documento...",
                                 successText: "Documento generado exitosamente",
                                 errorText: "Error al generar documento",
                                 onConfirm: handleRegenerateDocument,
                              });
                           }}
                           disabled={isRegenerating}
                        >
                           <Icon
                              name={isRegenerating ? "Loader" : "RefreshCw"}
                              size={16}
                              className={isRegenerating ? "animate-spin" : ""}
                           />
                        </Button>
                     )}
                  </div>
                  {!isStandalone && <Button variant="ghost" size="icon" onClick={onClose} iconName="X" iconSize={20} />}
               </div>

               <div className="px-6 flex space-x-6 ">
                  <button
                     onClick={() => setActiveTab("details")}
                     className={`pb-3 pt-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === "details"
                           ? "border-accent text-accent"
                           : "border-transparent text-muted-foreground hover:text-foreground"
                     }`}
                     title="Ver detalles de la solicitud"
                  >
                     Detalles
                  </button>
                  <button
                     onClick={() => setActiveTab("chronology")}
                     className={`pb-3 pt-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === "chronology"
                           ? "border-accent text-accent"
                           : "border-transparent text-muted-foreground hover:text-foreground"
                     }`}
                     title="Ver detalles de la solicitud"
                  >
                     Cronología
                  </button>
                  {userPermissions?.viewAnswers && (
                     <button
                        onClick={() => setActiveTab("responses")}
                        className={`pb-3 pt-2 text-sm font-medium transition-colors border-b-2 ${
                           activeTab === "responses"
                              ? "border-accent text-accent"
                              : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                        title="Ver respuestas del formulario"
                     >
                        Respuestas
                     </button>
                  )}
                  {userPermissions?.viewShared && (
                     <button
                        onClick={() => setActiveTab("shared")}
                        className={`pb-3 pt-2 text-sm font-medium transition-colors border-b-2 ${
                           activeTab === "shared"
                              ? "border-accent text-accent"
                              : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                        title="Ver usuarios con acceso"
                     >
                        Compartidos
                     </button>
                  )}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
               {activeTab === "details" ? (
                  renderDetailsTab()
               ) : activeTab === "chronology" ? (
                  <TimelineView timeline={mockTimeline} isVisible={true} />
               ) : activeTab === "responses" && userPermissions?.viewAnswers ? (
                  renderResponsesTab()
               ) : activeTab === "shared" && userPermissions?.viewShared ? (
                  renderSharedTab()
               ) : (
                  renderDetailsTab()
               )}
            </div>

            <div className="bg-card border-t border-border p-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                     <Icon name="Clock" size={16} />
                     <span>Última actualización: {formatDate(fullRequestData?.submittedAt)}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                     {!isStandalone && (
                        <>
                           {userPermissions?.viewMessages && (
                              <Button
                                 variant="outline"
                                 iconName="MessageSquare"
                                 iconPosition="left"
                                 onClick={() => onSendMessage(fullRequestData)}
                                 iconSize={16}
                              >
                                 Mensajes
                              </Button>
                           )}

                           {/* BOTÓN "ACTUALIZAR" - Para agregar archivos cuando ya está aprobado */}
                           {(fullRequestData?.status === "aprobado" || fullRequestData?.status === "firmado") &&
                              (correctedFiles.length > 0 || filesToDelete.length > 0) &&
                              userPermissions?.canUpload && (
                                 <Button
                                    variant="outlineTeal"
                                    iconName={isUploading ? "Loader" : "RefreshCw"}
                                    iconPosition="left"
                                    iconSize={16}
                                    onClick={() =>
                                       openAsyncDialog({
                                          title: `¿Está seguro de que quieres actualizar ${correctedFiles.length + filesToDelete.length} archivo(s)?`,
                                          loadingText: `Actualizando archivos...`,
                                          successText: "Archivos actualizados exitosamente",
                                          errorText: "Error al actualizar archivos",
                                          onConfirm: handleUploadAdditionalFiles,
                                       })
                                    }
                                    disabled={isUploading || correctedFiles.some((f) => f.size > MAX_FILE_SIZE)}
                                 >
                                    {isUploading
                                       ? "Actualizando..."
                                       : `Actualizar (${correctedFiles.length + filesToDelete.length})`}
                                 </Button>
                              )}

                           {/* BOTÓN "APROBAR" - Para estados pendiente/en_revision */}
                           {(fullRequestData?.status === "en_revision" || fullRequestData?.status === "pendiente") &&
                              correctedFiles.length > 0 &&
                              userPermissions?.editState && (
                                 <Button
                                    variant="default"
                                    iconName={isApproving ? "Loader" : "CheckCircle"}
                                    iconPosition="left"
                                    iconSize={16}
                                    onClick={handleApprove}
                                    disabled={isApproving || correctedFiles.some((f) => f.size > MAX_FILE_SIZE)}
                                 >
                                    {isApproving ? "Aprobando..." : `Aprobar (${correctedFiles.length})`}
                                 </Button>
                              )}

                           {/* BOTÓN "FINALIZAR" (Solo si está en revisión) */}
                           {fullRequestData?.status === "en_revision" && userPermissions?.finalize && (
                              <Button
                                 variant="default"
                                 iconName={isApproving ? "Loader" : "CheckCircle"}
                                 iconPosition="left"
                                 iconSize={16}
                                 onClick={() =>
                                    openAsyncDialog({
                                       title: "¿Estás seguro de que quieres finalizar este trabajo?",
                                       loadingText: "Finalizando trabajando...",
                                       successText: "Trabajo finalizado correctamente",
                                       errorText: "Error al finalizar trabajo",
                                       onConfirm: handleApprovewithoutFile,
                                    })
                                 }
                                 disabled={isApproving}
                              >
                                 {isApproving ? "Finalizando..." : "Finalizar"}
                              </Button>
                           )}

                           {/* BOTÓN "ARCHIVAR" */}
                           {fullRequestData?.status === "finalizado" && userPermissions?.archive && (
                              <Button
                                 variant="default"
                                 iconName={isApproving ? "Loader" : "Folder"}
                                 iconPosition="left"
                                 iconSize={16}
                                 onClick={() => {
                                    openAsyncDialog({
                                       title: "¿Estás seguro de que quieres archivar este trabajo?",
                                       loadingText: "Archivando...",
                                       successText: "Trabajo archivado correctamente",
                                       errorText: "Error al archivar trabajo",
                                       onConfirm: handleArchieve,
                                    });
                                 }}
                                 disabled={isApproving}
                              >
                                 {isApproving ? "Archivando..." : "Archivar"}
                              </Button>
                           )}
                        </>
                     )}
                     {!isStandalone && (
                        <Button variant="default" onClick={onClose}>
                           Cerrar
                        </Button>
                     )}
                  </div>
               </div>
            </div>
         </div>

         <CleanDocumentPreview
            isVisible={showPreview}
            onClose={() => {
               if (previewDocument?.url && previewDocument?.type === "pdf") {
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
