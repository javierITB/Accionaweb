import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import DestinatariosSelector from './DestinatariosSelector';

const AnuncioCreator = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    destinatarios: {
      tipo: 'todos',
      filtro: { empresas: [], cargos: [], roles: [] },
      usuariosManuales: []
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('https://back-acciona.vercel.app/api/anuncios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ ${result.message}`);
        onSuccess();
      } else {
        throw new Error(result.error || 'Error al enviar');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Mensaje', description: 'Escribe el anuncio' },
    { id: 2, title: 'Destinatarios', description: 'Selecciona quiénes lo recibirán' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Nuevo Anuncio</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              ✕
            </button>
          </div>
          
          <div className="flex justify-center space-x-8">
            {steps.map(s => (
              <div key={s.id} className="text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  step >= s.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {s.id}
                </div>
                <div className="text-sm font-medium">{s.title}</div>
                <div className="text-xs text-gray-500">{s.description}</div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título *</label>
                <Input
                  value={formData.titulo}
                  onChange={e => setFormData({...formData, titulo: e.target.value})}
                  placeholder="Asunto del anuncio"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Mensaje *</label>
                <textarea
                  value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contenido del anuncio..."
                  required
                />
              </div>
              
              <Button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Continuar a Destinatarios
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <DestinatariosSelector
                formData={formData}
                setFormData={setFormData}
              />
              
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1"
                >
                  ← Atrás
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Enviar Anuncio
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AnuncioCreator;