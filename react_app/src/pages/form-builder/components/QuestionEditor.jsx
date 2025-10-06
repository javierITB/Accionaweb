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

  // Guardar cambios de manera optimizada
  const saveChanges = (questionUpdates = {}, optionsUpdates = null) => {
    const updatedQuestion = { ...localQuestion, ...questionUpdates };
    const finalOptions = optionsUpdates !== null ? optionsUpdates : localOptions;
    
    setLocalQuestion(updatedQuestion);
    if (optionsUpdates) setLocalOptions([...finalOptions]);
    
    onUpdate(localQuestion.id, {
      ...updatedQuestion,
      options: finalOptions
    });
  };

  // Manejo de cambios del título
  const handleTitleChange = (value) => {
    saveChanges({ title: value });
  };

  // Manejo de opciones locales
  const handleOptionChange = (index, value) => {
    const newOptions = [...localOptions];
    newOptions[index] = value;
    setLocalOptions(newOptions);
  };

  // Guardar opciones al perder foco
  const saveOptions = () => {
    saveChanges({}, localOptions);
  };

  const addOption = () => {
    const newOptions = [...localOptions, `Opción ${localOptions.length + 1}`];
    saveChanges({}, newOptions);
  };

  const removeOption = (index) => {
    const newOptions = localOptions.filter((_, i) => i !== index);
    saveChanges({}, newOptions);
  };

  // Normalizar tipos para compatibilidad
  const getNormalizedType = () => {
    const type = localQuestion.type;
    if (type === 'single_choice') return 'single-choice';
    if (type === 'multiple_choice') return 'multiple-choice';
    return type;
  };

  // Renderizar opciones para tipos de selección
  const renderOptions = () => {
    return (
      <div className="space-y-2">
        {localOptions.map((option, index) => (
          <div key={`option-${localQuestion.id}-${index}`} className="flex items-center space-x-2">
            {getNormalizedType() === 'single-choice' ? (
              <input
                type="radio"
                name={`question-${localQuestion.id}`}
                className="h-4 w-4 text-blue-600"
                disabled
              />
            ) : (
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600"
                disabled
              />
            )}
            {isSelected ? (
              <div className="flex items-center space-x-2 flex-1">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  onBlur={saveOptions}
                  placeholder={`Opción ${index + 1}`}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded"
                />
                {localOptions.length > (getNormalizedType() === 'dropdown' ? 1 : 2) && (
                  <button
                    onClick={() => removeOption(index)}
                    className="text-red-500 hover:text-red-700"
                    type="button"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <span className="text-gray-700">{option || `Opción ${index + 1}`}</span>
            )}
          </div>
        ))}
        {isSelected && (
          <button
            onClick={addOption}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            type="button"
          >
            <Plus size={16} />
            <span>Agregar opción</span>
          </button>
        )}
      </div>
    );
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
            disabled={!isSelected}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            disabled={!isSelected}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            disabled={!isSelected}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            disabled={!isSelected}
          />
        );

      case 'single-choice':
      case 'multiple-choice':
        return renderOptions();

      case 'dropdown':
        return (
          <div>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              disabled={!isSelected}
            >
              <option value="">Seleccione una opción</option>
              {localOptions.map((option, index) => (
                <option key={`dropdown-${localQuestion.id}-${index}`} value={option}>
                  {option || `Opción ${index + 1}`}
                </option>
              ))}
            </select>
            {isSelected && (
              <div className="mt-3 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Opciones:</label>
                {localOptions.map((option, index) => (
                  <div key={`dropdown-edit-${localQuestion.id}-${index}`} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      onBlur={saveOptions}
                      placeholder={`Opción ${index + 1}`}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded"
                    />
                    {localOptions.length > 1 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700"
                        type="button"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                  type="button"
                >
                  <Plus size={16} />
                  <span>Agregar opción</span>
                </button>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-gray-500">Tipo de pregunta no soportado: {normalizedType}</div>
        );
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      {/* Título de la pregunta CORREGIDO */}
      {isSelected ? (
        <input
          type="text"
          value={localQuestion.title || ''}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Título de la pregunta" 
          className="w-full text-lg font-medium text-gray-900 mb-3 px-3 py-2 border border-gray-300 rounded"
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