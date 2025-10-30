import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import TemplateList from './components/FormProperties'; // 💡 CORRECCIÓN: Renombrada a TemplateList
import QuestionBuilder from './components/TemplateBuilder';

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
    updatedAt: new Date().toISOString()
  });

  const [activeTab, setActiveTab] = useState('properties');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Question types available
  const questionTypes = [
    { value: 'text', label: 'Texto', icon: 'Type' },
    { value: 'number', label: 'Número', icon: 'Hash' },
    { value: 'date', label: 'Fecha', icon: 'Calendar' },
    { value: 'time', label: 'Hora', icon: 'Clock' },
    { value: 'email', label: 'Email', icon: 'Mail' },
    { value: 'file', label: 'Archivo', icon: 'Paperclip' },
    { value: 'single_choice', label: 'Selección Única', icon: 'CheckCircle' },
    { value: 'multiple_choice', label: 'Selección Múltiple', icon: 'CheckSquare' }
  ];

  // Categories available
  const categories = [
    { value: 'hr', label: 'Recursos Humanos' },
    { value: 'it', label: 'Tecnología' },
    { value: 'finance', label: 'Finanzas' },
    { value: 'operations', label: 'Operaciones' },
    { value: 'training', label: 'Capacitación' },
    { value: 'feedback', label: 'Retroalimentación' },
    { value: 'survey', label: 'Encuesta' },
    { value: 'evaluation', label: 'Evaluación' }
  ];

  const sections = [
    { value: 'Remuneraciones', label: 'Remuneraciones' },
    { value: 'Anexos', label: 'Anexos' },
    { value: 'Finiquitos', label: 'Finiquitos' },
    { value: 'Otras', label: 'Otras' }
  ];

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

  // Update form data
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
      id: prev.id,
      // Mueve a la pestaña del documento para edición
      documentTitle: selectedTemplateData.title, // Usar el título del formulario como título del documento
      activeTab: 'document'
    }));
    setActiveTab('document');
    console.log('Datos de plantilla cargados.');
  };


  // Add new question (Mutado a DocumentBuilder, pero mantenido para compatibilidad)
  const addQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      type: 'text',
      title: '',
      description: '',
      required: false,
      options: []
    };

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
      updatedAt: new Date().toISOString()
    }));

    // Switch to questions tab if not already there
    if (activeTab !== 'questions') {
      setActiveTab('questions');
    }

    // AGREGAR ESTA LÍNEA PARA RETORNAR LA NUEVA PREGUNTA
    return newQuestion;
  };

  // Update question
  const updateQuestion = (questionId, updatesOrField, value) => {
    setFormData(prev => {
      let updatedQuestions;

      // Si se pasan 3 argumentos (id, field, value)
      if (value !== undefined && typeof updatesOrField === 'string') {
        updatedQuestions = prev.questions.map(q =>
          q.id === questionId ? { ...q, [updatesOrField]: value } : q
        );
      }
      // Si se pasan 2 argumentos (id, updates)
      else if (typeof updatesOrField === 'object') {
        updatedQuestions = prev.questions.map(q =>
          q.id === questionId ? { ...q, ...updatesOrField } : q
        );
      }
      // Fallback por seguridad
      else {
        console.warn('Formato inválido en updateQuestion:', { questionId, updatesOrField, value });
        return prev;
      }

      return {
        ...prev,
        questions: updatedQuestions,
        updatedAt: new Date().toISOString()
      };
    });
  };

  // Delete question
  const deleteQuestion = (questionId) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId),
      updatedAt: new Date().toISOString()
    }));
  };

  // Move question up/down
  const moveQuestion = (questionId, direction) => {
    const currentIndex = formData.questions.findIndex(q => q.id === questionId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= formData.questions.length) return;

    const newQuestions = [...formData.questions];
    [newQuestions[currentIndex], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[currentIndex]];

    setFormData(prev => ({
      ...prev,
      questions: newQuestions,
      updatedAt: new Date().toISOString()
    }));
  };

  // Save form as borrador - FUNCIÓN CORREGIDA
  const saveForm = async () => {
    // 💡 Paso 1: Definir la actualización del estado que queremos enviar
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

      // 💡 Paso 3: Actualizar el estado DE FORMA ASÍNCRONA DESPUÉS del fetch
      // Ahora, la actualización de React incluye el resultado del servidor
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

  const deleteForm = async () => {
    try {
      const response = await fetch(`https://accionaapi.vercel.app/api/forms/${formData.id}`, {
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

  // Publish form
  const publishForm = async () => {
    if (!formData?.id) {
      alert("Primero guarda el borrador");
      return;
    }

    setIsPublishing(true);
    try {
      const response = await fetch(`https://accionaapi.vercel.app/api/forms/public/${formData._id || formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, status: "publicado" }),
      });

      const updatedForm = await response.json();
      setFormData(prev => ({ ...prev, status: "publicado" }));

      alert("¡Formulario publicado exitosamente!");
    } catch (error) {
      console.error(error);
      alert("Error al publicar el formulario");
    } finally {
      setIsPublishing(false);
    }
  };

  const generateVarTag = (title) => {
    if (!title) return '';

    // 1. Convertir a mayúsculas
    let tag = title.toUpperCase();

    // 2. Reemplazar caracteres no alfanuméricos (incluyendo espacios, tildes, ñ) por guion bajo
    // Se eliminan primero los acentos para que se traten bien como letras
    tag = tag.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 3. Reemplazar cualquier cosa que no sea letra, número o guion bajo por un guion bajo
    tag = tag.replace(/[^A-Z0-9]+/g, '_');

    // 4. Eliminar guiones bajos al inicio o al final, y asegurar que no haya dobles guiones bajos
    tag = tag.replace(/^_+|_+$/g, '').replace(/__+/g, '_');

    // 5. Envolver en el formato {{VARIABLE}}
    return `{{${tag}}}`;
  };

  // Navigation tabs
  const tabs = [
    { id: 'properties', label: 'Seleccionar Plantilla', icon: 'Settings' }, // 💡 CAMBIADO LABEL
    { id: 'document', label: 'Documento', icon: 'FileText', count: formData?.questions?.length }, // 💡 CAMBIADO ID Y LABEL

  ];
  //actualizacion
  const getTabContent = () => {
    // 💡 CALCULAR VARIABLES DINÁMICAS
    const dynamicVariables = formData.questions
      .filter(q => q.title && q.title.trim() !== '') // Asegurarse de que el título exista
      .map(q => ({
        name: q.title,
        var: generateVarTag(q.title)
      }));

    // 💡 AÑADIR VARIABLES ESTÁTICAS DE METADATOS (opcional, pero útil)
    const staticVariables = [
      { name: "Fecha Actual (DD/MM/YYYY)", var: "{{FECHA_ACTUAL}}" },
      { name: "Hora Actual (HH:MM)", var: "{{HORA_ACTUAL}}" },
      { name: "Nombre del Autor", var: "{{AUTOR_NOMBRE}}" },
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

            <div className="flex items-center space-x-3">
              {/* Status Badge */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${formData?.status === 'publicado'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
                }`}>
                {formData?.status === 'publicado' ? 'Publicado' : 'Borrador'}
              </div>

              {/* Action Buttons */}
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de que quieres eliminar este Formulario?')) {
                      deleteForm();
                    }
                  }}
                  className="mt-3 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Icon name="Trash2" size={14} />
                </Button>
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
