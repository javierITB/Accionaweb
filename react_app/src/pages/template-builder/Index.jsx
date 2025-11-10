import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import TemplateList from './components/FormProperties';
import DocumentTemplateEditor from './components/TemplateBuilder';

const FormBuilder = () => {
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

  useEffect(() => {
    if (formData.formId && formData.questions.length === 0) {
      const fetchBaseFormQuestions = async () => {
        try {
          const res = await fetch(`https://accionaapi.vercel.app/api/forms/${formData.formId}`);
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
        const res = await fetch(`https://accionaapi.vercel.app/api/plantillas/${templateId}`);
        if (!res.ok) throw new Error('Plantilla no encontrada');
        const data = await res.json();

        const normalizedTemplate = {
          id: data._id || data.id || null,
          section: data.section || '',
          status: data.status || 'borrador',
          companies: data.companies || [],

          documentTitle: data.documentTitle || '',
          paragraphs: data.paragraphs || [],
          signatureText: data.signatureText || 'Firma del Empleador y Empleado.',
          formId: data.formId || null,

          signature1Text: signature1Text || 'Firma del Empleador (Emisor).',
          signature2Text: signature2Text || 'Firma del Empleado (Receptor).',

          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        };

        setFormData(prev => ({
          ...prev,
          normalizedTemplate
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

    let existingTemplateData = null;
    try {
      const url = `https://accionaapi.vercel.app/api/plantillas/${selectedFormId}`;
      const res = await fetch(url);

      if (res.ok) {
        existingTemplateData = await res.json();
        console.log("Plantilla existente encontrada por formId:", existingTemplateData);
      }
    } catch (err) {
      console.warn("No se encontró plantilla existente para este formId. Creando una nueva.");
    }

    const newTemplateState = existingTemplateData ? {
      id: existingTemplateData._id || existingTemplateData.id,
      formId: selectedFormId,
      documentTitle: existingTemplateData.documentTitle,
      paragraphs: existingTemplateData.paragraphs,
      signature1Text: existingTemplateData.signature1Text,
      signature2Text: existingTemplateData.signature2Text,
      questions: selectedTemplateData.questions || [],
    } : {
      id: null,
      formId: selectedFormId,
      documentTitle: selectedTemplateData.documentTitle,
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
    if (dataToSend.paragraphs.length === 0) {
      alert("ERROR: La plantilla debe contener al menos un párrafo.");
      return;
    }

    setIsSaving(true);

    const isUpdating = !!formData.id;
    const url = "https://accionaapi.vercel.app/api/plantillas";
    const method = "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la plantilla');
      }

      const savedData = await response.json();

      setFormData(prev => ({
        ...prev,
        id: savedData._id || savedData.id || prev.id,
        status: savedData.status || newStatus,
      }));

      alert(`Plantilla guardada como ${newStatus} exitosamente.`);

      if (!formData.id && savedData._id) {
        window.history.replaceState({}, "", `?id=${savedData._id}`);
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
      { type: "time", title: "HORA ACTUAL" },
      { type: "text", title: "AUTOR NOMBRE" },
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
            templateData={formData}
            onUpdateTemplateData={updateFormData}
            dynamicVariables={dynamicVariables}
            staticVariables={staticVariables}
            onAddParagraph={handleAddParagraph}
            onUpdateParagraph={handleUpdateParagraph}
            onDeleteParagraph={handleDeleteParagraph}
            onMoveParagraph={handleMoveParagraph}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="ml-64 pt-16">
        <div className="p-6 space-y-6">
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
              <Button
                type="button"
                variant="default"
                onClick={() => handleSaveTemplate('publicado')}
                loading={isSaving}
                iconName="Send"
                iconPosition="left"
                disabled={!formData.formId || isSaving || !formData.documentTitle || formData.paragraphs.length === 0}
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