import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

const QuestionEditor = ({ question, isSelected, onUpdate }) => {
  // Estado local para evitar pérdida de foco
  const [localQuestion, setLocalQuestion] = useState({ ...question });

  // Sincronizar cuando la pregunta cambia externamente
  useEffect(() => {
    setLocalQuestion({ ...question });
  }, [question]);

  // Guardar cambios al perder foco
  const saveChanges = () => {
    onUpdate(localQuestion.id, localQuestion);
  };

  // Manejo de cambios locales
  const handleFieldChange = (field, value) => {
    setLocalQuestion(prev => ({ ...prev, [field]: value }));
  };

  // Función para agregar opción
  const addOption = () => {
    const newOptions = [...(localQuestion.options || []), `Opción ${(localQuestion.options?.length || 0) + 1}`];
    const updatedQuestion = { ...localQuestion, options: newOptions };
    setLocalQuestion(updatedQuestion);
    onUpdate(updatedQuestion.id, updatedQuestion);
  };

  // Función para actualizar opción (solo estado local)
  const updateOption = (index, value) => {
    const newOptions = [...(localQuestion.options || [])];
    newOptions[index] = value;
    setLocalQuestion(prev => ({ ...prev, options: newOptions }));
  };

  // Función para eliminar opción
  const removeOption = (index) => {
    const newOptions = (localQuestion.options || []).filter((_, i) => i !== index);
    const updatedQuestion = { ...localQuestion, options: newOptions };
    setLocalQuestion(updatedQuestion);
    onUpdate(updatedQuestion.id, updatedQuestion);
  };

  const renderQuestionInput = () => {
    switch (localQuestion.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder="Escriba su respuesta aquí"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
          />
        );

      case 'time':
        return (
          <input
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
          />
        );

      case 'single_choice':
        return (
          <div className="space-y-2">
            {(localQuestion.options || []).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`question-${localQuestion.id}`}
                  className="h-4 w-4 text-blue-600"
                  disabled
                />
                {isSelected ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      onBlur={saveChanges}
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

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {(localQuestion.options || []).map((option, index) => (
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
                      onChange={(e) => updateOption(index, e.target.value)}
                      onBlur={saveChanges}
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
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
              <option>Seleccione una opción</option>
              {(localQuestion.options || []).map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            {isSelected && (
              <div className="mt-3 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Opciones:</label>
                {(localQuestion.options || []).map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      onBlur={saveChanges}
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
          value={localQuestion.title || ''}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          onBlur={saveChanges}
          className="w-full text-lg font-medium mb-3 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Escribe tu pregunta aquí"
        />
      ) : (
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          {localQuestion.title || 'Pregunta sin título'}
        </h3>
      )}
      {/* Componente de entrada según el tipo */}
      {renderQuestionInput()}
    </div>
  );
};

export default QuestionEditor;