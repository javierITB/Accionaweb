import React, { useState } from 'react';
import Icon from '../../../components/AppIcon.jsx';

const FormPreview = ({ formData }) => {
  const [answers, setAnswers] = useState({});
  const [respaldo, setRespaldo] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Función para obtener el título de una pregunta (sin concatenación)
  const getQuestionTitle = (question) => {
    return question.title || 'Pregunta sin título';
  };

  // Manejar cambios en inputs - USA TÍTULOS
  const handleInputChange = (questionTitle, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionTitle]: value,
    }));
    
    if (errors[questionTitle]) {
      setErrors(prev => ({
        ...prev,
        [questionTitle]: ''
      }));
    }
  };

  // Manejar blur en inputs (para validación) - USA TÍTULOS
  const handleInputBlur = (questionTitle, value, isRequired) => {
    setTouched(prev => ({
      ...prev,
      [questionTitle]: true
    }));

    if (isRequired && !value) {
      setErrors(prev => ({
        ...prev,
        [questionTitle]: 'Este campo es obligatorio'
      }));
    }
  };

  // Manejar cambios en radio buttons - USA TÍTULOS
  const handleRadioChange = (questionTitle, optionValue) => {
    setAnswers((prev) => ({
      ...prev,
      [questionTitle]: optionValue,
    }));
    
    if (errors[questionTitle]) {
      setErrors(prev => ({
        ...prev,
        [questionTitle]: ''
      }));
    }
  };

  // Manejar cambios en checkboxes múltiples - USA TÍTULOS
  const handleCheckboxChange = (questionTitle, option) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionTitle] || [];
      let newAnswers;
      
      if (currentAnswers.includes(option)) {
        newAnswers = currentAnswers.filter((o) => o !== option);
      } else {
        newAnswers = [...currentAnswers, option];
      }

      if (errors[questionTitle] && newAnswers.length > 0) {
        setErrors(prev => ({
          ...prev,
          [questionTitle]: ''
        }));
      }

      return {
        ...prev,
        [questionTitle]: newAnswers,
      };
    });
  };

  // Función recursiva para validar preguntas y subsecciones - USA TÍTULOS
  const validateQuestions = (questions, answers) => {
    const errors = {};

    const validateQuestionRecursive = (questionList) => {
      questionList.forEach((question) => {
        const questionTitle = getQuestionTitle(question);
        
        // Validar pregunta principal
        if (question.required) {
          const answer = answers[questionTitle];
          
          if (!answer || 
              (Array.isArray(answer) && answer.length === 0) ||
              answer === '') {
            errors[questionTitle] = 'Este campo es obligatorio';
          }
        }

        // Validar subsecciones si están activas
        (question?.options || []).forEach((option) => {
          if (typeof option === 'object' && option.hasSubform && option.subformQuestions && option.subformQuestions.length > 0) {
            const optionText = option.text || 'Opción';
            
            // Verificar si esta subsección debe estar activa
            const shouldValidateSubsection = 
              question.type === 'single_choice' 
                ? answers[questionTitle] === optionText
                : question.type === 'multiple_choice'
                ? Array.isArray(answers[questionTitle]) && answers[questionTitle].includes(optionText)
                : false;

            if (shouldValidateSubsection) {
              // Validar recursivamente las preguntas de la subsección
              validateQuestionRecursive(option.subformQuestions);
            }
          }
        });
      });
    };

    validateQuestionRecursive(questions);
    return errors;
  };

  // Validar formulario antes de enviar
  const validateForm = () => {
    let newErrors = {};

    // Validar preguntas principales y subsecciones recursivamente
    newErrors = validateQuestions(formData?.questions || [], answers);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función recursiva para renderizar todas las preguntas (principales y subsecciones)
  const renderAllQuestions = (questions, parentIndex = 0) => {
    let currentIndex = parentIndex;
    const renderedQuestions = [];

    const renderQuestionRecursive = (questionList, isSubsection = false) => {
      return questionList.map((question, localIndex) => {
        const questionTitle = getQuestionTitle(question);
        const displayTitle = question.title || `Pregunta ${currentIndex + 1}`;
        const baseInputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';
        const value = answers[questionTitle] || '';
        const error = errors[questionTitle];
        const isTouched = touched[questionTitle];

        const renderInput = () => {
          switch (question?.type) {
            case 'text':
              return (
                <div>
                  <input
                    type="text"
                    placeholder="Escribe tu respuesta aquí..."
                    className={`${baseInputClass} ${error ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                    value={value}
                    onChange={(e) => handleInputChange(questionTitle, e.target.value)}
                    onBlur={(e) => handleInputBlur(questionTitle, e.target.value, question.required)}
                  />
                  {error && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <Icon name="AlertCircle" size={14} className="mr-1" />
                      {error}
                    </p>
                  )}
                </div>
              );

            case 'number':
              return (
                <div>
                  <input
                    type="number"
                    placeholder="0"
                    className={`${baseInputClass} ${error ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                    value={value}
                    onChange={(e) => handleInputChange(questionTitle, e.target.value)}
                    onBlur={(e) => handleInputBlur(questionTitle, e.target.value, question.required)}
                  />
                  {error && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <Icon name="AlertCircle" size={14} className="mr-1" />
                      {error}
                    </p>
                  )}
                </div>
              );

            case 'date':
              return (
                <div>
                  <input
                    type="date"
                    className={`${baseInputClass} ${error ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                    value={value}
                    onChange={(e) => handleInputChange(questionTitle, e.target.value)}
                    onBlur={(e) => handleInputBlur(questionTitle, e.target.value, question.required)}
                  />
                  {error && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <Icon name="AlertCircle" size={14} className="mr-1" />
                      {error}
                    </p>
                  )}
                </div>
              );

            case 'time':
              return (
                <div>
                  <input
                    type="time"
                    className={`${baseInputClass} ${error ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                    value={value}
                    onChange={(e) => handleInputChange(questionTitle, e.target.value)}
                    onBlur={(e) => handleInputBlur(questionTitle, e.target.value, question.required)}
                  />
                  {error && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <Icon name="AlertCircle" size={14} className="mr-1" />
                      {error}
                    </p>
                  )}
                </div>
              );

            case 'single_choice':
              return (
                <div className="space-y-3">
                  {(question?.options || []).map((option, idx) => {
                    const optionText = typeof option === 'object' ? option.text : option;
                    const optionValue = typeof option === 'object' ? option.text : option;

                    return (
                      <div key={idx} className="space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name={questionTitle}
                            value={optionValue}
                            checked={value === optionValue}
                            onChange={(e) => handleRadioChange(questionTitle, e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-base text-black">{optionText}</span>
                        </label>
                      </div>
                    );
                  })}
                  {error && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <Icon name="AlertCircle" size={14} className="mr-1" />
                      {error}
                    </p>
                  )}
                </div>
              );

            case 'multiple_choice':
              return (
                <div className="space-y-3">
                  {(question?.options || []).map((option, idx) => {
                    const optionText = typeof option === 'object' ? option.text : option;
                    const isChecked = Array.isArray(value) && value.includes(optionText);

                    return (
                      <div key={idx} className="space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxChange(questionTitle, optionText)}
                            className="h-4 w-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2"
                          />
                          <span className="text-base text-black">{optionText}</span>
                        </label>
                      </div>
                    );
                  })}
                  {error && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <Icon name="AlertCircle" size={14} className="mr-1" />
                      {error}
                    </p>
                  )}
                </div>
              );

            default:
              return (
                <div className="text-center py-4 text-gray-500">
                  Tipo de pregunta no soportado
                </div>
              );
          }
        };

        const questionElement = (
          <div key={`${questionTitle}-${currentIndex}`} className="space-y-4">
            {/* Pregunta */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="mb-4">
                <div className="flex items-start space-x-3">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{
                      backgroundColor: formData?.primaryColor || '#3B82F6',
                    }}
                  >
                    {currentIndex + 1}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black mb-1">
                      {displayTitle}
                      {question?.required && (
                        <span className="text-red-600 ml-1">*</span>
                      )}
                    </h3>

                    {question?.description && (
                      <p className="text-gray-600 text-base">
                        {question?.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="ml-11">
                {renderInput()}
              </div>
            </div>
          </div>
        );

        currentIndex++;
        renderedQuestions.push(questionElement);

        // Procesar subsecciones si están activas
        (question?.options || []).forEach((option) => {
          if (typeof option === 'object' && option.hasSubform && option.subformQuestions && option.subformQuestions.length > 0) {
            const optionText = option.text || 'Opción';
            
            // Verificar si esta subsección debe mostrarse
            const shouldShowSubsection = 
              question.type === 'single_choice' 
                ? answers[questionTitle] === optionText
                : question.type === 'multiple_choice'
                ? Array.isArray(answers[questionTitle]) && answers[questionTitle].includes(optionText)
                : false;

            if (shouldShowSubsection) {
              // Renderizar subsecciones al mismo nivel
              const subQuestions = renderQuestionRecursive(option.subformQuestions, true);
              renderedQuestions.push(...subQuestions);
            }
          }
        });

        return questionElement;
      });
    };

    renderQuestionRecursive(questions);
    return renderedQuestions;
  };

  // Enviar formulario al endpoint de tu API
  const handleSubmit = async () => {
    // Validar antes de enviar
    if (!validateForm()) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      // Limpiar respuestas vacías
      const cleanAnswers = Object.fromEntries(
        Object.entries(answers).filter(([_, value]) => 
          value !== '' && 
          value !== null && 
          value !== undefined &&
          !(Array.isArray(value) && value.length === 0)
        )
      );

      const payload = {
        formId: formData?.id,
        formTitle: formData?.title,
        responses: cleanAnswers, // SE ENVÍAN LOS TÍTULOS DE LAS PREGUNTAS
        mail: respaldo,
        submittedAt: new Date().toISOString(),
      };

      console.log('Enviando respuestas:', payload);

      const res = await fetch(`http://192.168.0.2:4000/api/respuestas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error al enviar respuestas');

      const data = await res.json();
      alert('Respuestas enviadas con éxito');
      console.log('Respuestas guardadas:', data);

      // Limpia el formulario
      setAnswers({});
      setRespaldo("");
      setErrors({});
      setTouched({});
    } catch (err) {
      console.error(err);
      alert('No se pudieron enviar las respuestas');
    }
  };

  if (!formData?.title && formData?.questions?.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="Eye" size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Vista previa no disponible
        </h3>
        <p className="text-gray-600">
          Completa las propiedades del formulario y agrega preguntas para ver la vista previa
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Contenedor de la vista previa */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-1">
        <div
          className="rounded-lg p-6 min-h-96"
          style={{
            backgroundColor: formData?.secondaryColor || '#F3F4F6',
          }}
        >
          {/* Cabecera del formulario */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">
              {formData?.title || 'Título del Formulario'}
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

            {formData?.questions?.length > 0 && (
              <p className="text-gray-600">
                {formData?.questions?.length} pregunta
                {formData?.questions?.length !== 1 ? 's' : ''} •{' '}
                {formData?.questions?.filter((q) => q?.required)?.length} obligatoria
                {formData?.questions?.filter((q) => q?.required)?.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Preguntas y subsecciones recursivas - TODAS AL MISMO NIVEL */}
          <div className="space-y-6">
            {renderAllQuestions(formData?.questions || [])}

            {/* CAMPO RESPALDO - NO OBLIGATORIO */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="mb-4">
                <div className="flex items-start space-x-3">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{
                      backgroundColor: formData?.primaryColor || '#3B82F6',
                    }}
                  >
                    {/* Número dinámico basado en el total de preguntas */}
                    {(formData?.questions?.length || 0) + 1}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black mb-1">
                      Respaldo de información
                    </h3>

                    <p className="text-gray-600 text-base">
                      mail de envio de respaldo de respuestas (opcional)
                    </p>
                  </div>
                </div>
              </div>

              <div className="ml-11">
                <input
                  type="email"
                  placeholder="Escribe tu mail aquí (opcional)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={respaldo}
                  onChange={(e) => setRespaldo(e.target.value)}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  * Campos obligatorios
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    className="px-6 py-3 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setAnswers({});
                      setRespaldo("");
                      setErrors({});
                      setTouched({});
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleSubmit}
                    style={{
                      backgroundColor: formData?.primaryColor || '#3B82F6',
                    }}
                    className="px-6 py-3 rounded-md font-medium text-white hover:opacity-90 transition-opacity"
                  >
                    Enviar Formulario
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;