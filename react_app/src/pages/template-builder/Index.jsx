import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import TemplateList from './components/FormProperties';
import DocumentTemplateEditor from './components/TemplateBuilder';
import { API_BASE_URL, apiFetch } from '../../utils/api';

const FormBuilder = () => {
  // ESTADOS DEL SIDEBAR - AGREGADOS
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

  const [formData, setFormData] = useState({
    id: null,
    description: '',
    category: '',
    responseTime: '',
    author: 'Admin',
    questions: [],
    status: 'borrador',
    section: '',
    icon: 'FileText',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    documentTitle: '',
    paragraphs: [{
      id: 'p1',
      content: 'Primera cláusula del contrato - {{FECHA_ACTUAL}}.',
      conditionalVar: '',
    }],
    signature1Text: 'Firma del Empleador (Emisor).',
    signature2Text: 'Firma del Empleado (Receptor).',
    formId: null,
  });

  const [activeTab, setActiveTab] = useState('properties');
  const [isSaving, setIsSaving] = useState(false);

  // EFECTO PARA MANEJAR REDIMENSIONAMIENTO - AGREGADO
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileScreen(isMobile);

      if (isMobile) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
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

  // CLASE DE MARGEN - AGREGADA
  const mainMarginClass = isMobileScreen
    ? 'ml-0'
    : isDesktopOpen ? 'ml-64' : 'ml-16';

  useEffect(() => {
    if (formData.formId && formData.questions.length === 0) {
      const fetchBaseFormQuestions = async () => {
        try {
          const res = await apiFetch(`${API_BASE_URL}/forms/${formData.formId}`);
          if (!res.ok) throw new Error('Formulario base no encontrado');
          const data = await res.json();

          setFormData(prev => ({
            ...prev,
            questions: data.questions || [],
          }));

        } catch (err) {
          console.error('Error cargando preguntas del formulario base:', err);
        }
      };

      fetchBaseFormQuestions();
    }
  }, [formData.formId, formData.questions.length]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams?.get('id');

    const fetchForm = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/plantillas/${templateId}`);
        if (!res.ok) throw new Error('Plantilla no encontrada');
        const data = await res.json();

        const normalizedTemplate = {
          id: data._id || data.id || null,
          section: data.section || '',
          status: data.status || 'borrador',
          companies: data.companies || [],
          documentContent: data.documentContent || '',

          documentTitle: data.documentTitle || '',
          paragraphs: data.paragraphs || [],
          signatureText: data.signatureText || 'Firma del Empleador y Empleado.',
          formId: data.formId || null,

          signature1Text: data.signature1Text || 'Firma del Empleador (Emisor).',
          signature2Text: data.signature2Text || 'Firma del Empleado (Receptor).',

          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        };

        setFormData(prev => ({
          ...prev,
          ...normalizedTemplate
        }));

        if (normalizedTemplate.formId) {
          setActiveTab('document');
        }

      } catch (err) {
        console.error('Error cargando la plantilla:', err);
        alert('No se pudo cargar la plantilla');
      }
    };

    if (templateId) {
      fetchForm();
    }
  }, []);

  const updateFormData = (field, value) => {
    if (field === 'title' && value.length > 50) {
      alert('El título no puede tener más de 50 caracteres');
      return;
    }

    setFormData(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleTemplateSelect = async (selectedTemplateData) => {
    const selectedFormId = selectedTemplateData.id;

    // Detectar el tipo de operación
    const isDuplicating = selectedTemplateData.documentTitle && selectedTemplateData.paragraphs;
    const isNewFromScratch = selectedTemplateData.isNewTemplate;

    if (isDuplicating || isNewFromScratch) {
      // CASO DUPLICACIÓN O CREACIÓN DESDE CERO: Usar los datos que ya vienen completos

      const newTemplateState = {
        id: null, // ← SIEMPRE null para nuevas plantillas
        formId: selectedFormId,
        documentTitle: selectedTemplateData.documentTitle,
        paragraphs: selectedTemplateData.paragraphs,
        signature1Text: selectedTemplateData.signature1Text,
        signature2Text: selectedTemplateData.signature2Text,
        questions: selectedTemplateData.questions || [],
      };

      setFormData(prev => ({
        ...prev,
        ...newTemplateState,
      }));

      setActiveTab('document');
      return;
    }

    // CASO EDICIÓN NORMAL: Buscar plantilla existente
    let existingTemplateData = null;
    try {
      const url = `${API_BASE_URL}/plantillas/${selectedFormId}`;
      const res = await apiFetch(url);

      if (res.ok) {
        existingTemplateData = await res.json();
      }
    } catch (err) {
      console.warn("No se encontró plantilla existente para este formId.");
    }

    const newTemplateState = existingTemplateData ? {
      id: existingTemplateData._id || existingTemplateData.id,
      formId: selectedFormId,
      documentTitle: existingTemplateData.documentTitle,
      documentContent: existingTemplateData.documentContent,
      paragraphs: existingTemplateData.paragraphs,
      signature1Text: existingTemplateData.signature1Text,
      signature2Text: existingTemplateData.signature2Text,
      questions: selectedTemplateData.questions || [],
    } : {
      // Fallback por si acaso (no debería llegar aquí con el nuevo flujo)
      id: null,
      formId: selectedFormId,
      documentTitle: `Plantilla para ${selectedTemplateData.title}`,
      questions: selectedTemplateData.questions || [],
      paragraphs: [{ id: 'p1', content: 'Primera cláusula del contrato - {{FECHA_ACTUAL}}.' }],
      signature1Text: 'Firma del Empleador (Emisor).',
      signature2Text: 'Firma del Empleado (Receptor).',
    };

    setFormData(prev => ({
      ...prev,
      ...newTemplateState,
    }));

    setActiveTab('document');
  };

  const handleAddParagraph = () => {
    const newParagraph = { id: Date.now().toString(), content: 'Nuevo párrafo de contenido.', conditionalVar: '' };
    setFormData(prev => ({ ...prev, paragraphs: [...prev.paragraphs, newParagraph] }));
  };

  const handleUpdateParagraph = (paragraphId, field, value) => {
    setFormData(prev => ({
      ...prev,
      paragraphs: prev.paragraphs.map(p =>
        p.id === paragraphId ? { ...p, [field]: value } : p
      )
    }));
  };

  const handleDeleteParagraph = (paragraphId) => {
    setFormData(prev => ({
      ...prev,
      paragraphs: prev.paragraphs.filter(p => p.id !== paragraphId)
    }));
  };

  const handleMoveParagraph = (paragraphId, direction) => {
    const paragraphs = [...formData.paragraphs];
    const currentIndex = paragraphs.findIndex(p => p.id === paragraphId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= paragraphs.length) return;

    [paragraphs[currentIndex], paragraphs[newIndex]] = [paragraphs[newIndex], paragraphs[currentIndex]];
    setFormData(prev => ({ ...prev, paragraphs: paragraphs }));
  };

  const handleSaveTemplate = async (newStatus = 'publicado') => {
    const dataToSend = {
      id: formData.id,
      section: formData.section || 'General',
      companies: formData.companies,

      documentTitle: formData.documentTitle,
      paragraphs: formData.paragraphs,
      documentContent: formData.documentContent, // Agregar soporte para editor Tiptap HTML
      signature1Text: formData.signature1Text || "zona firma 1",
      signature2Text: formData.signature2Text || "zona firma 1",
      formId: formData.formId,

      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    if (!dataToSend.formId) {
      alert("ERROR: Debe seleccionar un Formulario Base primero.");
      return;
    }
    if (!dataToSend.documentTitle?.trim()) {
      alert("ERROR: Debe ingresar un Título para el Documento (DOCX).");
      return;
    }
    if (dataToSend.paragraphs.length === 0 && !dataToSend.documentContent) {
      alert("ERROR: La plantilla debe contener al menos un párrafo o contenido HTML.");
      return;
    }

    setIsSaving(true);

    const isUpdating = !!formData.id;
    const url = `${API_BASE_URL}/plantillas`;
    const method = "POST";

    try {
      const response = await apiFetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la plantilla');
      }

      const savedData = await response.json();

      // FORZAR la corrección
      const finalId = savedData.id || savedData._id?.toString() || savedData._id;

      setFormData(prev => ({
        ...prev,
        id: finalId,
        status: savedData.status || newStatus,
      }));

      alert(`El registro de la plantilla se ha completado exitosamente.`);

      if (!formData.id && finalId) {
        window.history.replaceState({}, "", `?id=${finalId}`);
      }

    } catch (error) {
      console.error(error);
      alert("Error al guardar la plantilla: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'properties', label: 'Seleccionar Formulario', icon: 'Settings' },
    { id: 'document', label: 'Editar Plantilla', icon: 'FileText', count: formData.paragraphs?.length },
  ];

  const getTabContent = () => {
    const dynamicVariables = formData.questions
      .filter(q => q.title && q.title.trim() !== '');

    const staticVariables = [
      { type: "Date", title: "FECHA ACTUAL" },
      { type: "Date", title: "FECHA ACTUAL 1 ANIO" },
      { type: "Date", title: "FECHA ACTUAL 6 MESES" },
      { type: "Date", title: "FECHA ACTUAL 1 MES" },
      { type: "time", title: "HORA ACTUAL" },
      { type: "text", title: "NOMBRE EMPRESA" },
      { type: "text", title: "RUT EMPRESA" },
      { type: "text", title: "DIRECCION EMPRESA" },
      { type: "text", title: "ENCARGADO EMPRESA" },
      { type: "text", title: "RUT ENCARGADO EMPRESA" },
    ];

    switch (activeTab) {
      case 'properties':
        return (
          <TemplateList
            onUpdateFormData={handleTemplateSelect}
          />
        );
      case 'document':
        if (!formData.formId) {
          return (
            <div className="text-center py-12 bg-muted/50 rounded-lg">
              <Icon name="AlertTriangle" size={48} className="mx-auto mb-4 text-warning" />
              <h3 className="text-lg font-medium text-foreground mb-4">
                Por favor, selecciona un formulario base primero
              </h3>
              <Button onClick={() => setActiveTab('properties')}>
                Ir a Selección de Formulario
              </Button>
            </div>
          );
        }
        return (
          <DocumentTemplateEditor
            dynamicVariables={dynamicVariables}
            staticVariables={staticVariables}
            templateData={formData}
            onUpdateTemplateData={updateFormData}
            onAddParagraph={handleAddParagraph}
            onUpdateParagraph={handleUpdateParagraph}
            onDeleteParagraph={handleDeleteParagraph}
            onMoveParagraph={handleMoveParagraph}
            onSave={() => handleSaveTemplate('publicado')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* IMPLEMENTACIÓN UNIFICADA DEL SIDEBAR - AGREGADA */}
      {(isMobileOpen || !isMobileScreen) && (
        <>
          <Sidebar
            isCollapsed={!isDesktopOpen}
            onToggleCollapse={toggleSidebar}
            isMobileOpen={isMobileOpen}
            onNavigate={handleNavigation}
          />

          {isMobileScreen && isMobileOpen && (
            <div
              className="fixed inset-0 bg-foreground/50 z-40"
              onClick={toggleSidebar}
            ></div>
          )}
        </>
      )}

      {!isMobileOpen && isMobileScreen && (
        <div className="fixed bottom-4 left-4 z-50" style={{ position: 'fixed' }}>
          <Button
            variant="default"
            size="icon"
            onClick={toggleSidebar}
            iconName="Menu"
            className="w-12 h-12 rounded-full shadow-brand-active"
          />
        </div>
      )}

      {/* CONTENIDO PRINCIPAL - ACTUALIZADO */}
      <main className={`transition-all duration-300 ${mainMarginClass} pt-16`}>
        <div className="p-6 space-y-6">
          {/* HEADER CON BOTÓN DE TOGGLE - AGREGADO */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/form-center'}
                  iconName="ArrowLeft"
                  iconPosition="left"
                >
                  Volver al Centro de Formularios
                </Button>
              </div>

              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {formData?.id ? 'Editar Plantilla' : 'Crear Plantilla Personalizada'}
                </h1>
                <p className="text-muted-foreground">
                  {formData?.id
                    ? 'Modifica tu Plantilla existente y administra la estructura'
                    : 'Diseña una plantilla personalizado con preguntas dinámicas'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* BOTÓN DE TOGGLE DEL SIDEBAR - AGREGADO */}
              <div className="hidden md:flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  iconName={isDesktopOpen ? "PanelLeftClose" : "PanelLeftOpen"}
                  iconSize={20}
                />
              </div>

              <Button
                type="button"
                variant="default"
                onClick={() => handleSaveTemplate('publicado')}
                loading={isSaving}
                iconName="Send"
                iconPosition="left"
                disabled={!formData.formId || isSaving || !formData.documentTitle || (formData.paragraphs.length === 0 && !formData.documentContent)}
              >
                {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
              </Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg">
            <div className="border-b border-border">
              <nav className="flex space-x-8 px-6">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab?.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                      }`}
                    disabled={tab.id === 'document' && !formData.formId}
                    title={tab.id === 'document' && !formData.formId ? "Debes seleccionar un formulario base primero" : `Ir a la pestaña ${tab?.label}`}
                  >
                    <Icon name={tab?.icon} size={16} />
                    <span>{tab?.label}</span>
                    {tab?.count !== undefined && (
                      <span className={`px-2 py-1 text-xs rounded-full ${activeTab === tab?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                        }`}>
                        {tab?.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {getTabContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FormBuilder;