import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import QuestionEditor from './QuestionEditor';

const QuestionBuilder = ({
  questions,
  questionTypes,
  onUpdateQuestion,
  onDeleteQuestion,
  onMoveQuestion,
  onAddQuestion,
  primaryColor
}) => {
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [expandedSubsections, setExpandedSubsections] = useState({});

  const QuestionCard = ({ question, index, depth = 0, parentPath = '', onUpdateSubquestion, onDeleteSubquestion, onMoveSubquestion }) => {
    const questionPath = parentPath ? `${parentPath}.sub.${question.id}` : question.id;
    const [localQuestion, setLocalQuestion] = useState({ ...question });
    const [localOptions, setLocalOptions] = useState([...question?.options || []]);
    const isExpanded = expandedQuestions[questionPath];

    useEffect(() => {
      setLocalQuestion({ ...question });
      setLocalOptions([...question?.options || []]);
    }, [question]);

    const handleTitleChange = (value) => {
      if (value.length <= 50) {
        setLocalQuestion(prev => ({ ...prev, title: value }));
      }
    };

    const saveChanges = () => {
      const updateFunction = depth > 0 ? onUpdateSubquestion : onUpdateQuestion;
      updateFunction(localQuestion.id, {
        ...localQuestion,
        options: localOptions
      });
    };

    const handleFieldChange = (field, value) => {
      setLocalQuestion(prev => ({ ...prev, [field]: value }));
    };

    const handleOptionChange = (index, value) => {
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
    };

    const addOption = () => {
      const newOption = {
        id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: '',
        hasSubform: false
      };
      const newOptions = [...localOptions, newOption];
      setLocalOptions(newOptions);
      const updateFunction = depth > 0 ? onUpdateSubquestion : onUpdateQuestion;
      updateFunction(localQuestion.id, {
        ...localQuestion,
        options: newOptions
      });
    };

    const removeOption = (index) => {
      const newOptions = localOptions.filter((_, i) => i !== index);
      setLocalOptions(newOptions);
      const updateFunction = depth > 0 ? onUpdateSubquestion : onUpdateQuestion;
      updateFunction(localQuestion.id, {
        ...localQuestion,
        options: newOptions
      });
    };

    const handleTypeChange = (newType) => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

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
      const updateFunction = depth > 0 ? onUpdateSubquestion : onUpdateQuestion;
      updateFunction(localQuestion.id, {
        ...updatedQuestion,
        options: updatedOptions
      });

      requestAnimationFrame(() => {
        window.scrollTo(0, currentScroll);
      });
    };

    const handleRequiredChange = (checked) => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

      const updatedQuestion = { ...localQuestion, required: checked };
      setLocalQuestion(updatedQuestion);
      const updateFunction = depth > 0 ? onUpdateSubquestion : onUpdateQuestion;
      updateFunction(localQuestion.id, {
        ...updatedQuestion,
        options: localOptions
      });

      requestAnimationFrame(() => {
        window.scrollTo(0, currentScroll);
      });
    };

    const handleToggleSubform = (optionIndex, hasSubform) => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

      const newOptions = [...localOptions];
      const option = newOptions[optionIndex];

      if (typeof option === 'string') {
        newOptions[optionIndex] = {
          id: `opt-${optionIndex}-${Date.now()}`,
          text: option,
          hasSubform,
          subformQuestions: hasSubform ? [] : undefined
        };
      } else {
        newOptions[optionIndex] = {
          ...option,
          hasSubform,
          subformQuestions: hasSubform ? (option.subformQuestions || []) : undefined
        };
      }

      setLocalOptions(newOptions);
      const updateFunction = depth > 0 ? onUpdateSubquestion : onUpdateQuestion;
      updateFunction(localQuestion.id, {
        ...localQuestion,
        options: newOptions
      });

      if (hasSubform) {
        setExpandedSubsections(prev => ({
          ...prev,
          [`${questionPath}-${optionIndex}`]: true
        }));
      }

      requestAnimationFrame(() => {
        window.scrollTo(0, currentScroll);
      });
    };

    const handleAddSubformQuestion = (optionIndex) => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

      const newOptions = [...localOptions];
      const option = newOptions[optionIndex];

      if (option && typeof option === 'object') {
        const newQuestion = {
          id: `subq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'text',
          title: '',
          description: '',
          required: false,
          options: []
        };

        const updatedSubformQuestions = [...(option.subformQuestions || []), newQuestion];

        newOptions[optionIndex] = {
          ...option,
          subformQuestions: updatedSubformQuestions
        };

        setLocalOptions(newOptions);
        const updateFunction = depth > 0 ? onUpdateSubquestion : onUpdateQuestion;
        updateFunction(localQuestion.id, {
          ...localQuestion,
          options: newOptions
        });

        const newQuestionPath = `${questionPath}.sub.${newQuestion.id}`;
        setExpandedQuestions(prev => ({
          ...prev,
          [newQuestionPath]: true
        }));

        requestAnimationFrame(() => {
          window.scrollTo(0, currentScroll);
        });
      }
    };

    const handleUpdateSubformQuestion = (optionIndex, questionId, updates) => {
      const newOptions = [...localOptions];
      const option = newOptions[optionIndex];

      if (option && option.subformQuestions) {
        const updatedSubformQuestions = option.subformQuestions.map(q =>
          q.id === questionId ? { ...q, ...updates } : q
        );

        newOptions[optionIndex] = {
          ...option,
          subformQuestions: updatedSubformQuestions
        };

        setLocalOptions(newOptions);
        const updateFunction = depth > 0 ? onUpdateSubquestion : onUpdateQuestion;
        updateFunction(localQuestion.id, {
          ...localQuestion,
          options: newOptions
        });
      }
    };

    const handleDeleteSubformQuestion = (optionIndex, questionId) => {
      const newOptions = [...localOptions];
      const option = newOptions[optionIndex];

      if (option && option.subformQuestions) {
        const updatedSubformQuestions = option.subformQuestions.filter(q => q.id !== questionId);

        newOptions[optionIndex] = {
          ...option,
          subformQuestions: updatedSubformQuestions
        };

        setLocalOptions(newOptions);
        const updateFunction = depth > 0 ? onUpdateSubquestion : onUpdateQuestion;
        updateFunction(localQuestion.id, {
          ...localQuestion,
          options: newOptions
        });
      }
    };

    const handleMoveSubformQuestion = (optionIndex, questionId, direction) => {
      const newOptions = [...localOptions];
      const option = newOptions[optionIndex];

      if (option && option.subformQuestions) {
        const currentIndex = option.subformQuestions.findIndex(q => q.id === questionId);
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (newIndex < 0 || newIndex >= option.subformQuestions.length) return;

        const newSubformQuestions = [...option.subformQuestions];
        [newSubformQuestions[currentIndex], newSubformQuestions[newIndex]] =
          [newSubformQuestions[newIndex], newSubformQuestions[currentIndex]];

        newOptions[optionIndex] = {
          ...option,
          subformQuestions: newSubformQuestions
        };

        setLocalOptions(newOptions);
        const updateFunction = depth > 0 ? onUpdateSubquestion : onUpdateQuestion;
        updateFunction(localQuestion.id, {
          ...localQuestion,
          options: newOptions
        });
      }
    };

    const toggleSubsection = (optionIndex) => {
      setExpandedSubsections(prev => ({
        ...prev,
        [`${questionPath}-${optionIndex}`]: !prev[`${questionPath}-${optionIndex}`]
      }));
    };

    const toggleQuestionExpansion = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

      setExpandedQuestions(prev => {
        const newState = {
          ...prev,
          [questionPath]: !prev[questionPath]
        };

        requestAnimationFrame(() => {
          window.scrollTo(0, currentScroll);
        });

        return newState;
      });
    };

    const getOptionText = (option) => {
      return typeof option === 'string' ? option : option.text;
    };

    const getOptionHasSubform = (option) => {
      return typeof option === 'object' ? option.hasSubform : false;
    };

    const renderOptionsWithSubsections = () => {
      return (
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

          <div className="space-y-3">
            {localOptions.map((option, optionIndex) => {
              const subsectionKey = `${questionPath}-${optionIndex}`;
              const isSubsectionExpanded = expandedSubsections[subsectionKey];

              return (
                <div key={typeof option === 'object' ? option.id : `option-${optionIndex}`} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="flex items-center">
                        {localQuestion.type === 'single_choice' ? (
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground"></div>
                        ) : (
                          <div className="w-4 h-4 rounded border-2 border-muted-foreground"></div>
                        )}
                      </div>
                      <Input
                        placeholder={`Opción ${optionIndex + 1}`}
                        value={getOptionText(option)}
                        onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                        onBlur={saveChanges}
                      />

                      <label className="flex items-center space-x-2 text-sm text-blue-600 cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={getOptionHasSubform(option)}
                          onChange={(e) => handleToggleSubform(optionIndex, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Subsección</span>
                      </label>
                    </div>

                    {localOptions.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(optionIndex)}
                        className="h-10 w-10 text-red-600 hover:text-red-700"
                      >
                        <Icon name="X" size={14} />
                      </Button>
                    )}
                  </div>

                  {getOptionHasSubform(option) && (
                    <div className="ml-6 border-l-2 border-blue-200 dark:border-blue-500/30 pl-4 bg-blue-50 dark:bg-blue-500/10 rounded">
                      <div className="flex items-center justify-between p-3">
                        <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Subsección para "{getOptionText(option)}"
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSubsection(optionIndex)}
                          className="h-8 w-8"
                        >
                          <Icon name={isSubsectionExpanded ? "ChevronUp" : "ChevronDown"} size={14} />
                        </Button>
                      </div>

                      {isSubsectionExpanded && option.subformQuestions && (
                        <div className="p-3 border-t border-blue-200 dark:border-blue-500/30">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-blue-600 dark:text-blue-400">Subsección - Nivel {depth + 1}</span>
                            <Button
                              onClick={() => {
                                const newQuestion = handleAddSubformQuestion(optionIndex);
                                if (newQuestion && newQuestion.id) {
                                  setExpandedQuestions(prev => ({
                                    ...prev,
                                    [newQuestion.id]: true
                                  }));
                                }
                              }}
                              iconName="Plus"
                              iconPosition="left"
                            >
                              Agregar Pregunta
                            </Button>
                          </div>

                          {option.subformQuestions.map((subQuestion, subIndex) => (
                            <div key={subQuestion.id} className="mb-4">
                              <QuestionCard
                                question={subQuestion}
                                index={subIndex}
                                depth={depth + 1}
                                parentPath={questionPath}
                                onUpdateSubquestion={(questionId, updates) =>
                                  handleUpdateSubformQuestion(optionIndex, questionId, updates)
                                }
                                onDeleteSubquestion={(questionId) =>
                                  handleDeleteSubformQuestion(optionIndex, questionId)
                                }
                                onMoveSubquestion={(questionId, direction) =>
                                  handleMoveSubformQuestion(optionIndex, questionId, direction)
                                }
                              />
                            </div>
                          ))}

                          {option.subformQuestions.length === 0 && (
                            <div className="text-center py-4 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 rounded">
                              No hay preguntas en esta subsección
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    const renderFileConfiguration = () => {
      return (
        <div className="space-y-4 mt-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localQuestion.multiple || false}
              onChange={(e) => handleFieldChange('multiple', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-foreground">
              Permitir múltiples archivos
            </span>
          </div>

          {/* NUEVO CAMPO: Número máximo de archivos */}
          {localQuestion.multiple && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Número máximo de archivos
              </label>
              <input
                type="number"
                min="1"
                max="20"
                step="1"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={localQuestion.maxFiles || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  handleFieldChange('maxFiles', Math.min(Math.max(value, 1), 20));
                }}
                placeholder="4"
                onBlur={saveChanges}
              />
              <p className="text-xs text-muted-foreground">
                Máximo de archivos que el usuario puede subir (1-20)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tipos de archivo permitidos
            </label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={localQuestion.accept || ''}
              onChange={(e) => handleFieldChange('accept', e.target.value)}
              placeholder=".pdf,.doc,.docx,.jpg,.png"
              onBlur={saveChanges}
            />
            <p className="text-xs text-muted-foreground">
              Separar extensiones con comas: .pdf, .doc, .jpg, image/*, application/pdf
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tamaño máximo (MB)
            </label>
            <input
              type="number"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={localQuestion.maxSize || ''}
              onChange={(e) => handleFieldChange('maxSize', e.target.value)}
              placeholder="10"
              onBlur={saveChanges}
            />
          </div>
        </div>
      );
    };

    const questionType = questionTypes.find(type => type.value === localQuestion.type);

    const handleDelete = () => {
      if (window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
        if (depth > 0) {
          onDeleteSubquestion(localQuestion.id);
        } else {
          onDeleteQuestion(localQuestion.id);
        }
      }
    };

    const handleMove = (direction) => {
      if (depth > 0) {
        onMoveSubquestion(localQuestion.id, direction);
      } else {
        onMoveQuestion(localQuestion.id, direction);
      }
    };

    return (
      <div className={`bg-card border border-border rounded-lg ${depth > 0 ? 'ml-6' : ''}`}>
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
                  {depth > 0 && <span className="text-xs text-blue-600 ml-2">Nivel {depth}</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {questionType?.label || 'Tipo no definido'}
                  {localQuestion.title && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({localQuestion.title.length}/50)
                    </span>
                  )}
                </p>
              </div>
              {localQuestion.required && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                  Obligatorio
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {depth === 0 ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMove('up')}
                    disabled={index === 0}
                    className="h-8 w-8"
                  >
                    <Icon name="ChevronUp" size={14} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMove('down')}
                    disabled={index === questions.length - 1}
                    className="h-8 w-8"
                  >
                    <Icon name="ChevronDown" size={14} />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMove('up')}
                    className="h-8 w-8"
                  >
                    <Icon name="ChevronUp" size={14} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMove('down')}
                    className="h-8 w-8"
                  >
                    <Icon name="ChevronDown" size={14} />
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleQuestionExpansion}
                className="h-8 w-8"
              >
                <Icon name={isExpanded ? "Minimize2" : "Maximize2"} size={14} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Icon name="Trash2" size={14} />
              </Button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tipo de Pregunta
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={localQuestion.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  {questionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localQuestion.required || false}
                    onChange={(e) => handleRequiredChange(e.target.checked)}
                    className="h-4 w-4 rounded border border-gray-900 bg-white"
                  />
                  <span className="text-sm font-medium text-foreground">
                    Campo obligatorio
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Título de la Pregunta *
                  <span className="text-xs text-muted-foreground ml-2">
                    ({localQuestion.title?.length || 0}/50 caracteres)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Escribe tu pregunta aquí..."
                  value={localQuestion.title || ''}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onBlur={saveChanges}
                  maxLength={50}
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${(localQuestion.title?.length || 0) >= 50
                    ? 'border-red-500 focus-visible:ring-red-200'
                    : 'border-input focus-visible:ring-blue-200'
                    }`}
                />
                {(localQuestion.title?.length || 0) >= 50 && (
                  <p className="text-red-500 text-xs">
                    Límite de 50 caracteres alcanzado
                  </p>
                )}
              </div>

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

            {(localQuestion.type === 'single_choice' || localQuestion.type === 'multiple_choice') && (
              renderOptionsWithSubsections()
            )}

            {localQuestion.type === 'file' && (
              renderFileConfiguration()
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
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
          onClick={() => {
            const newQuestion = onAddQuestion();
            if (newQuestion && newQuestion.id) {
              setExpandedQuestions(prev => ({
                ...prev,
                [newQuestion.id]: true
              }));
            }
          }}
          iconName="Plus"
          iconPosition="left"
        >
          Agregar Pregunta
        </Button>
      </div>

      {questions.length === 0 ? (
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
            onClick={() => {
              const newQuestion = onAddQuestion();
              if (newQuestion && newQuestion.id) {
                setExpandedQuestions(prev => ({
                  ...prev,
                  [newQuestion.id]: true
                }));
              }
            }}
            iconName="Plus"
            iconPosition="left"
          >
            Agregar Primera Pregunta
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              onUpdateSubquestion={onUpdateQuestion}
              onDeleteSubquestion={onDeleteQuestion}
              onMoveSubquestion={onMoveQuestion}
            />
          ))}
        </div>
      )}

      {questions.length > 0 && (
        <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 text-center">
          <Icon name="Plus" size={24} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground mb-3">
            ¿Listo para la siguiente pregunta?
          </p>
          <Button
            onClick={() => {
              const newQuestion = onAddQuestion();
              if (newQuestion && newQuestion.id) {
                setExpandedQuestions(prev => ({
                  ...prev,
                  [newQuestion.id]: true
                }));
              }
            }}
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