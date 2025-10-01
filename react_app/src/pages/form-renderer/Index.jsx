import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header.jsx';
import Sidebar from '../../components/ui/Sidebar.jsx';
import Icon from '../../components/AppIcon.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';

const FormRenderer = () => {
  const [formData, setFormData] = useState(null);
  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load form from URL parameter or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams?.get('id');
    
    if (formId) {
      // Try to load from localStorage first (for custom forms)
      const savedForms = JSON.parse(localStorage.getItem('customForms') || '[]');
      const customForm = savedForms?.find(form => form?.id === formId && form?.status === 'published');
      
      if (customForm) {
        setFormData(customForm);
      } else {
        // If not found in custom forms, show error
        setFormData(null);
      }
    }
    
    setLoading(false);
  }, []);

  // Update response for a question
  const updateResponse = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Clear error if user starts typing
    if (errors?.[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: null
      }));
    }
  };

  // Validate form responses
  const validateForm = () => {
    const newErrors = {};

    formData?.questions?.forEach(question => {
      if (question?.required) {
        const response = responses?.[question?.id];
        
        if (!response || (Array.isArray(response) && response?.length === 0) || response?.trim() === '') {
          newErrors[question.id] = 'Este campo es obligatorio';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Save response to localStorage (simulate database)
      const formResponse = {
        id: Date.now()?.toString(),
        formId: formData?.id,
        formTitle: formData?.title,
        responses: responses,
        submittedAt: new Date()?.toISOString(),
        submittedBy: 'Usuario Actual' // In real app, get from auth
      };

      const savedResponses = JSON.parse(localStorage.getItem('formResponses') || '[]');
      savedResponses?.push(formResponse);
      localStorage.setItem('formResponses', JSON.stringify(savedResponses));

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error al enviar el formulario. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render question input based on type
  const renderQuestionInput = (question) => {
    const hasError = errors?.[question?.id];
    const errorClass = hasError ? 'border-red-500 focus-visible:ring-red-500' : '';

    switch (question?.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={responses?.[question?.id] || ''}
            onChange={(e) => updateResponse(question?.id, e?.target?.value)}
            placeholder="Escribe tu respuesta..."
            error={errors?.[question?.id]}
            className={errorClass}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={responses?.[question?.id] || ''}
            onChange={(e) => updateResponse(question?.id, e?.target?.value)}
            placeholder="0"
            error={errors?.[question?.id]}
            className={errorClass}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={responses?.[question?.id] || ''}
            onChange={(e) => updateResponse(question?.id, e?.target?.value)}
            error={errors?.[question?.id]}
            className={errorClass}
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={responses?.[question?.id] || ''}
            onChange={(e) => updateResponse(question?.id, e?.target?.value)}
            error={errors?.[question?.id]}
            className={errorClass}
          />
        );

      case 'single_choice':
        return (
          <div className="space-y-2">
            <select
              value={responses?.[question?.id] || ''}
              onChange={(e) => updateResponse(question?.id, e?.target?.value)}
              className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errorClass}`}
            >
              <option value="">Selecciona una opción</option>
              {(question?.options || [])?.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors?.[question?.id] && (
              <p className="text-sm text-red-600">{errors?.[question?.id]}</p>
            )}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {(question?.options || [])?.map((option, idx) => (
              <label key={idx} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(responses?.[question?.id] || [])?.includes(option)}
                  onChange={(e) => {
                    const currentResponses = responses?.[question?.id] || [];
                    if (e?.target?.checked) {
                      updateResponse(question?.id, [...currentResponses, option]);
                    } else {
                      updateResponse(question?.id, currentResponses?.filter(r => r !== option));
                    }
                  }}
                  className="h-4 w-4 rounded border-2 border-input"
                />
                <span className="text-sm text-foreground">{option}</span>
              </label>
            ))}
            {errors?.[question?.id] && (
              <p className="text-sm text-red-600">{errors?.[question?.id]}</p>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-4 text-muted-foreground">
            Tipo de pregunta no soportado
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Sidebar />
        
        <main className="ml-64 pt-16">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando formulario...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Sidebar />
        
        <main className="ml-64 pt-16">
          <div className="p-6">
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="AlertCircle" size={24} className="text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Formulario no encontrado
              </h1>
              <p className="text-muted-foreground mb-6">
                El formulario que estás buscando no existe o no está publicado.
              </p>
              <Button
                onClick={() => window.location.href = '/form-center'}
                iconName="ArrowLeft"
                iconPosition="left"
              >
                Volver al Centro de Formularios
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Sidebar />
        <main className="ml-64 pt-16">
          <div className="p-6">
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="CheckCircle" size={24} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                ¡Formulario enviado exitosamente!
              </h1>
              <p className="text-muted-foreground mb-6">
                Gracias por completar "{formData?.title}". 
                Tu respuesta ha sido registrada correctamente.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/form-center'}
                  iconName="ArrowLeft"
                  iconPosition="left"
                >
                  Volver al Centro
                </Button>
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setResponses({});
                    setErrors({});
                  }}
                  iconName="RotateCcw"
                  iconPosition="left"
                >
                  Enviar Otra Respuesta
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="ml-64 pt-16">
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
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

            {/* Form Container */}
            <div 
              className="rounded-lg p-8"
              style={{ 
                backgroundColor: formData?.secondaryColor || '#F3F4F6'
              }}
            >
              {/* Form Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-black mb-4">
                  {formData?.title}
                </h1>
                
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 mb-4">
                  {formData?.category && (
                    <div className="flex items-center space-x-1">
                      <Icon name="Tag" size={14} />
                      <span className="capitalize">{formData?.category}</span>
                    </div>
                  )}
                  
                  {formData?.responseTime && (
                    <div className="flex items-center space-x-1">
                      <Icon name="Clock" size={14} />
                      <span>{formData?.responseTime} minutos</span>
                    </div>
                  )}
                  
                  {formData?.author && (
                    <div className="flex items-center space-x-1">
                      <Icon name="User" size={14} />
                      <span>{formData?.author}</span>
                    </div>
                  )}
                </div>

                <p className="text-gray-600">
                  {formData?.questions?.length} pregunta{formData?.questions?.length !== 1 ? 's' : ''} • 
                  {formData?.questions?.filter(q => q?.required)?.length} obligatoria{formData?.questions?.filter(q => q?.required)?.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {formData?.questions?.map((question, index) => (
                  <div key={question?.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    {/* Question Header */}
                    <div className="mb-4">
                      <div className="flex items-start space-x-3">
                        <div 
                          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: formData?.primaryColor || '#3B82F6' }}
                        >
                          {index + 1}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-black mb-1">
                            {question?.title}
                            {question?.required && (
                              <span className="text-red-600 ml-1">*</span>
                            )}
                          </h3>
                          
                          {question?.description && (
                            <p className="text-gray-600 text-sm">
                              {question?.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Question Input */}
                    <div className="ml-11">
                      {renderQuestionInput(question)}
                    </div>
                  </div>
                ))}

                {/* Form Actions */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      * Campos obligatorios
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.location.href = '/form-center'}
                      >
                        Cancelar
                      </Button>
                      
                      <Button
                        type="submit"
                        loading={isSubmitting}
                        iconName="Send"
                        iconPosition="left"
                        style={{ backgroundColor: formData?.primaryColor || '#3B82F6' }}
                        className="text-white hover:opacity-90"
                      >
                        {isSubmitting ? 'Enviando...' : 'Enviar Formulario'}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FormRenderer;