import React, { useState } from 'react';
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

  // Add option to choice question
  const addOption = (questionId) => {
    const question = questions?.find(q => q?.id === questionId);
    const newOptions = [...(question?.options || []), ''];
    onUpdateQuestion(questionId, 'options', newOptions);
  };

  // Update option value
  const updateOption = (questionId, optionIndex, value) => {
    const question = questions?.find(q => q?.id === questionId);
    const newOptions = [...(question?.options || [])];
    newOptions[optionIndex] = value;
    onUpdateQuestion(questionId, 'options', newOptions);
  };

  // Remove option
  const removeOption = (questionId, optionIndex) => {
    const question = questions?.find(q => q?.id === questionId);
    const newOptions = (question?.options || [])?.filter((_, index) => index !== optionIndex);
    onUpdateQuestion(questionId, 'options', newOptions);
  };

  const QuestionCard = ({ question, index }) => {
    const isExpanded = expandedQuestion === question?.id;
    const questionType = questionTypes?.find(type => type?.value === question?.type);

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
                  {question?.title || `Pregunta ${index + 1}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {questionType?.label || 'Tipo no definido'}
                </p>
              </div>
              {question?.required && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                  Obligatorio
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Move buttons */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveQuestion(question?.id, 'up')}
                disabled={index === 0}
                className="h-8 w-8"
              >
                <Icon name="ChevronUp" size={14} />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveQuestion(question?.id, 'down')}
                disabled={index === questions?.length - 1}
                className="h-8 w-8"
              >
                <Icon name="ChevronDown" size={14} />
              </Button>

              {/* Expand/Collapse */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpandedQuestion(isExpanded ? null : question?.id)}
                className="h-8 w-8"
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
            {/* Basic Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tipo de Pregunta
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={question?.type}
                  onChange={(e) => {
                    onUpdateQuestion(question?.id, 'type', e?.target?.value);
                    // Reset options if changing from/to choice types
                    if (e?.target?.value !== 'single_choice' && e?.target?.value !== 'multiple_choice') {
                      onUpdateQuestion(question?.id, 'options', []);
                    } else if (!question?.options || question?.options?.length === 0) {
                      onUpdateQuestion(question?.id, 'options', ['', '']);
                    }
                  }}
                >
                  {questionTypes?.map((type) => (
                    <option key={type?.value} value={type?.value}>
                      {type?.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={question?.required}
                    onChange={(e) => onUpdateQuestion(question?.id, 'required', e?.target?.checked)}
                    className="h-4 w-4 rounded border border-input"
                  />
                  <span className="text-sm font-medium text-foreground">
                    Campo obligatorio
                  </span>
                </label>
              </div>
            </div>

            {/* Question Details */}
            <div className="space-y-4">
              <Input
                label="Título de la Pregunta"
                placeholder="Escribe tu pregunta aquí..."
                value={question?.title}
                onChange={(e) => onUpdateQuestion(question?.id, 'title', e?.target?.value)}
                required
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Descripción (Opcional)
                </label>
                <textarea
                  placeholder="Agrega una descripción o instrucciones adicionales..."
                  value={question?.description}
                  onChange={(e) => onUpdateQuestion(question?.id, 'description', e?.target?.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>

            {/* Options for Choice Questions */}
            {(question?.type === 'single_choice' || question?.type === 'multiple_choice') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Opciones de Respuesta
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(question?.id)}
                    iconName="Plus"
                    iconPosition="left"
                  >
                    Agregar Opción
                  </Button>
                </div>

                <div className="space-y-2">
                  {(question?.options || [])?.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="flex items-center">
                          {question?.type === 'single_choice' ? (
                            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground"></div>
                          ) : (
                            <div className="w-4 h-4 rounded border-2 border-muted-foreground"></div>
                          )}
                        </div>
                        <Input
                          placeholder={`Opción ${optionIndex + 1}`}
                          value={option}
                          onChange={(e) => updateOption(question?.id, optionIndex, e?.target?.value)}
                        />
                      </div>
                      
                      {(question?.options || [])?.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(question?.id, optionIndex)}
                          className="h-10 w-10 text-red-600 hover:text-red-700"
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
                      {question?.title || 'Título de la pregunta'}
                      {question?.required && <span className="text-red-600 ml-1">*</span>}
                    </label>
                    {question?.description && (
                      <p className="text-sm text-muted-foreground">
                        {question?.description}
                      </p>
                    )}
                  </div>

                  {/* Preview Input */}
                  {question?.type === 'text' && (
                    <input
                      type="text"
                      placeholder="Respuesta de texto"
                      className="w-full px-3 py-2 border border-input rounded-md bg-white"
                      disabled
                    />
                  )}
                  
                  {question?.type === 'number' && (
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-3 py-2 border border-input rounded-md bg-white"
                      disabled
                    />
                  )}
                  
                  {question?.type === 'date' && (
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-input rounded-md bg-white"
                      disabled
                    />
                  )}
                  
                  {question?.type === 'time' && (
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-input rounded-md bg-white"
                      disabled
                    />
                  )}
                  
                  {question?.type === 'single_choice' && (
                    <select
                      className="w-full px-3 py-2 border border-input rounded-md bg-white"
                      disabled
                    >
                      <option>Selecciona una opción</option>
                      {(question?.options || [])?.map((option, idx) => (
                        <option key={idx} value={option}>
                          {option || `Opción ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {question?.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {(question?.options || [])?.map((option, idx) => (
                        <label key={idx} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-2 border-input"
                            disabled
                          />
                          <span className="text-sm">
                            {option || `Opción ${idx + 1}`}
                          </span>
                        </label>
                      ))}
                    </div>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name="HelpCircle" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Constructor de Preguntas
            </h3>
            <p className="text-sm text-muted-foreground">
              Agrega y configura las preguntas de tu formulario
            </p>
          </div>
        </div>

        <Button
          onClick={onAddQuestion}
          iconName="Plus"
          iconPosition="left"
        >
          Agregar Pregunta
        </Button>
      </div>
      {/* Questions List */}
      {questions?.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="HelpCircle" size={24} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No hay preguntas aún
          </h3>
          <p className="text-muted-foreground mb-4">
            Comienza agregando tu primera pregunta al formulario
          </p>
          <Button
            onClick={onAddQuestion}
            iconName="Plus"
            iconPosition="left"
          >
            Agregar Primera Pregunta
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions?.map((question, index) => (
            <QuestionCard
              key={question?.id}
              question={question}
              index={index}
            />
          ))}
        </div>
      )}
      {/* Quick Add Section */}
      {questions?.length > 0 && (
        <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 text-center">
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