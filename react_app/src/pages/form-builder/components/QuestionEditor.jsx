import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X } from 'lucide-react';

const QuestionEditor = ({
  question,
  isSelected,
  onUpdate,
  isSubform = false,
  depth = 0,
  questionTypes = [],
  primaryColor = '#3B82F6',
  onToggleSubform = null
}) => {
  const [localQuestion, setLocalQuestion] = useState({ ...question });
  const [localOptions, setLocalOptions] = useState([...question?.options || []]);

  useEffect(() => {
    setLocalQuestion({ ...question });
    setLocalOptions([...question?.options || []]);
  }, [question]);

  const saveChanges = useCallback((questionUpdates = {}, optionsUpdates = null) => {
    const updatedQuestion = { ...localQuestion, ...questionUpdates };
    const finalOptions = optionsUpdates !== null ? optionsUpdates : localOptions;

    setLocalQuestion(updatedQuestion);
    if (optionsUpdates !== null) {
      setLocalOptions([...finalOptions]);
    }

    onUpdate(localQuestion.id, {
      ...updatedQuestion,
      options: finalOptions
    });
  }, [localQuestion, localOptions, onUpdate]);

  const handleTitleChange = useCallback((value) => {
    if (value.length <= 50) {
      const updatedQuestion = { ...localQuestion, title: value };
      setLocalQuestion(updatedQuestion);
    }
  }, [localQuestion]);

  const handleFieldChange = useCallback((field, value) => {
    const updatedQuestion = { ...localQuestion, [field]: value };
    setLocalQuestion(updatedQuestion);
  }, [localQuestion]);

  const handleOptionChange = useCallback((index, value) => {
    const newOptions = [...localOptions];

    if (typeof newOptions[index] === 'string') {
      newOptions[index] = {
        id: `opt-${index}-${Date.now()}`,
        text: value,
        hasSubform: false
      };
    } else {
      newOptions[index] = {
        ...newOptions[index],
        text: value
      };
    }

    setLocalOptions(newOptions);
  }, [localOptions]);

  const handleOptionBlur = useCallback(() => {
    saveChanges({}, localOptions);
  }, [localOptions, saveChanges]);

  const addOption = useCallback(() => {
    const newOption = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: `Opción ${localOptions.length + 1}`,
      hasSubform: false
    };

    const newOptions = [...localOptions, newOption];
    saveChanges({}, newOptions);

    requestAnimationFrame(() => {
      window.scrollTo(0, currentScroll);
    });

  }, [localOptions, saveChanges]);

  const removeOption = useCallback((index) => {
    const newOptions = localOptions.filter((_, i) => i !== index);
    saveChanges({}, newOptions);
  }, [localOptions, saveChanges]);

  const handleToggleSubform = useCallback((index, hasSubform) => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    const newOptions = [...localOptions];
    const option = newOptions[index];

    if (typeof option === 'string') {
      newOptions[index] = {
        id: `opt-${index}-${Date.now()}`,
        text: option,
        hasSubform,
        subformQuestions: hasSubform ? [] : undefined
      };
    } else {
      newOptions[index] = {
        ...option,
        hasSubform,
        subformQuestions: hasSubform ? (option.subformQuestions || []) : undefined
      };
    }

    setLocalOptions(newOptions);
    saveChanges({}, newOptions);

    if (onToggleSubform) {
      onToggleSubform(index, hasSubform);
    }

    requestAnimationFrame(() => {
      window.scrollTo(0, currentScroll);
    });
  }, [localOptions, saveChanges, onToggleSubform]);

  const getNormalizedType = useCallback(() => {
    const type = localQuestion.type;
    if (type === 'single_choice') return 'single-choice';
    if (type === 'multiple_choice') return 'multiple-choice';
    return type;
  }, [localQuestion.type]);

  const getOptionText = useCallback((option) => {
    return typeof option === 'string' ? option : option.text;
  }, []);

  const getOptionHasSubform = useCallback((option) => {
    return typeof option === 'object' ? option.hasSubform : false;
  }, []);

  const renderOptions = useCallback(() => {
    return (
      <div className="space-y-3">
        {localOptions.map((option, index) => (
          <div key={typeof option === 'object' ? option.id : `option-${index}`} className="space-y-2">
            <div className="flex items-center space-x-2">
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
                    value={getOptionText(option)}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    onBlur={handleOptionBlur}
                    placeholder={`Opción ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />

                  <label className="flex items-center space-x-2 text-sm text-blue-600 cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={getOptionHasSubform(option)}
                      onChange={(e) => handleToggleSubform(index, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Subsección</span>
                  </label>

                  {localOptions.length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-gray-700">{getOptionText(option) || `Opción ${index + 1}`}</span>
              )}
            </div>
          </div>
        ))}

        {isSelected && (
          <button
            onClick={addOption}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 py-2"
            type="button"
          >
            <Plus size={16} />
            <span>Agregar opción</span>
          </button>
        )}
      </div>
    );
  }, [
    localOptions,
    isSelected,
    localQuestion.id,
    getNormalizedType,
    getOptionText,
    getOptionHasSubform,
    handleOptionChange,
    handleOptionBlur,
    handleToggleSubform,
    removeOption,
    addOption
  ]);

  const renderFileConfig = useCallback(() => {
    // Usar valores de la pregunta o valores por defecto
    const accept = localQuestion.accept || '.pdf,application/pdf';
    const maxSize = localQuestion.maxSize || '1';
    const multiple = localQuestion.multiple || false;

    // Convertir accept a texto legible
    const getReadableAccept = (acceptStr) => {
      const types = acceptStr.split(',').map(t => t.trim());
      return types.map(type => {
        if (type.startsWith('.')) return type.toUpperCase();
        if (type === 'image/*') return 'Imágenes';
        if (type === 'application/pdf') return 'PDF';
        if (type === 'video/*') return 'Videos';
        if (type === 'audio/*') return 'Audio';
        return type;
      }).join(', ');
    };

    return (
      <div className="mt-3 space-y-4 p-4 bg-gray-50 rounded-lg border">
        {/* ✅ Múltiples archivos - YA ESTÁ BIEN */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={multiple}
            onChange={(e) => handleFieldChange('multiple', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Permitir múltiples archivos</span>
        </div>

        {/* ✅ Formatos permitidos - NUEVO */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Tipos de archivo permitidos
          </label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={accept}
            onChange={(e) => handleFieldChange('accept', e.target.value)}
            placeholder=".pdf,.doc,.docx,.jpg,.png"
            onBlur={saveChanges}
          />
          <p className="text-xs text-muted-foreground">
            Separar extensiones con comas: .pdf, .doc, .jpg, image/*, application/pdf
          </p>
        </div>

        {/* ✅ Tamaño máximo - NUEVO */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Tamaño máximo (MB)
          </label>
          <input
            type="number"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={maxSize}
            onChange={(e) => handleFieldChange('maxSize', e.target.value)}
            placeholder="10"
            onBlur={saveChanges}
          />
        </div>

        {/* ✅ Resumen de configuración */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Configuración actual:</strong>
          </p>
          <div className="space-y-1 text-sm text-blue-700">
            <div className="flex justify-between">
              <span>Formatos:</span>
              <span className="font-medium">{getReadableAccept(accept)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tamaño máximo:</span>
              <span className="font-medium">{maxSize} MB</span>
            </div>
            <div className="flex justify-between">
              <span>Múltiples archivos:</span>
              <span className="font-medium">{multiple ? 'Sí' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }, [
    localQuestion.multiple,
    localQuestion.accept,
    localQuestion.maxSize,
    handleFieldChange,
    saveChanges
  ]);

  const renderQuestionInput = useCallback(() => {
    const normalizedType = getNormalizedType();

    switch (normalizedType) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={localQuestion?.placeholder || 'Escriba su respuesta aquí'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!isSelected}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!isSelected}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!isSelected}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!isSelected}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            placeholder={localQuestion?.placeholder || 'ejemplo@correo.com'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!isSelected}
          />
        );

      case 'file':
        return (
          <div>
            <input
              type="file"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!isSelected}
              multiple={localQuestion.multiple || false}
              accept={localQuestion.accept || '.pdf,application/pdf'}
            />
            {isSelected && renderFileConfig()}
          </div>
        );

      case 'single-choice':
      case 'multiple-choice':
        return renderOptions();

      case 'dropdown':
        return (
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!isSelected}
            >
              <option value="">Seleccione una opción</option>
              {localOptions.map((option, index) => (
                <option key={`dropdown-${localQuestion.id}-${index}`} value={getOptionText(option)}>
                  {getOptionText(option) || `Opción ${index + 1}`}
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
                      value={getOptionText(option)}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      onBlur={handleOptionBlur}
                      placeholder={`Opción ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />

                    <label className="flex items-center space-x-2 text-sm text-blue-600 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={getOptionHasSubform(option)}
                        onChange={(e) => handleToggleSubform(index, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Sub</span>
                    </label>

                    {localOptions.length > 1 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        type="button"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 py-2"
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
  }, [
    getNormalizedType,
    localQuestion,
    isSelected,
    localOptions,
    renderOptions,
    renderFileConfig,
    getOptionText,
    getOptionHasSubform,
    handleOptionChange,
    handleOptionBlur,
    handleToggleSubform,
    removeOption,
    addOption
  ]);

  const getContainerClass = useCallback(() => {
    if (isSubform) {
      const depthColors = [
        'border-blue-200 bg-blue-50',
        'border-green-200 bg-green-50',
        'border-yellow-200 bg-yellow-50',
        'border-purple-200 bg-purple-50'
      ];
      const colorClass = depthColors[Math.min(depth, depthColors.length - 1)];
      return `p-4 border-l-4 ${colorClass} rounded-lg ml-${Math.min(depth, 4) * 4}`;
    }
    return "p-4 border border-gray-200 rounded-lg bg-white";
  }, [isSubform, depth]);

  const handleTitleBlur = useCallback(() => {
    saveChanges({ title: localQuestion.title });
  }, [localQuestion.title, saveChanges]);

  const handleDescriptionBlur = useCallback(() => {
    saveChanges({ description: localQuestion.description });
  }, [localQuestion.description, saveChanges]);

  const handleTypeChange = useCallback((e) => {
    const newType = e.target.value;
    const updatedQuestion = { ...localQuestion, type: newType };

    let updatedOptions = [...localOptions];
    if (newType === 'single_choice' || newType === 'multiple_choice') {
      if (!localOptions || localOptions.length === 0) {
        updatedOptions = [
          { id: `opt-0-${Date.now()}`, text: '', hasSubform: false },
          { id: `opt-1-${Date.now()}`, text: '', hasSubform: false }
        ];
        setLocalOptions(updatedOptions);
      }
    } else {
      updatedOptions = [];
      setLocalOptions(updatedOptions);
    }

    setLocalQuestion(updatedQuestion);
    onUpdate(localQuestion.id, {
      ...updatedQuestion,
      options: updatedOptions
    });
  }, [localQuestion, localOptions, onUpdate]);

  const handleRequiredChange = useCallback((e) => {
    const updatedQuestion = { ...localQuestion, required: e.target.checked };
    setLocalQuestion(updatedQuestion);
    onUpdate(localQuestion.id, {
      ...updatedQuestion,
      options: localOptions
    });
  }, [localQuestion, localOptions, onUpdate]);

  return (
    <div className={getContainerClass()}>
      {isSubform && isSelected && (
        <div className="flex items-center gap-2 mb-2 text-sm text-blue-600 font-medium">
          <span>Subsección - Nivel {depth + 1}</span>
        </div>
      )}

      {isSelected ? (
        <div className="mb-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Pregunta
            </label>
            <select
              value={localQuestion.type || 'text'}
              onChange={handleTypeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {questionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Título de la Pregunta *
            </label>
            <input
              type="text"
              value={localQuestion.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={handleTitleBlur}
              maxLength={50}
              placeholder="Título de la pregunta"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-blue-500 ${(localQuestion.title?.length || 0) >= 50
                ? 'border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:ring-blue-200'
                }`}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {localQuestion.title?.length || 0}/50 caracteres
              </span>
              {(localQuestion.title?.length || 0) >= 50 && (
                <span className="text-xs text-red-500">
                  Límite de caracteres alcanzado
                </span>
              )}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (Opcional)
            </label>
            <textarea
              value={localQuestion.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Agrega una descripción o instrucciones adicionales..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <label className="flex items-center space-x-2 mb-3">
            <input
              type="checkbox"
              checked={localQuestion.required || false}
              onChange={handleRequiredChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Campo obligatorio</span>
          </label>
        </div>
      ) : (
        <div className="mb-3">
          <h3 className="text-lg font-medium text-gray-900">
            {localQuestion.title || 'Pregunta sin título'}
            {localQuestion.required && <span className="text-red-600 ml-1">*</span>}
          </h3>
          {localQuestion.description && (
            <p className="text-sm text-gray-600 mt-1">{localQuestion.description}</p>
          )}
          {isSubform && (
            <div className="text-xs text-blue-600 mt-1">
              Nivel {depth + 1}
            </div>
          )}
        </div>
      )}

      {renderQuestionInput()}
    </div>
  );
};

export default React.memo(QuestionEditor);