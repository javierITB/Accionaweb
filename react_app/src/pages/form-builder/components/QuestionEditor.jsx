import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

const QuestionEditor = ({ question, isSelected, onUpdate }) => {
  // Estado local para evitar pérdida de foco
  const [localQuestion, setLocalQuestion] = useState({ ...question });
  const [localOptions, setLocalOptions] = useState([...question?.options || []]);

  // Sincronizar cuando la pregunta cambia externamente
  useEffect(() => {
    setLocalQuestion({ ...question });
    setLocalOptions([...question?.options || []]);
  }, [question]);

  // Guardar cambios inmediatamente para campos críticos
  const saveChanges = (updates = {}) => {
    const updatedQuestion = { ...localQuestion, ...updates };
    onUpdate(localQuestion.id, { 
      ...updatedQuestion, 
      options: localOptions 
    });
  };

  // Manejo de cambios del título - guardado inmediato
  const handleTitleChange = (value) => {
    const updatedQuestion = { ...localQuestion, title: value };
    setLocalQuestion(updatedQuestion);
    // Guardar inmediatamente el título
    onUpdate(localQuestion.id, { 
      ...updatedQuestion, 
      options: localOptions 
    });
  };

  // Manejo de opciones locales
  const handleOptionChange = (index, value) => {
    const newOptions = [...localOptions];
    newOptions[index] = value;
    setLocalOptions(newOptions);
  };

  // Guardar opciones al perder foco
  const saveOptions = () => {
    onUpdate(localQuestion.id, { 
      ...localQuestion, 
      options: localOptions 
    });
  };

  const addOption = () => {
    const newOptions = [...localOptions, `Opción ${localOptions.length + 1}`];
    setLocalOptions(newOptions);
    onUpdate(localQuestion.id, { 
      ...localQuestion, 
      options: newOptions 
    });
  };

  const removeOption = (index) => {
    const newOptions = localOptions.filter((_, i) => i !== index);
    setLocalOptions(newOptions);
    onUpdate(localQuestion.id, { 
      ...localQuestion, 
      options: newOptions 
    });
  };

  // Normalizar tipos para compatibilidad
  const getNormalizedType = () => {
    const type = localQuestion.type;
    if (type === 'single_choice') return 'single-choice';
    if (type === 'multiple_choice') return 'multiple-choice';
    return type;
  };

  const renderQuestionInput = () => {
    const normalizedType = getNormalizedType();
    
    switch (normalizedType) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={localQuestion?.placeholder || 'Escriba su respuesta aquí'}
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

      case 'single-choice':
        return (
          <div className="space-y-2">
            {localOptions.map((option, index) => (
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
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      onBlur={saveOptions}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded"
                    />
                    {localOptions.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    )}
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
            {localOptions.map((option, index) => (
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
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      onBlur={saveOptions}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded"
                    />
                    {localOptions.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    )}
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
              {localOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            {isSelected && (
              <div className="mt-3 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Opciones:</label>
                {localOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      onBlur={saveOptions}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded"
                    />
                    {localOptions.length > 1 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    )}
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
          onChange={(e) => handleTitleChange(e.target.value)}
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