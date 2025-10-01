import React from 'react';
import { Palette, Settings } from 'lucide-react';

const FormPropertiesPanel = ({ 
  form, 
  selectedQuestion, 
  onUpdateForm, 
  onUpdateQuestion 
}) => {
  const question = form?.questions?.find(q => q?.id === selectedQuestion);

  return (
    <div className="h-full flex flex-col">
      {/* Encabezado */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Settings size={18} />
          <span>Propiedades</span>
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Propiedades del formulario */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Información del Formulario
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                value={form?.title}
                onChange={(e) => onUpdateForm({ title: e?.target?.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={form?.category}
                onChange={(e) => onUpdateForm({ category: e?.target?.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="general">General</option>
                <option value="encuesta">Encuesta</option>
                <option value="evaluacion">Evaluación</option>
                <option value="registro">Registro</option>
                <option value="feedback">Feedback</option>
                <option value="solicitud">Solicitud</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo estimado (minutos)
              </label>
              <input
                type="number"
                value={form?.estimatedTime}
                onChange={(e) => onUpdateForm({ estimatedTime: e?.target?.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="120"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Autor
              </label>
              <input
                type="text"
                value={form?.author}
                onChange={(e) => onUpdateForm({ author: e?.target?.value })}
                placeholder="Nombre del autor"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Personalización visual */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <Palette size={16} />
            <span>Personalización Visual</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color Primario
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={form?.primaryColor}
                  onChange={(e) => onUpdateForm({ primaryColor: e?.target?.value })}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={form?.primaryColor}
                  onChange={(e) => onUpdateForm({ primaryColor: e?.target?.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color Secundario
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={form?.secondaryColor}
                  onChange={(e) => onUpdateForm({ secondaryColor: e?.target?.value })}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={form?.secondaryColor}
                  onChange={(e) => onUpdateForm({ secondaryColor: e?.target?.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Propiedades de la pregunta seleccionada */}
        {selectedQuestion && question && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Propiedades de la Pregunta
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de pregunta
                </label>
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                  {question?.type === 'text' && 'Texto'}
                  {question?.type === 'multiple-choice' && 'Selección Múltiple'}
                  {question?.type === 'single-choice' && 'Selección Única'}
                  {question?.type === 'dropdown' && 'Menú Desplegable'}
                  {question?.type === 'number' && 'Número'}
                  {question?.type === 'date' && 'Fecha'}
                  {question?.type === 'time' && 'Hora'}
                </span>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={question?.required}
                  onChange={(e) => onUpdateQuestion(question?.id, { required: e?.target?.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Campo obligatorio
                </label>
              </div>

              {(question?.type === 'text' || question?.type === 'number') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto de ayuda
                  </label>
                  <input
                    type="text"
                    value={question?.placeholder || ''}
                    onChange={(e) => onUpdateQuestion(question?.id, { placeholder: e?.target?.value })}
                    placeholder="Ej: Escriba su respuesta aquí"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {question?.type === 'number' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mínimo
                    </label>
                    <input
                      type="number"
                      value={question?.validation?.min || ''}
                      onChange={(e) => onUpdateQuestion(question?.id, {
                        validation: { ...question?.validation, min: e?.target?.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Máximo
                    </label>
                    <input
                      type="number"
                      value={question?.validation?.max || ''}
                      onChange={(e) => onUpdateQuestion(question?.id, {
                        validation: { ...question?.validation, max: e?.target?.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormPropertiesPanel;