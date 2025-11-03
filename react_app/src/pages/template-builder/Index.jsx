import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import TemplateList from './components/FormProperties'; // 💡 CORRECCIÓN: Renombrada a TemplateList
import QuestionBuilder from './components/TemplateBuilder';


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
    questions: [],
    status: 'borrador',
    section: '',
    icon: 'FileText',
    companies: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    documentTitle: '', // Se usa para el documento generado
    paragraphs: [],
    signatureText: 'Firma del Empleador y Empleado.',
    formId: null,
  });

  const [activeTab, setActiveTab] = useState('properties');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Load form from localStorage if editing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams?.get('id');

    const fetchForm = async () => {
      try {
        const res = await fetch(`https://accionaapi.vercel.app/api/forms/${formId}`);
        if (!res.ok) throw new Error('Formulario no encontrado');
        const data = await res.json();

        // Normalización corregida - incluyendo section
        const normalizedForm = {
          id: data._id || data.id || null,
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          responseTime: data.responseTime || '',
          author: data.author || 'Admin',
          primaryColor: data.primaryColor || '#3B82F6',
          secondaryColor: data.secondaryColor || '#F3F4F6',
          questions: data.questions || [],
          status: data.status || 'borrador',
          section: data.section || '',
          icon: data.icon || 'FileText',
          companies: data.companies || [],
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        };

        setFormData(normalizedForm);
      } catch (err) {
        console.error('Error cargando el formulario:', err);
        alert('No se pudo cargar el formulario');
      }
    };

    if (formId) {
      fetchForm();
    }
  }, []);

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


  const updateFormData = (field, value) => {
    // Validación específica para el título
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
  // (Llamada desde TemplateList.jsx)
  const handleTemplateSelect = (selectedTemplateData) => {
    
    setFormData(prev => ({
      ...prev,
      // Reemplaza los campos esenciales del formulario actual con la plantilla seleccionada
      title: selectedTemplateData.title || prev.title,
      section: selectedTemplateData.section || prev.section,
      questions: selectedTemplateData.questions || prev.questions,
      // Mantiene el ID si ya está editando un borrador, sino lo deja en null para un nuevo POST
      id: selectedTemplateData.id,
      // Mueve a la pestaña del documento para edición
      documentTitle: selectedTemplateData.title, // Usar el título del formulario como título del documento
      activeTab: 'document'
    }));
    setActiveTab('document');
    console.log('Datos de plantilla cargados.');
  };

  const saveForm = async () => {
    const newStatus = "borrador";
    const newUpdatedAt = new Date().toISOString();

    // 💡 Paso 2: Usar el estado actual (o una versión mejorada) para enviar los datos correctos
    // Creamos el objeto de datos que vamos a enviar al backend
    const dataToSend = {
      ...formData,
      status: newStatus,
      updatedAt: newUpdatedAt
    };

    if (!dataToSend?.title?.trim()) { // 💡 Usar dataToSend
      alert("Por favor ingresa un título para el formulario");
      return;
    }

    // Validación adicional de títulos de preguntas (Usar dataToSend)
    const hasLongQuestionTitles = dataToSend.questions.some(
      q => (q.title?.length || 0) > 50
    );

    if (hasLongQuestionTitles) {
      alert('Una o más preguntas tienen títulos que exceden los 50 caracteres');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("https://accionaapi.vercel.app/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 💡 ¡CORRECCIÓN! Enviamos el objeto dataToSend que ya tiene el nuevo status
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const savedForm = await response.json();


      setFormData(prev => ({
        ...prev,
        ...savedForm,
        id: savedForm.insertedId || savedForm.id || prev.id,
        title: savedForm.title || prev.title,
        section: savedForm.section || prev.section,
        category: savedForm.category || prev.category,
        questions: savedForm.questions || prev.questions,
        // Usar los valores guardados (que deberían ser "borrador") o los nuevos
        status: savedForm.status || newStatus,
        updatedAt: savedForm.updatedAt || newUpdatedAt
      }));

      alert("Formulario guardado como borrador exitosamente");

      // Actualizar URL si es nuevo
      if (!formData?.id) {
        window.history.replaceState({}, "", `?id=${savedForm.insertedId || savedForm._Id || savedForm.id}`);
      }

    } catch (error) {
      console.error(error);
      alert("Error al guardar el formulario: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };



  // Navigation tabs
  const tabs = [
    { id: 'properties', label: 'Seleccionar Plantilla', icon: 'Settings' }, // 💡 CAMBIADO LABEL
    { id: 'document', label: 'Documento', icon: 'FileText' }, // 💡 CAMBIADO ID Y LABEL

  ];
  //actualizacion
  const getTabContent = () => {
    // 💡 CALCULAR VARIABLES DINÁMICAS
    const dynamicVariables = formData.questions
      .filter(q => (q.title && q.title.trim() !== '') || q.text && q.text.trim() !== '') // Asegurarse de que el título exista

    // 💡 AÑADIR VARIABLES ESTÁTICAS DE METADATOS (opcional, pero útil)
    const staticVariables = [
      { title: "Fecha Actual (DD/MM/YYYY)", var: "{{FECHA_ACTUAL}}" },
      { title: "Hora Actual (HH:MM)", var: "{{HORA_ACTUAL}}" },
      { title: "Nombre del Autor", var: "{{AUTOR_NOMBRE}}" },
      { title: "Nombre de la empresa", var: "{{NOMBRE_EMPRESA}}" },
      { title: "Rut de la EmpresaRut", var: "{{RUT_EMPRESA}}" },
    ];

    // 💡 COMBINAR LAS VARIABLES
    const availableVariables = [...dynamicVariables, ...staticVariables];


    switch (activeTab) {
      case 'properties': // 💡 CAMBIO: Ahora carga la tabla de selección (TemplateList)
        return (
          <TemplateList
            // 💡 CORRECCIÓN: Pasamos la función de handler para que cambie de pestaña
            onUpdateFormData={handleTemplateSelect}
          />
        );
      case 'document': // 💡 CAMBIO: Reemplazamos 'questions' por 'document'
        return (
          <QuestionBuilder
            // 💡 CAMBIO: Los props deben reflejar la estructura del nuevo DocumentTemplateEditor
            templateData={formData}
            onUpdateTemplateData={updateFormData} // Usamos la función base para actualizar campos
            // Pasamos las variables dinámicas
            availableVariables={availableVariables}
          />
        );
      default:
        return null;
    }
  };

  const handleSaveTemplate = async () => {
    const dataToSend = {
      // Metadatos de la plantilla
      id: formData.id, // ID para la actualización (PUT)
      title: formData.title || formData.documentTitle, 
      section: formData.section || 'General',
      companies: formData.companies,
      
      // Contenido del documento
      documentTitle: formData.documentTitle,
      paragraphs: formData.paragraphs,
      signatureText: formData.signatureText,
      
      // Asociación al formulario original
      formId: formData.formId, // ID del formulario base
      
      status: 'publicado', 
      updatedAt: new Date().toISOString(),
    };
    
    if (!dataToSend.title || !dataToSend.formId || dataToSend.paragraphs.length === 0) {
      alert("Debe seleccionar un formulario base, ingresar un título y al menos un párrafo.");
      return;
    }

    setIsSaving(true);
    
    // Definir el método y URL
    const isUpdating = !!formData.id;
    const url = isUpdating 
        ? `https://accionaapi.vercel.app/api/plantillas` 
        : "https://accionaapi.vercel.app/api/plantillas"; 
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
        status: savedData.status || 'publicado',
      }));

      alert(`Plantilla guardada exitosamente.`);

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
                  onClick={() => window.location.href = '/template-builder'}
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
                // 💡 LLAMADA A LA FUNCIÓN DE GUARDADO DE PLANTILLA
                onClick={() => handleSaveTemplate('publicado')} 
                loading={isSaving}
                iconName="Send"
                iconPosition="left"
                disabled={!formData.id || isSaving} // Deshabilitar si no hay formulario asociado
              >
                Guardar Plantilla
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
