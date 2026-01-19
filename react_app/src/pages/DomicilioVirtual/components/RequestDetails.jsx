import React, { useState, useEffect, useRef } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import CleanDocumentPreview from "./CleanDocumentPreview";
import { apiFetch, API_BASE_URL } from "../../../utils/api";
import AsyncActionDialog from "components/AsyncActionDialog";
import useAsyncDialog from "hooks/useAsyncDialog";

// Límites configurados
const MAX_FILES = 5; // Máximo de archivos
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB en bytes

const RequestDetails = ({
  request,
  isVisible,
  onClose,
  onUpdate,
  isStandalone = false,
  endpointPrefix = "respuestas",
  onGenerateDoc,
}) => {
  // --- ESTADOS DE UI ---
  const [activeTab, setActiveTab] = useState("details");

  const [correctedFiles, setCorrectedFiles] = useState([]);
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFilesCount, setUploadedFilesCount] = useState(0);

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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState(null);


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
      // Solo llamar a checkClientSignature si NO es Domicilio Virtual
      if (!endpointPrefix.includes("domicilio-virtual")) {
        checkClientSignature();
      }
      // getDocumentInfo se debe llamar siempre si hay request._id
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
          // Buscar info de generador para todos los tipos
          await getDocumentInfo(responseId);
        }
      } catch (error) {
        console.error("Error cargando detalles completos:", error);
      } finally {
        setIsDetailLoading(false);
      }
    };

    fetchFullDetailsAndDocs();

    // Adjuntos y firma
    fetchAttachments(responseId);

    if (!endpointPrefix.includes("domicilio-virtual")) {
      checkClientSignature(responseId);
      fetchApprovedData(responseId);
    }
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
      const response = await apiFetch(
        `${API_BASE_URL}/${endpointPrefix}/${request._id}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "No se pudo cambiar el estado");
      }

      const result = await response.json();

      if (onUpdate && result.updatedRequest) {
        const normalizedRequest = {
          ...fullRequestData,
          ...result.updatedRequest,
          submittedBy:
            result.updatedRequest.user?.nombre ||
            fullRequestData.user?.nombre ||
            "Usuario Desconocido",
          company:
            result.updatedRequest.user?.empresa ||
            fullRequestData.user?.empresa ||
            "Empresa Desconocida",
        };

        onUpdate(normalizedRequest);

        setFullRequestData(prev => ({
          ...prev,
          ...normalizedRequest,
          adjuntos: prev.adjuntos || []
        }));
      }

      return true;
    } catch (error) {
      console.error("Error cambiando estado:", error);
      throw error;
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
      // alert("No hay documento disponible para vista previa");
      openInfoDialog("No hay documento disponible para vista previa")
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
        // alert("No hay documento generado disponible para vista previa");
        openInfoDialog("No hay documento generado disponible para vista previa");
        return;
      }
      const documentUrl = `${API_BASE_URL}/generador/download/${info.IDdoc}`;
      const extension = info.tipo || "docx";
      handlePreviewDocument(documentUrl, extension);
    } catch (error) {
      console.error("Error en vista previa:", error);
      // alert("Error: " + error.message);
      openErrorDialog("Error en vista previa");
    } finally {
      setIsLoadingPreviewGenerated(false);
    }
  };

  const handlePreviewCorrectedFile = async (index = 0) => {
    const hasFiles = correctedFiles.length > 0 || approvedData || fullRequestData?.correctedFile;

    if (!hasFiles) {
      // alert("No hay documentos corregidos para vista previa");
      openInfoDialog("No hay documentos corregidos para vista previa");
      return;
    }

    try {
      setIsLoadingPreviewCorrected(true);
      setPreviewIndex(index);

      let documentUrl;

      if (correctedFiles.length > 0) {
        if (index < 0 || index >= correctedFiles.length) {
          // alert("Índice de archivo inválido");
          openErrorDialog("Índice de archivo inválido");
          return;
        }
        const file = correctedFiles[index];
        documentUrl = URL.createObjectURL(file);
      } else if (approvedData || request?.status === "aprobado" || request?.status === "firmado") {
        const pdfUrl = `${API_BASE_URL}/${endpointPrefix}/download-approved-pdf/${request._id}?index=${index}`;
        documentUrl = await downloadPdfForPreview(pdfUrl);
      } else if (request?.correctedFile) {
        openInfoDialog("El documento corregido está en proceso de revisión.");
        return;
      } else {
        openInfoDialog("No hay documentos corregidos disponibles");
        return;
      }

      handlePreviewDocument(documentUrl, "pdf");
    } catch (error) {
      console.error("Error:", error);
      openErrorDialog("Error: " + error.message);
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
      // console.error("Error:", error);
      openErrorDialog("Error: " + error.message);
    } finally {
      setIsLoadingPreviewSignature(false);
    }
  };

  const handlePreviewAdjunto = async (responseId, index) => {
    try {
      setIsLoadingPreviewAdjunto(true);
      const adjunto = fullRequestData.adjuntos[index];
      if (adjunto.mimeType !== "application/pdf") {
        // alert("Solo disponible para PDF");
        openInfoDialog("Solo disponible para PDF");
        return;
      }
      const pdfUrl = `${API_BASE_URL}/${endpointPrefix}/${responseId}/adjuntos/${index}`;
      const documentUrl = await downloadPdfForPreview(pdfUrl);
      handlePreviewDocument(documentUrl, "pdf");
    } catch (error) {
      console.error("Error:", error);
      // alert("Error: " + error.message);
      openErrorDialog("Error en vista previa");
    } finally {
      setIsLoadingPreviewAdjunto(false);
    }
  };

  const handleRegenerateDocument = async () => {
    setIsRegenerating(true);

    try {
      const response = await apiFetch(
        `${API_BASE_URL}/${endpointPrefix}/${request._id}/regenerate-document`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "No se pudo regenerar el documento");
      }

      await getDocumentInfo(request._id);

      return true;
    } catch (error) {
      console.error("Error regenerando documento:", error);
      throw error;
    } finally {
      setIsRegenerating(false);
    }
  };


  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const info = documentInfo || (await getDocumentInfo(request._id));
      if (!info || !info.IDdoc) {
        // alert("No hay documento disponible");
        openInfoDialog("No hay documento disponible");
        return;
      }
      window.open(`${API_BASE_URL}/generador/download/${info.IDdoc}`, "_blank");
    } catch (error) {
      console.error("Error:", error);
      // alert("Error al descargar");
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
      // alert("Error al descargar");
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
      // alert("Error descargando: " + (error.message || "Desconocido"));
      openErrorDialog("Error al descargar");
    } finally {
      setIsDownloadingSignature(false);
    }
  };

  // const handleFileSelect = (event) => {
  //   const files = Array.from(event.target.files);
  //   const pdfFiles = files.filter((file) => file.type === "application/pdf");

  //   if (pdfFiles.length === 0) {
  //     alert("Por favor, sube solo archivos PDF");
  //     event.target.value = "";
  //     return;
  //   }

  //   // Validar límite de cantidad de archivos
  //   if (correctedFiles.length + pdfFiles.length > MAX_FILES) {
  //     alert(
  //       `Máximo ${MAX_FILES} archivos permitidos. Ya tienes ${correctedFiles.length} archivo(s) seleccionado(s).`
  //     );
  //     event.target.value = "";
  //     return;
  //   }

  //   // Validar tamaño de cada archivo
  //   const oversizedFiles = pdfFiles.filter((file) => file.size > MAX_FILE_SIZE);
  //   if (oversizedFiles.length > 0) {
  //     const oversizedNames = oversizedFiles.map((f) => f.name).join(", ");
  //     alert(`Los siguientes archivos exceden el límite de 1MB: ${oversizedNames}`);
  //     event.target.value = "";
  //     return;
  //   }

  //   setCorrectedFiles((prev) => [...prev, ...pdfFiles]);
  //   event.target.value = "";
  // };

  // const handleRemoveFile = (index) => {
  //   setCorrectedFiles((prev) => prev.filter((_, i) => i !== index));
  // };

  // const handleUploadClick = () => {
  //   fileInputRef.current?.click();
  // };

  // const handleRemoveCorrection = async () => {
  //   if (correctedFiles.length > 0) {
  //     if (!confirm("¿Eliminar todos los archivos seleccionados?")) return;
  //     setCorrectedFiles([]);
  //     if (fileInputRef.current) fileInputRef.current.value = "";
  //     return;
  //   }

  //   try {
  //     const signatureCheck = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}/has-client-signature`);
  //     const signatureData = await signatureCheck.json();
  //     const hasSignature = signatureData.exists;
  //     let warningMessage = "¿Eliminar corrección y volver a revisión?";
  //     if (hasSignature) warningMessage = "ADVERTENCIA: Existe documento firmado. ¿Continuar?";
  //     if (!confirm(warningMessage)) return;

  //     const response = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}/remove-correction`, {
  //       method: "DELETE",
  //     });
  //     const result = await response.json();
  //     if (response.ok) {
  //       if (onUpdate && result.updatedRequest) onUpdate(result.updatedRequest);
  //       setCorrectedFiles([]);
  //       setApprovedData(null);
  //       if (result.hasExistingSignature) alert("Corrección eliminada. Estado volverá a firmado al subir nueva.");
  //       else alert("Corrección eliminada, vuelve a revisión.");
  //     } else {
  //       alert(result.error || "Error al eliminar");
  //     }
  //   } catch (error) {
  //     console.error("Error:", error);
  //     alert("Error al eliminar");
  //   }
  // };

  // Función para eliminar un archivo ya subido en el backend
  // const handleDeleteUploadedFile = async (fileName, index) => {
  //   if (!confirm(`¿Estás seguro de eliminar el archivo "${fileName}"?`)) return;

  //   setIsDeletingFile(index);
  //   try {
  //     const response = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/delete-corrected-file/${request._id}`, {
  //       method: "DELETE",
  //       body: JSON.stringify({ fileName }),
  //     });

  //     if (response.ok) {
  //       const result = await response.json();
  //       alert(`Archivo "${fileName}" eliminado exitosamente`);

  //       // Refrescar los datos aprobados
  //       await fetchApprovedData(request._id);

  //       // Si onUpdate está disponible, actualizar el request
  //       if (onUpdate) {
  //         const updatedResponse = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}`);
  //         if (updatedResponse.ok) {
  //           const updatedRequest = await updatedResponse.json();
  //           const normalizedRequest = {
  //             ...updatedRequest,
  //             submittedBy: updatedRequest.user?.nombre || updatedRequest.submittedBy || "Usuario Desconocido",
  //             company: updatedRequest.user?.empresa || updatedRequest.company || "Empresa Desconocida",
  //             submittedAt: updatedRequest.submittedAt || updatedRequest.createdAt,
  //           };
  //           onUpdate(normalizedRequest);
  //         }
  //       }
  //     } else {
  //       const errorData = await response.json();
  //       alert(`Error eliminando archivo: ${errorData.error}`);
  //     }
  //   } catch (error) {
  //     console.error("Error eliminando archivo:", error);
  //     alert("Error eliminando archivo: " + error.message);
  //   } finally {
  //     setIsDeletingFile(null);
  //   }
  // };

  // Función para subir archivos uno por uno (igual que adjuntos)
  // const uploadFilesOneByOne = async () => {
  //   if (correctedFiles.length === 0) {
  //     alert("No hay archivos para subir");
  //     return false;
  //   }

  //   let successfulUploads = 0;

  //   try {
  //     for (let i = 0; i < correctedFiles.length; i++) {
  //       const file = correctedFiles[i];
  //       const formData = new FormData();

  //       // Agregar el archivo individual
  //       formData.append("files", file);

  //       // Agregar metadata como en adjuntos
  //       formData.append("responseId", request._id);
  //       formData.append("index", i.toString());
  //       formData.append("total", correctedFiles.length.toString());

  //       console.log(`Subiendo archivo ${i + 1} de ${correctedFiles.length}: ${file.name}`);

  //       const response = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/upload-corrected-files`, {
  //         method: "POST",
  //         body: formData,
  //       });

  //       if (response.ok) {
  //         const result = await response.json();
  //         console.log(`Archivo ${i + 1} subido:`, result);
  //         successfulUploads++;

  //         // Actualizar progreso
  //         setUploadedFilesCount(successfulUploads);
  //         setUploadProgress(Math.round((successfulUploads / correctedFiles.length) * 100));

  //         // Pequeña pausa entre archivos
  //         if (i < correctedFiles.length - 1) {
  //           await new Promise((resolve) => setTimeout(resolve, 300));
  //         }
  //       } else {
  //         const error = await response.json();
  //         console.error(`Error subiendo archivo ${i + 1}:`, error);

  //         // Preguntar si quiere continuar
  //         const shouldContinue = window.confirm(
  //           `Error subiendo "${file.name}": ${error.error}\n\n¿Continuar con los demás archivos?`
  //         );

  //         if (!shouldContinue) {
  //           return false;
  //         }
  //       }
  //     }

  //     console.log(`Subida completada: ${successfulUploads}/${correctedFiles.length} archivos exitosos`);
  //     return successfulUploads > 0; // Retorna true si al menos uno se subió
  //   } catch (error) {
  //     console.error("Error en proceso de subida:", error);
  //     alert("Error subiendo archivos: " + error.message);
  //     return false;
  //   }
  // };

  // const handleApprove = async () => {
  //   // Validar que haya archivos
  //   if (correctedFiles.length === 0) {
  //     alert("Debe subir al menos un archivo PDF para aprobar");
  //     return;
  //   }

  //   // Validar límite de archivos
  //   if (correctedFiles.length > MAX_FILES) {
  //     alert(`Máximo ${MAX_FILES} archivos permitidos. Tienes ${correctedFiles.length} archivos.`);
  //     return;
  //   }

  //   // Validar tamaño de cada archivo
  //   const oversizedFiles = correctedFiles.filter((file) => file.size > MAX_FILE_SIZE);
  //   if (oversizedFiles.length > 0) {
  //     const oversizedNames = oversizedFiles.map((f) => f.name).join(", ");
  //     alert(`No se puede aprobar. Los siguientes archivos exceden 1MB: ${oversizedNames}`);
  //     return;
  //   }

  //   if (isApproving || request?.status === "aprobado" || request?.status === "firmado") {
  //     return;
  //   }

  //   if (!confirm(`¿Subir ${correctedFiles.length} archivo(s) y aprobar formulario?`)) return;

  //   setIsApproving(true);
  //   setIsUploading(true);
  //   setUploadProgress(0);
  //   setUploadedFilesCount(0);

  //   try {
  //     // 1. SUBIR ARCHIVOS UNO POR UNO
  //     const uploadSuccess = await uploadFilesOneByOne();

  //     if (!uploadSuccess) {
  //       alert("Error subiendo archivos. No se pudo aprobar.");
  //       return;
  //     }

  //     // 2. ESPERAR UN MOMENTO PARA ASEGURAR QUE LOS ARCHIVOS SE GUARDARON
  //     await new Promise((resolve) => setTimeout(resolve, 1000));

  //     // 3. APROBAR DESPUÉS DE SUBIR LOS ARCHIVOS
  //     const approveResponse = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}/approve`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({}),
  //     });

  //     if (approveResponse.ok) {
  //       const result = await approveResponse.json();

  //       if (onUpdate) {
  //         const updatedResponse = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}`);
  //         if (updatedResponse.ok) {
  //           const updatedRequest = await updatedResponse.json();
  //           const normalizedRequest = {
  //             ...updatedRequest,
  //             submittedBy: updatedRequest.user?.nombre || updatedRequest.submittedBy || "Usuario Desconocido",
  //             company: updatedRequest.user?.empresa || updatedRequest.company || "Empresa Desconocida",
  //             submittedAt: updatedRequest.submittedAt || updatedRequest.createdAt,
  //           };
  //           onUpdate(normalizedRequest);
  //         }
  //         fetchApprovedData(request._id);
  //       }

  //       setCorrectedFiles([]);
  //       setUploadProgress(100);

  //       setTimeout(() => {
  //         alert(`✅ Formulario aprobado exitosamente\n${correctedFiles.length} archivo(s) subido(s)`);
  //       }, 500);

  //     } else {
  //       const errorData = await approveResponse.json();

  //       // Si el error es que no hay archivos, podría ser un delay en la BD
  //       if (errorData.error && errorData.error.includes("No hay archivos corregidos")) {
  //         const retry = window.confirm(
  //           "El backend no encontró los archivos recién subidos.\n¿Reintentar aprobación en 3 segundos?"
  //         );

  //         if (retry) {
  //           await new Promise((resolve) => setTimeout(resolve, 3000));

  //           const retryResponse = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}/approve`, {
  //             method: "POST",
  //             headers: {
  //               "Content-Type": "application/json",
  //             },
  //             body: JSON.stringify({}),
  //           });

  //           if (retryResponse.ok) {
  //             // Éxito en el reintento
  //             if (onUpdate) {
  //               const updatedResponse = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}`);
  //               if (updatedResponse.ok) {
  //                 const updatedRequest = await updatedResponse.json();
  //                 const normalizedRequest = {
  //                   ...updatedRequest,
  //                   submittedBy:
  //                     updatedRequest.user?.nombre || updatedRequest.submittedBy || "Usuario Desconocido",
  //                   company: updatedRequest.user?.empresa || updatedRequest.company || "Empresa Desconocida",
  //                   submittedAt: updatedRequest.submittedAt || updatedRequest.createdAt,
  //                 };
  //                 onUpdate(normalizedRequest);
  //               }
  //             }
  //             alert("Aprobado en reintento");
  //           } else {
  //             alert("Error en reintento: " + (await retryResponse.json()).error);
  //           }
  //         }
  //       } else {
  //         alert(`Error aprobando: ${errorData.error}`);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error:", error);
  //     alert("Error: " + error.message);
  //   } finally {
  //     setIsApproving(false);
  //     setIsUploading(false);
  //     setTimeout(() => {
  //       setUploadProgress(0);
  //       setUploadedFilesCount(0);
  //     }, 2000);
  //   }
  // };

  // const handleApprovewithoutFile = async () => {
  //   if (isApproving || request?.status === "finalizado") return;
  //   if (!confirm("¿Estás seguro de que quieres finalizar este trabajo?")) return;
  //   setIsApproving(true);
  //   try {
  //     const approveResponse = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}/finalized`);
  //     if (approveResponse.ok) {
  //       if (onUpdate) {
  //         const updatedResponse = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}`);
  //         if (updatedResponse.ok) {
  //           const updatedRequest = await updatedResponse.json();
  //           const normalizedRequest = {
  //             ...updatedRequest,
  //             submittedBy: updatedRequest.user?.nombre || updatedRequest.submittedBy || "Usuario Desconocido",
  //             company: updatedRequest.user?.empresa || updatedRequest.company || "Empresa Desconocida",
  //             submittedAt: updatedRequest.submittedAt || updatedRequest.createdAt,
  //           };
  //           onUpdate(normalizedRequest);
  //         }
  //       }
  //       alert("Finalizado correctamente");
  //     } else {
  //       const errorData = await approveResponse.json();
  //       alert(`Error: ${errorData.error}`);
  //     }
  //   } catch (error) {
  //     console.error("Error:", error);
  //     alert("Error: " + error.message);
  //   } finally {
  //     setIsApproving(false);
  //   }
  // };

  // const handleArchieve = async () => {
  //   if (isApproving) return;
  //   if (!confirm("¿Estás seguro de que quieres archivar este trabajo?")) return;
  //   setIsApproving(true);
  //   try {
  //     const approveResponse = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}/archived`);
  //     if (approveResponse.ok) {
  //       if (onUpdate) {
  //         const updatedResponse = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/${request._id}`);
  //         if (updatedResponse.ok) {
  //           const updatedRequest = await updatedResponse.json();
  //           onUpdate(updatedRequest);
  //         }
  //       }
  //       alert("Archivado correctamente");
  //     } else {
  //       const errorData = await approveResponse.json();
  //       alert(`Error: ${errorData.error}`);
  //     }
  //   } catch (error) {
  //     console.error("Error:", error);
  //     alert("Error: " + error.message);
  //   } finally {
  //     setIsApproving(false);
  //   }
  // };

  const getRealAttachments = () => {

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
      case "documento_generado":
        return "bg-error/10 text-error"; // Similar a pendiente
      case "solicitud_firmada":
        return "bg-warning text-warning-foreground";
      case "informado_sii":
        return "bg-info text-info-foreground";
      case "dicom":
        return "bg-secondary text-secondary-foreground";
      case "dado_de_baja":
        return "bg-muted text-muted-foreground";
      case "finalizado":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "pendiente":
        return "Clock";
      case "documento_generado":
        return "FileText";
      case "solicitud_firmada":
        return "PenTool";
      case "informado_sii":
        return "Building";
      case "dicom":
        return "AlertTriangle";
      case "dado_de_baja":
        return "XCircle";
      case "finalizado":
        return "Timer";
      default:
        return "HelpCircle";
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
    if (bytes < 1048576) {
      const kb = (bytes / 1024).toFixed(2);
      if (bytes > 900 * 1024) {
        return `${kb} KB (cerca del límite)`;
      }
      return kb + " KB";
    }
    const mb = (bytes / 1048576).toFixed(2);
    return `${mb} MB (EXCEDE LÍMITE)`;
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

  const handleDeleteClientSignature = async () => {
    alert("DO SOMETHING");
  }

  const canPreviewAdjunto = (mimeType) => mimeType === "application/pdf";

  const realAttachments = getRealAttachments();

  const renderDetailsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Enviado por:</span>
          <span className="text-sm font-medium text-foreground">
            <span className="text-sm font-medium text-foreground">
              {(() => {
                const keys = Object.keys(fullRequestData?.responses || {});
                const normalize = k => k.toLowerCase().trim().replace(':', '');
                // Busca nombre de empresa (excluyendo RUT y datos de contacto)
                const companyKey = keys.find(k => {
                  const n = normalize(k);
                  if (n.includes('rut') ||
                    n.includes('teléfono') || n.includes('telefono') ||
                    n.includes('celular') ||
                    n.includes('mail') || n.includes('correo') ||
                    n.includes('dirección') || n.includes('direccion') || n.includes('calle')) return false;

                  return ['razón social', 'razon social', 'nombre que llevará la empresa', 'empresa', 'cliente'].some(t => n.includes(t));
                });
                // Busca RUT
                const rutKey = keys.find(k => {
                  const n = normalize(k);
                  return n.includes('rut de la empresa') || n.includes('rut representante');
                });

                const companyName = fullRequestData?.responses?.[companyKey] || fullRequestData?.nombreEmpresa || 'Empresa Desconocida';
                const rut = fullRequestData?.responses?.[rutKey] || fullRequestData?.rutEmpresa;

                return companyName + (rut ? ` (${rut})` : '');
              })()}
            </span>
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Fecha de envío:</span>
          <span className="text-sm font-medium text-foreground">{formatDate(fullRequestData?.submittedAt)}</span>
        </div>
      </div>

      <div>
        {/* Archivos Adjuntos Header - Always visible if loading or has attachments */}
        {(attachmentsLoading || fullRequestData?.adjuntos?.length > 0) && (
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            Archivos Adjuntos
            {attachmentsLoading && <Icon name="Loader" size={16} className="animate-spin text-accent" />}
          </h3>
        )}

        {/* Archivos Adjuntos List */}
        {!attachmentsLoading && fullRequestData?.adjuntos?.length > 0 && (
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
                    {downloadingAttachmentIndex === index ? "Descargando..." : "Descargar"}
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
                      {isLoadingPreviewAdjunto ? "Cargando..." : "Vista Previa"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          Documento Generado
          {isDetailLoading && <Icon name="Loader" size={16} className="animate-spin text-accent" />}
          {endpointPrefix.includes("domicilio-virtual") && realAttachments?.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-2 text-muted-foreground hover:text-accent"
              onClick={() => {
                openAsyncDialog({
                  title: "¿Está seguro de que desea regenerar el documento?",
                  loadingText: "Regenerando documento...",
                  successText: "Documento regenerado con exito!",
                  errorText: "Error al regenerar documento!",
                  onConfirm: handleRegenerateDocument
                })
              }}
              disabled={isRegenerating}
              title="Regenerar Documento"
            >
              <Icon name={isRegenerating ? "Loader" : "RefreshCw"} size={14} className={isRegenerating ? "animate-spin" : ""} />
            </Button>
          )}
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
                    {isDownloading ? "Descargando..." : "Descargar"}
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
                    {isLoadingPreviewGenerated ? "Cargando..." : "Vista Previa"}
                  </Button>

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm mb-4">
              {endpointPrefix.includes("domicilio-virtual")
                ? "No hay documento generado"
                : "No hay documentos generados para este formulario"}
            </p>
          </div>
        )}
      </div>

      {fullRequestData?.status !== "pendiente" && fullRequestData?.status !== "en_revision" && (
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
          )}
        </div>
      )}
    </div>
  );

  // const handleUploadFiles = async () => {
  //   if (correctedFiles.length === 0) {
  //     alert("No hay archivos para subir");
  //     return;
  //   }

  //   try {
  //     const formData = new FormData();

  //     // Agregar cada archivo
  //     correctedFiles.forEach((file) => {
  //       formData.append("files", file);
  //     });

  //     // Agregar responseId
  //     formData.append("responseId", request._id);

  //     // Obtener token si es necesario (ajusta según tu auth)
  //     // Usar apiFetch para upload (automáticamente maneja headers y formData)
  //     const response = await apiFetch(`${API_BASE_URL}/${endpointPrefix}/upload-corrected-files`, {
  //       method: "POST",
  //       body: formData,
  //     });

  //     if (response.ok) {
  //       const result = await response.json();
  //       console.log("Archivos subidos exitosamente:", result);
  //       alert(`${correctedFiles.length} archivo(s) subido(s) exitosamente`);
  //       return true;
  //     } else {
  //       const error = await response.json();
  //       alert(`Error subiendo archivos: ${error.error}`);
  //       return false;
  //     }
  //   } catch (error) {
  //     console.error("Error subiendo archivos:", error);
  //     alert("Error subiendo archivos: " + error.message);
  //     return false;
  //   }
  // };

  const renderResponsesTab = () => {
    const responses = fullRequestData?.responses || {};
    const entries = Object.entries(responses).filter(([key]) => key !== "_CONTEXTO" && key !== "_contexto");

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
                  {respuesta !== null && typeof respuesta === "object"
                    ? respuesta.join(", ")
                    : String(respuesta || "-")}
                </div>
              </div>
            ))}
          </div>
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
    : "bg-card border border-border rounded-lg shadow-brand-active w-full max-w-4xl max-h-[90vh] overflow-y-auto";

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
                  <p className="text-sm text-muted-foreground">ID: {fullRequestData?._id}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!isStandalone && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStatusChange(getPreviousStatus(fullRequestData?.status))}
                    disabled={!getPreviousStatus(fullRequestData?.status)}
                    iconName="ChevronLeft"
                    iconSize={16}
                    className="text-muted-foreground hover:text-foreground"
                  />
                )}

                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    fullRequestData?.status
                  )}`}
                >
                  <Icon name={getStatusIcon(fullRequestData?.status)} size={14} className="mr-2" />
                  {fullRequestData?.status?.replace("_", " ")?.toUpperCase()}
                </span>

                {!isStandalone && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStatusChange(getNextStatus(fullRequestData?.status))}
                    disabled={!getNextStatus(fullRequestData?.status)}
                    iconName="ChevronRight"
                    iconSize={16}
                    className="text-muted-foreground hover:text-foreground"
                  />
                )}
              </div>
            </div>
            {!isStandalone && <Button variant="ghost" size="icon" onClick={onClose} iconName="X" iconSize={20} />}
          </div>

          <div className="px-6 flex space-x-6 ">
            <button
              onClick={() => setActiveTab("details")}
              className={`pb-3 pt-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "details"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              title="Ver detalles de la solicitud"
            >
              Detalles
            </button>
            <button
              onClick={() => setActiveTab("responses")}
              className={`pb-3 pt-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "responses"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              title="Ver respuestas del formulario"
            >
              Respuestas
            </button>
          </div>
        </div>

        <div className="p-6">{activeTab === "details" ? renderDetailsTab() : renderResponsesTab()}</div>

        <div className="sticky bottom-0 bg-card border-t border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Icon name="Clock" size={16} />
              <span>Última actualización: {formatDate(fullRequestData?.submittedAt)}</span>
            </div>
            <div className="flex items-center space-x-3 w-full justify-end">
              {!isStandalone && (
                <>
                  {/* Botón Mensajes eliminado para Domicilio Virtual */}

                  <div className="flex items-center gap-2 w-3/4 justify-end">
                    <span className="text-sm font-medium">Cambiar Estado:</span>
                    <select
                      value={fullRequestData?.status || ""}
                      onChange={(e) => {
                        const newStatus = e.target.value;

                        openAsyncDialog({
                          title: `¿Está seguro de que quiere cambiar el estado a "${newStatus}"?`,
                          loadingText: `Cambiando estado a "${newStatus}"...`,
                          successText: "Estado cambiado correctamente",
                          errorText: "No se pudo cambiar el estado",
                          onConfirm: () => handleStatusChange(newStatus),
                        });
                      }}
                      className="h-9 py-1 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent w-2/5"
                    >
                      <option value="documento_generado">Documento Generado</option>
                      <option value="enviado">Enviado</option>
                      <option value="solicitud_firmada">Firmada</option>
                      <option value="informado_sii">Informado al SII</option>
                      <option value="dicom">DICOM</option>
                      <option value="dado_de_baja">Dado de baja</option>
                    </select>
                  </div>

                </>
              )}
              {!isStandalone && (
                <Button variant="default" onClick={onClose}>
                  Cerrar
                </Button>
              )}
            </div>
          </div >
        </div >
      </div >

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

      {/* <AsyncActionDialog
        open={dialogOpen}
        title={`¿Está seguro de que quiere cambiar el estado a "${pendingStatus}"?`}
        loadingText={`Cambiando estado a "${pendingStatus}"...`}
        successText="Estado cambiado correctamente"
        onConfirm={() => handleStatusChange(pendingStatus)}
        onClose={() => setDialogOpen(false)}
      /> */}

      {/* <AsyncActionDialog
  open={dialogOpen}
  {...dialogConfig}
  onClose={() => {
    setDialogOpen(false);
    setDialogConfig(null);
  }}
/> */}

      <AsyncActionDialog {...dialogProps} />
    </div>
  );
};

export default RequestDetails;
