import React, { useState } from 'react';
import Icon from '../../../components/AppIcon.jsx';

const FormPreview = ({ formData }) => {
  const [answers, setAnswers] = useState({});

  // Manejar cambios en inputs
  const handleInputChange = (questionTitle, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionTitle]: value,
    }));
  };

  // Manejar cambios en radio buttons
  const handleRadioChange = (questionTitle, optionValue) => {
    setAnswers((prev) => ({
      ...prev,
      [questionTitle]: optionValue,
    }));
  };

  // Manejar cambios en checkboxes múltiples
  const handleCheckboxChange = (questionTitle, option) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionTitle] || [];
      if (currentAnswers.includes(option)) {
        return {
          ...prev,
          [questionTitle]: currentAnswers.filter((o) => o !== option),
        };
      } else {
        return {
          ...prev,
          [questionTitle]: [...currentAnswers, option],
        };
      }
    });
  };

  // Función para renderizar una pregunta individual CON soporte para subsecciones recursivas
  const renderQuestion = (question, index, showNumber = true, parentPath = '') => {
    const questionPath = parentPath ? `${parentPath}.${question.id}` : question.id;
    const questionTitle = question.title || `Pregunta ${index + 1}`; // 👈 SOLO el título, sin jerarquía
    const baseInputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black text-base';
    const value = answers[questionTitle] || '';

    const renderInput = () => {
      switch (question?.type) {
        case 'text':
          return (
            <input
              type="text"
              placeholder="Escribe tu respuesta aquí..."
              className={baseInputClass}
              value={value}
              onChange={(e) => handleInputChange(questionTitle, e.target.value)}
            />
          );

        case 'number':
          return (
            <input
              type="number"
              placeholder="0"
              className={baseInputClass}
              value={value}
              onChange={(e) => handleInputChange(questionTitle, e.target.value)}
            />
          );

        case 'date':
          return (
            <input
              type="date"
              className={baseInputClass}
              value={value}
              onChange={(e) => handleInputChange(questionTitle, e.target.value)}
            />
          );

        case 'time':
          return (
            <input
              type="time"
              className={baseInputClass}
              value={value}
              onChange={(e) => handleInputChange(questionTitle, e.target.value)}
            />
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
                        onChange={(e) => handleRadioChange(questionTitle, e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-base text-black">{optionText}</span>
                    </label>
                  </div>
                );
              })}
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
                        className="h-4 w-4 rounded-full border-2 border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2"
                      />
                      <span className="text-base text-black">{optionText}</span>
                    </label>
                  </div>
                );
              })}
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

        {/* Subsecciones recursivas de esta pregunta - SE MUESTRAN AUTOMÁTICAMENTE */}
        {(question?.options || []).map((option, optionIndex) => {
          if (typeof option === 'object' && option.hasSubform && option.subformQuestions && option.subformQuestions.length > 0) {
            const optionText = option.text || `Opción ${optionIndex + 1}`;
            
            // Verificar si esta subsección debe mostrarse (AUTOMÁTICO)
            const shouldShowSubsection = 
              question.type === 'single_choice' 
                ? answers[questionTitle] === optionText
                : question.type === 'multiple_choice'
                ? Array.isArray(answers[questionTitle]) && answers[questionTitle].includes(optionText)
                : false;

            if (shouldShowSubsection) {
              return (
                <div key={`${questionPath}-${optionIndex}`} className="space-y-4">
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
        submittedAt: new Date().toISOString(),
      };

      console.log('Enviando respuestas:', payload); // Para debug

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
                    </h3>

                    <p className="text-gray-600 text-base">
                      mail de envio de respaldo de respuestas
                    </p>
                  </div>
                </div>
              </div>

              <div className={"ml-11"}>
                <input
                  type="mail"
                  placeholder="Escribe tu mail aquí..."
                  className='w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black text-base'
                  value={respaldo}
                  onChange={(e) => handleInputChange(questionTitle, e.target.value)}
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
                    onClick={() => setAnswers({})}
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