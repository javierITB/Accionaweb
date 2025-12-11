// react_app/src/pages/anuncios/components/ProgramacionSelector.jsx
import React from 'react';

const ProgramacionSelector = ({ formData, setFormData }) => {
  const handleTipoChange = (tipo) => {
    setFormData({
      ...formData,
      programacion: {
        ...formData.programacion,
        tipo
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Programación del envío</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => handleTipoChange('inmediato')}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              formData.programacion.tipo === 'inmediato'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold">Enviar inmediatamente</h4>
                <p className="text-sm text-gray-500 mt-1">
                  El anuncio se enviará tan pronto como lo guardes
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTipoChange('programado')}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              formData.programacion.tipo === 'programado'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold">Programar envío</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Programa el envío para una fecha y hora específica
                </p>
              </div>
            </div>
          </button>
        </div>

        {formData.programacion.tipo === 'programado' && (
          <div className="mt-6 bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Configurar fecha y hora</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de envío
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.programacion.fecha || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    programacion: {
                      ...formData.programacion,
                      fecha: e.target.value
                    }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de envío
                </label>
                <input
                  type="time"
                  value={formData.programacion.hora || '09:00'}
                  onChange={(e) => setFormData({
                    ...formData,
                    programacion: {
                      ...formData.programacion,
                      hora: e.target.value
                    }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-blue-700">
                  El anuncio se enviará automáticamente en la fecha y hora programadas.
                  Puedes cancelar el envío antes de esa hora.
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Consideraciones importantes</h4>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                <li>Los anuncios programados pueden cancelarse antes de su envío</li>
                <li>Se recomienda evitar horarios nocturnos (21:00 - 07:00)</li>
                <li>El tiempo de envío puede variar según la cantidad de destinatarios</li>
                <li>Los usuarios recibirán la notificación en su bandeja de entrada</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramacionSelector;