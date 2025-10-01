import React from 'react';
import { Plus, X } from 'lucide-react';

const QuestionEditor = ({ question, isSelected, onUpdate }) => {
  const updateQuestion = (updates) => {
    onUpdate(question?.id, updates);
  };

  const addOption = () => {
    const newOptions = [...question?.options, `Opción ${question?.options?.length + 1}`];
    updateQuestion({ options: newOptions });
  };

  const updateOption = (index, value) => {
    const newOptions = [...question?.options];
    newOptions[index] = value;
    updateQuestion({ options: newOptions });
  };

  const removeOption = (index) => {
    const newOptions = question?.options?.filter((_, i) => i !== index);
    updateQuestion({ options: newOptions });
  };

  const renderQuestionInput = () => {
    switch (question?.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={question?.placeholder || 'Escriba su respuesta aquí'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            disabled
          />
        );

      case 'number':
        return (
          <input
            type="number"
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            disabled
          />
        );

      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            disabled
          />
        );

      case 'time':
        return (
          <input
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            disabled
          />
        );

      case 'single-choice':
        return (
          <div className="space-y-2">
            {question?.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`question-${question?.id}`}
                  className="h-4 w-4 text-blue-600"
                  disabled
                />
                {isSelected ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e?.target?.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded"
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-700">{option}</span>
                )}
              </div>
            ))}
            {isSelected && (
              <button
                onClick={addOption}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <Plus size={16} />
                <span>Agregar opción</span>
              </button>
            )}
          </div>
        );

      case 'multiple-choice':
        return (
          <div className="space-y-2">
            {question?.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600"
                  disabled
                />
                {isSelected ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e?.target?.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded"
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-700">{option}</span>
                )}
              </div>
            ))}
            {isSelected && (
              <button
                onClick={addOption}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <Plus size={16} />
                <span>Agregar opción</span>
              </button>
            )}
          </div>
        );

      case 'dropdown':
        return (
          <div>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" disabled>
              <option>Seleccione una opción</option>
              {question?.options?.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            {isSelected && (
              <div className="mt-3 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Opciones:</label>
                {question?.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e?.target?.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded"
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <Plus size={16} />
                  <span>Agregar opción</span>
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* Título de la pregunta */}
      {isSelected ? (
        <input
          type="text"
          value={question?.title}
          onChange={(e) => updateQuestion({ title: e?.target?.value })}
          className="w-full text-lg font-medium mb-3 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Escribe tu pregunta aquí"
        />
      ) : (
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          {question?.title}
        </h3>
      )}
      {/* Componente de entrada según el tipo */}
      {renderQuestionInput()}
    </div>
  );
};

export default QuestionEditor;