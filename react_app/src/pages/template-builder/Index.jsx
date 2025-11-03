import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import TemplateList from './components/FormProperties'; // 💡 CORRECCIÓN: Renombrada a TemplateList
import DocumentTemplateEditor from './components/TemplateBuilder'; // Renombrado de QuestionBuilder

// 💡 FUNCIÓN UTILITARIA: Convierte un título de pregunta en un tag de variable {{SNAKE_CASE}}
const generateVarTag = (title) => {
    if (!title) return '';
    // Limpiar acentos, reemplazar no alfanuméricos por guion bajo y convertir a mayúsculas
    const cleanTitle = title.normalize("NFD").replace(/[\u0300-\u036f]/g, '');
    const snakeCase = cleanTitle.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, '_');
    return `{{${snakeCase}}}`;
};

const FormBuilder = () => {
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    description: '',
    category: '',
    responseTime: '',
    author: 'Admin',
    primaryColor: '#3B82F6',
    secondaryColor: '#F3F4F6',
    questions: [], // Preguntas del formulario base
    status: 'borrador',
    section: '',
    icon: 'FileText',
    companies: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    // 💡 CAMPOS DE LA PLANTILLA DOCX
    documentTitle: '', // Se usa para el documento generado
    paragraphs: [],
    signatureText: 'Firma del Empleador y Empleado.',
    formId: null, // ID del formulario asociado
  });

  const [activeTab, setActiveTab] = useState('properties');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Load form/template from API if editing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams?.get('id');

    // 💡 FUNCIÓN RESTAURADA: Fetch para cargar la plantilla existente
    const fetchForm = async () => {
      try {
        // Asumimos que la API de plantillas usa un endpoint similar a /plantillas/:id
        const res = await fetch(`https://accionaapi.vercel.app/api/plantillas/${templateId}`);
        if (!res.ok) throw new Error('Plantilla no encontrada');
        const data = await res.json();

        // Normalización para el estado de la aplicación
        const normalizedTemplate = {
          id: data._id || data.id || null,
          title: data.title || '',
          section: data.section || '',
          primaryColor: data.primaryColor || '#3B82F6',
          secondaryColor: data.secondaryColor || '#F3F4F6',
          status: data.status || 'borrador',
          companies: data.companies || [],
          
          // Datos específicos de la plantilla
          documentTitle: data.documentTitle || data.title || '',
          paragraphs: data.paragraphs || [],
          signatureText: data.signatureText || 'Firma del Empleador y Empleado.',
          formId: data.formId || null, // ID del formulario asociado
          
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
          // No necesitamos cargar 'questions' aquí, ya que se cargan al seleccionar la base.
        };

        setFormData(normalizedTemplate);
        
        // Si cargamos una plantilla por ID, ir directamente al editor
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

  // Update form data
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

  // 💡 FUNCIÓN DE SELECCIÓN DE PLANTILLA BASE
  const handleTemplateSelect = (selectedTemplateData) => {
    setFormData(prev => ({
      ...prev,
      // Almacenamos el ID del formulario base
      formId: selectedTemplateData.id, 
      // Usamos el título del formulario como título de la plantilla DOCX
      documentTitle: selectedTemplateData.title, 
      questions: selectedTemplateData.questions || [],
      // Inicializamos el contenido de la plantilla DOCX si no existe
      paragraphs: [{ id: 'p1', content: 'Primera cláusula del contrato...' }],
      signatureText: 'Firma del Empleador y Empleado.',
    }));
    setActiveTab('document'); // Redirige a la pestaña de edición
  };
  
  // 💡 LÓGICA DE MANEJO DE PÁRRAFOS (Necesarios para el editor)
  const handleAddParagraph = () => {
    const newParagraph = { id: Date.now().toString(), content: 'Nuevo párrafo de contenido.' };
    setFormData(prev => ({ ...prev, paragraphs: [...prev.paragraphs, newParagraph] }));
  };

  const handleUpdateParagraph = (paragraphId, newContent) => {
    setFormData(prev => ({
      ...prev,
      paragraphs: prev.paragraphs.map(p => p.id === paragraphId ? { ...p, content: newContent } : p)
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


  // 💡 FUNCIÓN DE GUARDADO PRINCIPAL (POST/PUT a /api/plantillas)
  const handleSaveTemplate = async (newStatus = 'publicado') => {
    const dataToSend = {
      // ID para la actualización (PUT)
      id: formData.id, 
      title: formData.title || formData.documentTitle, 
      section: formData.section || 'General',
      companies: formData.companies,
      
      // Contenido del documento
      documentTitle: formData.documentTitle,
      paragraphs: formData.paragraphs,
      signatureText: formData.signatureText,
      
      // Asociación al formulario original
      formId: formData.formId, 
      
      status: newStatus, // Usamos el status pasado por el botón
      updatedAt: new Date().toISOString(),
    };
    
    // ❌ CORRECCIÓN CRÍTICA DE VALIDACIÓN
    if (!dataToSend.formId) {
      alert("ERROR: Debe seleccionar un Formulario Base primero.");
      return;
    }
    if (!dataToSend.title?.trim()) {
        alert("ERROR: Debe ingresar un Título para la Plantilla (interno).");
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
    
    // Definir el método y URL
    const isUpdating = !!formData.id;
    const url = "https://accionaapi.vercel.app/api/plantillas"; 
    const method = "POST"; // POST para crear o POST para actualizar (según su endpoint de MongoDB)
    
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
        // Actualizar el ID si fue un POST exitoso
        id: savedData._id || savedData.id || prev.id, 
        status: savedData.status || newStatus,
      }));

      alert(`Plantilla guardada como ${newStatus} exitosamente.`);

      // Actualizar URL si es nuevo
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


  // Navigation tabs
  const tabs = [
    { id: 'properties', label: 'Seleccionar Formulario', icon: 'Settings' }, 
    { id: 'document', label: 'Editar Plantilla', icon: 'FileText', count: formData.paragraphs?.length }, 

  ];
  //actualizacion
  const getTabContent = () => {
    // 💡 CALCULAR VARIABLES DINÁMICAS
    const dynamicVariables = formData.questions
      .filter(q => q.title && q.title.trim() !== '') ;

    // 💡 AÑADIR VARIABLES ESTÁTICAS
    const staticVariables = [
      { name: "Fecha Actual (DD/MM/YYYY)", var: "{{FECHA_ACTUAL}}" },
      { name: "Hora Actual (HH:MM)", var: "{{HORA_ACTUAL}}" },
      { name: "Nombre del Autor", var: "{{AUTOR_NOMBRE}}" },
      { name: "Nombre de la empresa", var: "{{NOMBRE_EMPRESA}}" },
      { name: "Rut de la Empresa", var: "{{RUT_EMPRESA}}" },
    ];
    
    // 💡 COMBINAR LAS VARIABLES
    const availableVariables = [...dynamicVariables, ...staticVariables];


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
            templateData={{
                title: formData.documentTitle,
                paragraphs: formData.paragraphs,
                signatureText: formData.signatureText,
            }}
            onUpdateTemplateData={updateFormData} 
            availableVariables={availableVariables}
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
          {/* Header Section */}
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

            {/* BOTONES DE ACCIÓN */}
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="default"
                // 💡 LLAMADA A LA FUNCIÓN DE GUARDADO DE PLANTILLA
                onClick={() => handleSaveTemplate('publicado')} 
                loading={isSaving}
                iconName="Send"
                iconPosition="left"
                // 💡 CORRECCIÓN: Usar isSaving en lugar de isPublishing para el loading
                disabled={!formData.formId || isSaving || !formData.documentTitle || formData.paragraphs.length === 0} 
              >
                {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
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
                      // Deshabilitar la pestaña "Documento" si no se ha seleccionado una base
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

            {/* Tab Content */}
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
