import React from 'react';
import Icon from '../../../components/AppIcon.jsx';


const FormPreview = ({ formData }) => {
  const renderQuestionInput = (question) => {
    const baseInputClass = "w-full px-3 py-2 border border-input rounded-md bg-white text-black";

    switch (question?.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder="Escribe tu respuesta aquí..."
            className={baseInputClass}

          />
        );

      case 'number':
        return (
          <input
            type="number"
            placeholder="0"
            className={baseInputClass}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            className={baseInputClass}

          />
        );

      case 'time':
        return (
          <input
            type="time"
            className={baseInputClass}

          />
        );

      case 'single_choice':
        return (
          <select className={baseInputClass} >
            <option>Selecciona una opción</option>
            {(question?.options || [])?.map((option, idx) => (
              <option key={idx} value={option}>
                {option || `Opción ${idx + 1}`}
              </option>
            ))}
          </select>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {(question?.options || [])?.map((option, idx) => (
              <label key={idx} className="flex items-center space-x-3 cursor-not-allowed">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-2 border-input"
                  disabled
                />
                <span className="text-sm text-black">
                  {option || `Opción ${idx + 1}`}
                </span>
              </label>
            ))}
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

  if (!formData?.title && formData?.questions?.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="Eye" size={24} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Vista previa no disponible
        </h3>
        <p className="text-muted-foreground">
          Completa las propiedades del formulario y agrega preguntas para ver la vista previa
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview Container */}
      <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-1">
        <div
          className="rounded-lg p-6 min-h-96"
          style={{
            backgroundColor: formData?.secondaryColor || '#F3F4F6'
          }}
        >
          {/* Form Header */}
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
                {formData?.questions?.length} pregunta{formData?.questions?.length !== 1 ? 's' : ''} •
                {formData?.questions?.filter(q => q?.required)?.length} obligatoria{formData?.questions?.filter(q => q?.required)?.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Form Questions */}
          <div className="space-y-8">
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
                        {question?.title || `Pregunta ${index + 1}`}
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
                  <button
                    className="px-6 py-3 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    style={{ backgroundColor: formData?.primaryColor || '#3B82F6' }}
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