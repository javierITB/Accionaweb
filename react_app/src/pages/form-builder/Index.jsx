import React, { useState, useEffect } from "react";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import FormProperties from "./components/FormProperties";
import QuestionBuilder from "./components/QuestionBuilder";
import FormPreview from "./components/FormPreview";
import { API_BASE_URL, apiFetch } from "../../utils/api";
import { useMemo } from "react";
const FormBuilder = ({ userPermissions = {} }) => {
   // Estados para el sidebar - ACTUALIZADOS
   const [isDesktopOpen, setIsDesktopOpen] = useState(true);
   const [isMobileOpen, setIsMobileOpen] = useState(false);
   const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

   const [formData, setFormData] = useState({
      id: null,
      title: "",
      description: "",
      category: "",
      responseTime: "",
      author: "",
      primaryColor: "#3B82F6",
      secondaryColor: "#F3F4F6",
      questions: [],
      status: "borrador",
      section: "",
      icon: "FileText",
      companies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
   });

   const [activeTab, setActiveTab] = useState("properties");
   const [isSaving, setIsSaving] = useState(false);
   const [isPublishing, setIsPublishing] = useState(false);

   const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

   const permisos = useMemo(
      () => ({
         create_formularios: userPermissions.includes("create_formularios"),
         edit_formularios: userPermissions.includes("edit_formularios"),
         delete_formularios: userPermissions.includes("delete_formularios"),
      }),
      [userPermissions],
   );

   // Permission Check Effect
   useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const formId = urlParams?.get("id");

      const checkAccess = () => {
         if (formId) {
            // Editing mode
            if (!permisos.edit_formularios) {
               alert("No tienes permisos para editar formularios.");
               window.location.href = "/form-center";
               return;
            }
         } else {
            // Creating mode
            if (!permisos.create_formularios) {
               alert("No tienes permisos para crear formularios.");
               window.location.href = "/form-center";
               return;
            }
         }
         setIsLoadingPermissions(false);
      };

      checkAccess();
   }, [permisos]);

   // Detectar cambios en el tamaño de pantalla - ACTUALIZADO
   useEffect(() => {
      const handleResize = () => {
         const isMobile = window.innerWidth < 768;
         setIsMobileScreen(isMobile);

         if (isMobile) {
            setIsMobileOpen(false);
         }
      };

      window.addEventListener("resize", handleResize);
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
   }, []);

   const toggleSidebar = () => {
      if (isMobileScreen) {
         setIsMobileOpen(!isMobileOpen);
      } else {
         setIsDesktopOpen(!isDesktopOpen);
      }
   };

   const handleNavigation = () => {
      if (isMobileScreen) {
         setIsMobileOpen(false);
      }
   };

   // Variable para el margen principal - AGREGADA
   const mainMarginClass = isMobileScreen ? "ml-0" : isDesktopOpen ? "ml-64" : "ml-16";

   // Question types available
   const questionTypes = [
      { value: "text", label: "Texto", icon: "Type" },
      { value: "number", label: "Número", icon: "Hash" },
      { value: "date", label: "Fecha", icon: "Calendar" },
      { value: "time", label: "Hora", icon: "Clock" },
      { value: "rut", label: "Rut", icon: "IdCard" },
      { value: "email", label: "Email", icon: "Mail" },
      { value: "file", label: "Archivo", icon: "Paperclip" },
      { value: "single_choice", label: "Selección Única", icon: "CheckCircle" },
      { value: "multiple_choice", label: "Selección Múltiple", icon: "CheckSquare" },
   ];

   // Categories available
   const categories = [
      { value: "hr", label: "Recursos Humanos" },
      { value: "it", label: "Tecnología" },
      { value: "finance", label: "Finanzas" },
      { value: "operations", label: "Operaciones" },
      { value: "training", label: "Capacitación" },
      { value: "feedback", label: "Retroalimentación" },
      { value: "survey", label: "Encuesta" },
      { value: "evaluation", label: "Evaluación" },
   ];

   const sections = [
      { value: "Remuneraciones", label: "Remuneraciones" },
      { value: "Anexos", label: "Anexos" },
      { value: "Finiquitos", label: "Finiquitos" },
      { value: "Otras", label: "Otras" },
   ];

   // Load form from localStorage if editing - MODIFICADO
   useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const formId = urlParams?.get("id");

      const fetchForm = async () => {
         try {
            const res = await apiFetch(`${API_BASE_URL}/forms/${formId}`);
            if (!res.ok) throw new Error("Formulario no encontrado");
            const data = await res.json();

            // Procesar preguntas al cargar también
            const processedQuestions = (data.questions || []).map((question) => {
               if (question.type === "file") {
                  return {
                     ...question,
                     multiple: question.multiple || false,
                     accept: question.accept || ".pdf,application/pdf",
                     maxSize: question.maxSize || "1",
                     maxFiles: question.maxFiles || (question.multiple ? 4 : 1), // ← NUEVO
                  };
               }
               return question;
            });

            const normalizedForm = {
               id: data._id || data.id || null,
               title: data.title || "",
               description: data.description || "",
               category: data.category || "",
               responseTime: data.responseTime || "",
               author: data.author || "Admin",
               primaryColor: data.primaryColor || "#3B82F6",
               secondaryColor: data.secondaryColor || "#F3F4F6",
               questions: processedQuestions, // Usar preguntas procesadas
               status: data.status || "borrador",
               section: data.section || "",
               icon: data.icon || "FileText",
               companies: data.companies || [],
               createdAt: data.createdAt || new Date().toISOString(),
               updatedAt: data.updatedAt || new Date().toISOString(),
            };

            setFormData(normalizedForm);
         } catch (err) {
            console.error("Error cargando el formulario:", err);
            alert("No se pudo cargar el formulario");
         }
      };

      if (formId) {
         fetchForm();
      }
   }, []);

   // Update form data
   const updateFormData = (field, value) => {
      if (field === "title" && value.length > 50) {
         alert("El título no puede tener más de 50 caracteres");
         return;
      }

      setFormData((prev) => ({
         ...prev,
         [field]: value,
         updatedAt: new Date().toISOString(),
      }));
   };

   // Add new question
   const addQuestion = () => {
      const newQuestion = {
         id: Date.now().toString(),
         type: "text",
         title: "",
         description: "",
         required: false,
         options: [],
      };

      setFormData((prev) => ({
         ...prev,
         questions: [...prev.questions, newQuestion],
         updatedAt: new Date().toISOString(),
      }));

      if (activeTab !== "questions") {
         setActiveTab("questions");
      }

      return newQuestion;
   };

   // Update question
   const updateQuestion = (questionId, updatesOrField, value) => {
      setFormData((prev) => {
         let updatedQuestions;

         if (value !== undefined && typeof updatesOrField === "string") {
            updatedQuestions = prev.questions.map((q) => (q.id === questionId ? { ...q, [updatesOrField]: value } : q));
         } else if (typeof updatesOrField === "object") {
            updatedQuestions = prev.questions.map((q) => (q.id === questionId ? { ...q, ...updatesOrField } : q));
         } else {
            console.warn("Formato inválido en updateQuestion:", { questionId, updatesOrField, value });
            return prev;
         }

         return {
            ...prev,
            questions: updatedQuestions,
            updatedAt: new Date().toISOString(),
         };
      });
   };

   // Delete question
   const deleteQuestion = (questionId) => {
      setFormData((prev) => ({
         ...prev,
         questions: prev.questions.filter((q) => q.id !== questionId),
         updatedAt: new Date().toISOString(),
      }));
   };

   // Move question up/down
   const moveQuestion = (questionId, direction) => {
      const currentIndex = formData.questions.findIndex((q) => q.id === questionId);
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= formData.questions.length) return;

      const newQuestions = [...formData.questions];
      [newQuestions[currentIndex], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[currentIndex]];

      setFormData((prev) => ({
         ...prev,
         questions: newQuestions,
         updatedAt: new Date().toISOString(),
      }));
   };

   // Save form as borrador - MODIFICADA
   const saveForm = async () => {
      const newStatus = "borrador";
      const newUpdatedAt = new Date().toISOString();

      // Procesar preguntas para asegurar que las de tipo 'file' tengan configuraciones
      const processedQuestions = formData.questions.map((question) => {
         if (question.type === "file") {
            return {
               ...question,
               multiple: question.multiple || false,
               accept: question.accept || ".pdf,application/pdf",
               maxSize: question.maxSize || "1",
               maxFiles: question.maxFiles || (question.multiple ? 4 : 1), // ← NUEVO
            };
         }
         return question;
      });

      const dataToSend = {
         ...formData,
         questions: processedQuestions, // Usar las preguntas procesadas
         status: newStatus,
         updatedAt: newUpdatedAt,
      };

      if (!dataToSend?.title?.trim()) {
         alert("Por favor ingresa un título para el formulario");
         return;
      }

      const hasLongQuestionTitles = dataToSend.questions.some((q) => (q.title?.length || 0) > 50);

      if (hasLongQuestionTitles) {
         alert("Una o más preguntas tienen títulos que exceden los 50 caracteres");
         return;
      }

      setIsSaving(true);
      try {
         const response = await apiFetch(`${API_BASE_URL}/forms`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataToSend),
         });

         if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
         }

         const savedForm = await response.json();

         setFormData((prev) => ({
            ...prev,
            id: savedForm._id || savedForm.insertedId || savedForm.id || prev.id,
            title: savedForm.title || prev.title,
            section: savedForm.section || prev.section,
            category: savedForm.category || prev.category,
            questions: savedForm.questions || processedQuestions, // Usar processedQuestions aquí también
            status: savedForm.status || newStatus,
            updatedAt: savedForm.updatedAt || newUpdatedAt,
         }));

         alert("Formulario guardado como borrador exitosamente");

         if (!formData?.id) {
            const newId = savedForm._id || savedForm.insertedId || savedForm.id;
            if (newId) {
               window.history.replaceState({}, "", `?id=${newId}`);
            }
         }
      } catch (error) {
         console.error(error);
         alert("Error al guardar el formulario: " + error.message);
      } finally {
         setIsSaving(false);
      }
   };

   const deleteForm = async () => {
      try {
         const response = await apiFetch(`${API_BASE_URL}/forms/${formData.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            cache: "no-cache",
         });

         if (!response.ok) throw new Error("No se pudo eliminar el formulario");

         alert("Formulario borrado exitosamente");
         window.location.href = "/form-center";
      } catch (error) {
         console.error(error);
         alert("Error al eliminar el formulario");
      }
   };

   // Publish form - MODIFICADA
   const publishForm = async () => {
      if (!formData?.id) {
         alert("Primero guarda el borrador");
         return;
      }

      // Procesar preguntas también para publicar
      const processedQuestions = formData.questions.map((question) => {
         if (question.type === "file") {
            return {
               ...question,
               multiple: question.multiple || false,
               accept: question.accept || ".pdf,application/pdf",
               maxSize: question.maxSize || "1",
            };
         }
         return question;
      });

      setIsPublishing(true);
      try {
         const response = await apiFetch(`${API_BASE_URL}/forms/public/${formData.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               ...formData,
               questions: processedQuestions, // Usar preguntas procesadas
               status: "publicado",
            }),
         });

         const updatedForm = await response.json();
         setFormData((prev) => ({
            ...prev,
            status: "publicado",
            questions: processedQuestions, // Actualizar con preguntas procesadas
         }));

         alert("¡Formulario publicado exitosamente!");
      } catch (error) {
         console.error(error);
         alert("Error al publicar el formulario");
      } finally {
         setIsPublishing(false);
      }
   };
   // Navigation tabs
   const tabs = [
      { id: "properties", label: "Propiedades", icon: "Settings" },
      { id: "questions", label: "Preguntas", icon: "HelpCircle", count: formData?.questions?.length },
      { id: "preview", label: "Vista Previa", icon: "Eye" },
   ];

   const getTabContent = () => {
      switch (activeTab) {
         case "properties":
            return (
               <FormProperties
                  formData={formData}
                  categories={categories}
                  sections={sections}
                  onUpdateFormData={updateFormData}
               />
            );
         case "questions":
            return (
               <QuestionBuilder
                  questions={formData.questions}
                  questionTypes={questionTypes}
                  onUpdateQuestion={updateQuestion}
                  onDeleteQuestion={deleteQuestion}
                  onMoveQuestion={moveQuestion}
                  onAddQuestion={addQuestion}
                  primaryColor={formData.primaryColor}
               />
            );
         case "preview":
            return <FormPreview formData={formData} />;
         default:
            return null;
      }
   };

   if (isLoadingPermissions) {
      return (
         <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center gap-4">
               <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
               <p className="text-muted-foreground font-medium">Verificando permisos...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-background">
         <Header />

         {(isMobileOpen || !isMobileScreen) && (
            <>
               <Sidebar
                  isCollapsed={!isDesktopOpen}
                  onToggleCollapse={toggleSidebar}
                  isMobileOpen={isMobileOpen}
                  onNavigate={handleNavigation}
               />

               {isMobileScreen && isMobileOpen && (
                  <div className="fixed inset-0 bg-foreground/50 z-40" onClick={toggleSidebar}></div>
               )}
            </>
         )}

         {!isMobileOpen && isMobileScreen && (
            <div className="fixed bottom-4 left-4 z-50">
               <Button
                  variant="default"
                  size="icon"
                  onClick={toggleSidebar}
                  iconName="Menu"
                  className="w-12 h-12 rounded-full shadow-brand-active"
               />
            </div>
         )}

         <main className={`transition-all duration-300 ${mainMarginClass} md:pt-16`}>
            <div className="py-6 md:pt-10 space-y-6 md:px-6">
               <div className="flex flex-col items-center md:items-start px-3 md:flex-row md:px-6 gap-4">
                  <div className="space-y-2">
                     <div className="flex items-center space-x-2">
                        <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => (window.location.href = "/form-center")}
                           iconName="ArrowLeft"
                           iconPosition="left"
                        >
                           Volver al Centro de Formularios
                        </Button>
                     </div>

                     <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold text-foreground">
                           {formData?.id ? "Editar Formulario" : "Crear Formulario Personalizado"}
                        </h1>
                        <p className="text-muted-foreground">
                           {formData?.id
                              ? "Modifica tu formulario existente y administra las preguntas"
                              : "Diseña un formulario personalizado con preguntas dinámicas"}
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center">
                     <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                           formData?.status === "publicado"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                     >
                        {formData?.status === "publicado" ? "Publicado" : "Borrador"}
                     </div>

                     <Button
                        type="button"
                        variant="outline"
                        onClick={saveForm}
                        loading={isSaving}
                        iconName="Save"
                        iconPosition="left"
                        disabled={isPublishing}
                     >
                        Guardar Borrador
                     </Button>
                  </div>
                  <Button
                     type="button"
                     variant="default"
                     onClick={publishForm}
                     loading={isPublishing}
                     iconName="Send"
                     iconPosition="left"
                     disabled={isSaving}
                  >
                     Publicar Formulario
                  </Button>
               </div>

               <div className="bg-card border border-border rounded-lg p-4 mx-1.5 md:mx-0">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Título</p>
                        <p className="font-medium text-foreground">{formData?.title || "Sin título"}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Categoría</p>
                        <p className="font-medium text-foreground">
                           {categories?.find((cat) => cat?.value === formData?.category)?.label || "Sin categoría"}
                        </p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Sección</p>
                        <p className="font-medium text-foreground">
                           {sections?.find((sec) => sec?.value === formData?.section)?.label || "Sin sección"}
                        </p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Preguntas</p>
                        <p className="font-medium text-foreground">
                           {formData?.questions?.length} pregunta{formData?.questions?.length !== 1 ? "s" : ""}
                        </p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Última modificación</p>
                        <p className="font-medium text-foreground">
                           {new Date(formData.updatedAt)?.toLocaleDateString("es-ES")}
                        </p>
                     </div>
                  </div>
               </div>

               <div className="bg-card border border-border rounded-lg m-1.5 md:m-0">
                  <div className="border-b border-border">
                     <nav className="flex px-1 md:space-x-8 md:px-6 overflow-x-auto">
                        {tabs?.map((tab) => (
                           
                              isMobileScreen ? (
                              <button
                                 key={tab?.id}
                                 onClick={() => setActiveTab(tab?.id)}
                                 className={`flex items-center space-x-2 py-4 px-1 border-r border-b-2  font-medium text-sm transition-colors ${
                                    activeTab === tab?.id
                                       ? "border-b-primary text-primary"
                                       : "border-b-transparent  text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                                 }`}
                                 title={`Ir a la sección de ${tab?.label}`}
                              >
                                 <Icon name={tab?.icon} size={16} />
                                 <span>{tab?.label}</span>
                                 {tab?.count !== undefined && (
                                    <span
                                       className={`px-2 py-1 text-xs rounded-full ${
                                          activeTab === tab?.id
                                             ? "bg-primary text-primary-foreground"
                                             : "bg-muted text-muted-foreground"
                                       }`}
                                    >
                                       {tab?.count}
                                    </span>
                                 )}
                              </button>
                              ):(
                              <button
                                 key={tab?.id}
                                 onClick={() => setActiveTab(tab?.id)}
                                 className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab?.id
                                       ? "border-primary text-primary"
                                       : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                                 }`}
                                 title={`Ir a la sección de ${tab?.label}`}
                              >
                                 <Icon name={tab?.icon} size={16} />
                                 <span>{tab?.label}</span>
                                 {tab?.count !== undefined && (
                                    <span
                                       className={`px-2 py-1 text-xs rounded-full ${
                                          activeTab === tab?.id
                                             ? "bg-primary text-primary-foreground"
                                             : "bg-muted text-muted-foreground"
                                       }`}
                                    >
                                       {tab?.count}
                                    </span>
                                 )}
                              </button>
                              )
                           
                        ))}
                        {permisos.delete_formularios && (
                           <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                 if (window.confirm("¿Estás seguro de que quieres eliminar este Formulario?")) {
                                    deleteForm();
                                 }
                              }}
                              className="mt-3 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                           >
                              <Icon name="Trash2" size={14} />
                           </Button>
                        )}
                     </nav>
                  </div>

                  <div className="p-6">{getTabContent()}</div>
               </div>
            </div>
         </main>
      </div>
   );
};

export default FormBuilder;
