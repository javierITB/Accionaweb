import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import FormProperties from './components/FormProperties';
import QuestionBuilder from './components/QuestionBuilder';
import FormPreview from './components/FormPreview';

const FormBuilder = () => {
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    description: '', // NUEVO
    category: '',
    responseTime: '',
    author: 'Admin',
    primaryColor: '#3B82F6',
    secondaryColor: '#F3F4F6',
    questions: [],
    status: 'draft',
    section: '',
    logo: '', // NUEVO
    company: '', // NUEVO
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
    { value: 'single_choice', label: 'Selección Única', icon: 'CheckCircle' },
    { value: 'multiple_choice', label: 'Selección Múltiple', icon: 'CheckSquare' }
  ];

  // Categories available
  const categories = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Cliente', label: 'Cliente' },
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
        const res = await fetch(`http://192.168.0.2:4000/api/forms/${formId}`);
        if (!res.ok) throw new Error('Formulario no encontrado');
        const data = await res.json();

        // Normalización corregida - incluyendo section
        const normalizedForm = {
          id: data._id || data.id || null,
          title: data.title || '',
          description: data.description || '', // NUEVO
          category: data.category || '',
          responseTime: data.responseTime || '',
          author: data.author || 'Admin',
          primaryColor: data.primaryColor || '#3B82F6',
          secondaryColor: data.secondaryColor || '#F3F4F6',
          questions: data.questions || [],
          status: data.status || 'draft',
          section: data.section || '',
          logo: data.logo || '', // NUEVO
          company: data.company || '', // NUEVO
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

  // Add new question
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

  // Save form as draft - FUNCIÓN CORREGIDA
  const saveForm = async () => {
    if (!formData?.title?.trim()) {
      alert("Por favor ingresa un título para el formulario");
      return;
    }

    // Validación adicional de títulos de preguntas
    const hasLongQuestionTitles = formData.questions.some(
      q => (q.title?.length || 0) > 50
    );

    if (hasLongQuestionTitles) {
      alert('Una o más preguntas tienen títulos que exceden los 50 caracteres');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("http://192.168.0.2:4000/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const savedForm = await response.json();

      // Actualizar el estado preservando los datos locales
      setFormData(prev => ({
        ...prev,
        ...savedForm,
        id: savedForm._id || savedForm.id || prev.id,
        title: savedForm.title || prev.title,
        section: savedForm.section || prev.section,
        category: savedForm.category || prev.category,
        questions: savedForm.questions || prev.questions,
        status: savedForm.status || prev.status,
        updatedAt: savedForm.updatedAt || new Date().toISOString()
      }));

      alert("Formulario guardado como borrador exitosamente");

      // Actualizar URL si es nuevo
      if (!formData?.id) {
        window.history.replaceState({}, "", `?id=${savedForm._id || savedForm.id}`);
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
      const response = await fetch(`http://192.168.0.2:4000/api/forms/${formData.id}`, {
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
      const response = await fetch(`http://192.168.0.2:4000/api/forms/public/${formData._id || formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, status: "published" }),
      });

      const updatedForm = await response.json();
      setFormData(prev => ({ ...prev, status: "published" }));

      alert("¡Formulario publicado exitosamente!");
    } catch (error) {
      console.error(error);
      alert("Error al publicar el formulario");
    } finally {
      setIsPublishing(false);
    }
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'properties':
        return (
          <FormProperties
            formData={formData}
            categories={categories}
            sections={sections}
            onUpdateFormData={updateFormData}
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
                  {formData?.id ? 'Editar Formulario' : 'Crear Formulario Personalizado'}
                </h1>
                <p className="text-muted-foreground">
                  {formData?.id
                    ? 'Modifica tu formulario existente y administra las preguntas'
                    : 'Diseña un formulario personalizado con preguntas dinámicas'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg">
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