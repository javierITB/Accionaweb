import React from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import QuestionEditor from './QuestionEditor';

const FormCanvas = ({ 
  form, 
  selectedQuestion, 
  onSelectQuestion, 
  onUpdateQuestion, 
  onDeleteQuestion, 
  onMoveQuestion 
}) => {
  if (form?.questions?.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Plus size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Comienza creando tu formulario
          </h3>
          <p className="text-gray-600 mb-4">
            Selecciona un tipo de pregunta del panel izquierdo para empezar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Encabezado del formulario */}
      <div 
        className="mb-8 p-6 rounded-lg border-2 border-dashed border-gray-300"
        style={{ borderColor: form?.primaryColor + '40' }}
      >
        <h1 
          className="text-2xl font-bold mb-2"
          style={{ color: form?.primaryColor }}
        >
          {form?.title}
        </h1>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          {form?.category && (
            <span className="px-2 py-1 bg-gray-100 rounded">
              Categoría: {form?.category}
            </span>
          )}
          {form?.estimatedTime && (
            <span className="px-2 py-1 bg-gray-100 rounded">
              Tiempo estimado: {form?.estimatedTime} min
            </span>
          )}
          {form?.author && (
            <span className="px-2 py-1 bg-gray-100 rounded">
              Autor: {form?.author}
            </span>
          )}
        </div>
      </div>
      {/* Lista de preguntas */}
      <div className="space-y-4">
        {form?.questions?.map((question, index) => (
          <div
            key={question?.id}
            className={`border rounded-lg p-4 transition-all ${
              selectedQuestion === question?.id
                ? 'border-blue-500 bg-blue-50' :'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => onSelectQuestion(question?.id)}
          >
            {/* Barra de herramientas de la pregunta */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <GripVertical size={16} className="text-gray-400 cursor-move" />
                <span className="text-sm font-medium text-gray-600">
                  Pregunta {index + 1}
                </span>
                {question?.required && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                    Obligatoria
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e?.stopPropagation();
                    onMoveQuestion(question?.id, 'up');
                  }}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title = "Mover arriba"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e?.stopPropagation();
                    onMoveQuestion(question?.id, 'down');
                  }}
                  disabled={index === form?.questions?.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title = "Mover abajo"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e?.stopPropagation();
                    onDeleteQuestion(question?.id);
                  }}
                  className="p-1 text-red-400 hover:text-red-600"
                  title = "Eliminar pregunta"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Editor de pregunta */}
            <QuestionEditor
              question={question}
              isSelected={selectedQuestion === question?.id}
              onUpdate={onUpdateQuestion}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormCanvas;