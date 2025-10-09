import React, { useState } from 'react';
import Icon from '../../../components/AppIcon.jsx';

const FormPreview = ({ formData }) => {
  const [answers, setAnswers] = useState({});
  const [respaldo, setRespaldo] = useState("");
  const [errors, setErrors] = useState({}); // Para validación
  const [touched, setTouched] = useState({}); // Para manejar campos tocados

  // Manejar cambios en inputs
  const handleInputChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
    }
  };

  // Manejar blur en inputs (para validación)
  const handleInputBlur = (questionId, value, isRequired) => {
    setTouched(prev => ({
      ...prev,
      [questionId]: true
    }));

    // Validar si es requerido y está vacío
    if (isRequired && !value) {
      setErrors(prev => ({
        ...prev,
        [questionId]: 'Este campo es obligatorio'
      }));
    }
  };

  // Manejar cambios en radio buttons
  const handleRadioChange = (questionId, optionValue) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionValue,
    }));
    
    // Limpiar error cuando seleccione una opción
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
    }
  };

  // Manejar cambios en checkboxes múltiples
  const handleCheckboxChange = (questionId, option) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionId] || [];
      let newAnswers;
      
      if (currentAnswers.includes(option)) {
        newAnswers = currentAnswers.filter((o) => o !== option);
      } else {
        newAnswers = [...currentAnswers, option];
      }

      // Limpiar error cuando seleccione al menos una opción
      if (errors[questionId] && newAnswers.length > 0) {
        setErrors(prev => ({
          ...prev,
          [questionId]: ''
        }));
      }

      return {
        ...prev,
        [questionId]: newAnswers,
      };
    });
  };

  // Validar formulario antes de enviar
  const validateForm = () => {
    const newErrors = {};
    
    formData?.questions?.forEach(question => {
      if (question.required) {
        const answer = answers[question.id];
        
        if (!answer || 
            (Array.isArray(answer) && answer.length === 0) ||
            answer === '') {
          newErrors[question.id] = 'Este campo es obligatorio';
        }
      }
    });

    // Validar campo de respaldo si es requerido
    if (!respaldo.trim()) {
      newErrors['respaldo'] = 'El correo de respaldo es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para renderizar una pregunta individual
  const renderQuestion = (question, index, showNumber = true, parentPath = '') => {
    const questionPath = parentPath ? `${parentPath}.${question.id}` : question.id;
    const questionTitle = question.title || `Pregunta ${index + 1}`;
    const baseInputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';
    const value = answers[question.id] || '';
    const error = errors[question.id];
    const isTouched = touched[question.id];

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
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                onBlur={(e) => handleInputBlur(question.id, e.target.value, question.required)}
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
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                onBlur={(e) => handleInputBlur(question.id, e.target.value, question.required)}
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
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                onBlur={(e) => handleInputBlur(question.id, e.target.value, question.required)}
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
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                onBlur={(e) => handleInputBlur(question.id, e.target.value, question.required)}
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
                        name={questionPath}
                        value={optionValue}
                        checked={value === optionValue}
                        onChange={(e) => handleRadioChange(question.id, e.target.value)}
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
                        onChange={() => handleCheckboxChange(question.id, optionText)}
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

    return (
      <div key={question?.id} className="space-y-4">
        {/* Pregunta principal */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="mb-4">
            <div className="flex items-start space-x-3">
              {showNumber && (
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{
                    backgroundColor: formData?.primaryColor || '#3B82F6',
                  }}
                >
                  {index + 1}
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-black mb-1">
                  {questionTitle}
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

          <div className={showNumber ? "ml-11" : ""}>
            {renderInput()}
          </div>
        </div>

        {/* Subsecciones recursivas de esta pregunta */}
        {(question?.options || []).map((option, optionIndex) => {
          if (typeof option === 'object' && option.hasSubform && option.subformQuestions && option.subformQuestions.length > 0) {
            const optionText = option.text || `Opción ${optionIndex + 1}`;
            
            // Verificar si esta subsección debe mostrarse
            const shouldShowSubsection = 
              question.type === 'single_choice' 
                ? answers[question.id] === optionText
                : question.type === 'multiple_choice'
                ? Array.isArray(answers[question.id]) && answers[question.id].includes(optionText)
                : false;

            if (shouldShowSubsection) {
              return (
                <div key={`${questionPath}-${optionIndex}`} className="space-y-4 ml-8 border-l-2 border-gray-200 pl-4">
                  {option.subformQuestions.map((subQuestion, subIndex) =>
                    renderQuestion(subQuestion, subIndex, false, questionPath)
                  )}
                </div>
              );
            }
          }
          return null;
        })}
      </div>
    );
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
        responses: cleanAnswers,
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

          {/* Preguntas y subsecciones recursivas */}
          <div className="space-y-6">
            {formData?.questions?.map((question, index) =>
              renderQuestion(question, index, true)
            )}

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="mb-4">
                <div className="flex items-start space-x-3">
                  {formData?.questions?.length && (
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                      style={{
                        backgroundColor: formData?.primaryColor || '#3B82F6',
                      }}
                    >
                      {formData?.questions?.length + 1}
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black mb-1">
                      Respaldo de información
                      <span className="text-red-600 ml-1">*</span>
                    </h3>

                    <p className="text-gray-600 text-base">
                      mail de envio de respaldo de respuestas
                    </p>
                  </div>
                </div>
              </div>

              <div className={"ml-11"}>
                <input
                  type="email"
                  placeholder="Escribe tu mail aquí..."
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    errors.respaldo ? 'border-red-500 ring-2 ring-red-200' : ''
                  }`}
                  value={respaldo}
                  onChange={(e) => {
                    setRespaldo(e.target.value);
                    if (errors.respaldo) {
                      setErrors(prev => ({ ...prev, respaldo: '' }));
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      setErrors(prev => ({ ...prev, respaldo: 'El correo de respaldo es obligatorio' }));
                    }
                  }}
                />
                {errors.respaldo && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <Icon name="AlertCircle" size={14} className="mr-1" />
                    {errors.respaldo}
                  </p>
                )}
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