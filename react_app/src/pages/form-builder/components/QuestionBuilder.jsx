import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const QuestionBuilder = ({
  questions,
  questionTypes,
  onUpdateQuestion,
  onDeleteQuestion,
  onMoveQuestion,
  onAddQuestion,
  primaryColor
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const QuestionCard = ({ question, index }) => {
    const [localQuestion, setLocalQuestion] = useState({ ...question });
    const isExpanded = expandedQuestion === question.id;

    // Sincronizar cuando la pregunta cambia externamente
    useEffect(() => {
      setLocalQuestion({ ...question });
    }, [question]);

    // Guardar cambios al perder foco o en acciones específicas
    const saveChanges = () => {
      onUpdateQuestion(localQuestion.id, localQuestion);
    };

    // Manejo de cambios locales
    const handleFieldChange = (field, value) => {
      setLocalQuestion(prev => ({ ...prev, [field]: value }));
    };

    // Manejo de cambio de tipo con inicialización de opciones
    const handleTypeChange = (newType) => {
      const updatedQuestion = { ...localQuestion, type: newType };

      // Inicializar opciones para tipos de selección
      if (newType === 'single_choice' || newType === 'multiple_choice' || newType === 'dropdown') {
        if (!localQuestion.options || localQuestion.options.length === 0) {
          updatedQuestion.options = ['Opción 1', 'Opción 2'];
        }
      } else {
        // Limpiar opciones para otros tipos
        updatedQuestion.options = [];
      }

      setLocalQuestion(updatedQuestion);
      onUpdateQuestion(updatedQuestion.id, updatedQuestion);
    };

    // Función para agregar opción
    const addOption = () => {
      const newOptions = [...(localQuestion.options || []), `Opción ${(localQuestion.options?.length || 0) + 1}`];
      const updatedQuestion = { ...localQuestion, options: newOptions };
      setLocalQuestion(updatedQuestion);
      onUpdateQuestion(updatedQuestion.id, updatedQuestion);
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
      onUpdateQuestion(updatedQuestion.id, updatedQuestion);
    };

    const questionType = questionTypes.find(type => type.value === localQuestion.type);

    return (
      <div className="bg-card border border-border rounded-lg">
        {/* Question Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Icon
                  name={questionType?.icon || 'HelpCircle'}
                  size={16}
                  style={{ color: primaryColor }}
                />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {localQuestion.title || `Pregunta ${index + 1}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {questionType?.label || 'Tipo no definido'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Move buttons */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveQuestion(question.id, 'up')}
                disabled={index === 0}
              >
                <Icon name="ChevronUp" size={14} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveQuestion(question.id, 'down')}
                disabled={index === questions.length - 1}
              >
                <Icon name="ChevronDown" size={14} />
              </Button>

              {/* Expand/Collapse */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
              >
                <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={14} />
              </Button>

              {/* Delete */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
                    onDeleteQuestion(question?.id);
                  }
                }}
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Icon name="Trash2" size={14} />
              </Button>
            </div>
          </div>
        </div>

        {/* Question Configuration (Expanded) */}
        {isExpanded && (
          <div className="p-4 space-y-4">
            {/* Tipo de Pregunta */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Tipo de Pregunta
              </label>
              <select
                value={localQuestion.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-white"
              >
                {questionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Details */}
            <div className="space-y-4">
              <Input
                label="Título de la Pregunta"
                placeholder="Escribe tu pregunta aquí..."
                value={localQuestion.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                onBlur={saveChanges}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Descripción (Opcional)
                </label>
                <textarea
                  placeholder="Agrega una descripción o instrucciones adicionales..."
                  value={localQuestion.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={saveChanges}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>

            {/* Options for Choice Questions */}
            {(localQuestion.type === 'single_choice' || localQuestion.type === 'multiple_choice') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Opciones de Respuesta
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    iconName="Plus"
                    iconPosition="left"
                  >
                    Agregar Opción
                  </Button>
                </div>

                <div className="space-y-2">
                  {(localQuestion.options || []).map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-2">
                      <Input
                        placeholder={`Opción ${optionIndex + 1}`}
                        value={option}
                        onChange={(e) => updateOption(optionIndex, e.target.value)}
                        onBlur={saveChanges}
                      />

                      {(localQuestion.options || []).length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(optionIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Icon name="X" size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Options for Dropdown */}
            {localQuestion.type === 'dropdown' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Opciones del Dropdown
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    iconName="Plus"
                    iconPosition="left"
                  >
                    Agregar Opción
                  </Button>
                </div>

                <div className="space-y-2">
                  {(localQuestion.options || []).map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-2">
                      <Input
                        placeholder={`Opción ${optionIndex + 1}`}
                        value={option}
                        onChange={(e) => updateOption(optionIndex, e.target.value)}
                        onBlur={saveChanges}
                      />

                      {(localQuestion.options || []).length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(optionIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Icon name="X" size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Section */}
            <div className="border-t pt-4">
              <h5 className="font-medium text-foreground mb-3">Vista Previa</h5>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      {localQuestion.title || 'Título de la pregunta'}
                    </label>
                    {localQuestion.description && (
                      <p className="text-sm text-muted-foreground">
                        {localQuestion.description}
                      </p>
                    )}
                  </div>

                  {/* Preview Input */}
                  {localQuestion.type === 'text' && (
                    <input
                      type="text"
                      placeholder="Respuesta de texto"
                      className="w-full px-3 py-2 border border-input rounded-md bg-white"
                      disabled
                    />
                  )}

                  {localQuestion.type === 'number' && (
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-3 py-2 border border-input rounded-md bg-white"
                      disabled
                    />
                  )}

                  {localQuestion.type === 'date' && (
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-input rounded-md bg-white"
                      disabled
                    />
                  )}

                  {localQuestion.type === 'time' && (
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-input rounded-md bg-white"
                      disabled
                    />
                  )}

                  {localQuestion.type === 'single_choice' && (
                    <div className="space-y-2">
                      {(localQuestion.options || []).map((option, idx) => (
                        <label key={idx} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`preview-${localQuestion.id}`}
                            className="h-4 w-4 text-blue-600"
                            disabled
                          />
                          <span className="text-sm">
                            {option || `Opción ${idx + 1}`}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {localQuestion.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {(localQuestion.options || []).map((option, idx) => (
                        <label key={idx} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600"
                            disabled
                          />
                          <span className="text-sm">
                            {option || `Opción ${idx + 1}`}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {localQuestion.type === 'dropdown' && (
                    <select
                      className="w-full px-3 py-2 border border-input rounded-md bg-white"
                      disabled
                    >
                      <option>Selecciona una opción</option>
                      {(localQuestion.options || []).map((option, idx) => (
                        <option key={idx} value={option}>
                          {option || `Opción ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Constructor de Preguntas</h3>
        <Button onClick={onAddQuestion} iconName="Plus" iconPosition="left">
          Agregar Pregunta
        </Button>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <QuestionCard key={q.id} question={q} index={i} />
        ))}
      </div>
      {/* Quick Add Section */}
      {questions?.length > 0 && (
        <div onClick={onAddQuestion} className="bg-muted/50 border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 text-center">

          <Icon name="Plus" size={24} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground mb-3">
            ¿Listo para la siguiente pregunta?
          </p>
          <Button
            onClick={onAddQuestion}
            variant="outline"
            iconName="Plus"
            iconPosition="left"
          >
            Agregar Otra Pregunta
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestionBuilder;