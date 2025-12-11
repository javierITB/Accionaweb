import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import DestinatariosSelector from './DestinatariosSelector';

const AnuncioCreator = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 1,
    color: '#f5872dff',
    icono: 'paper',
    actionUrl: '',
    destinatarios: {
      tipo: 'todos',
      filtro: { empresas: [], cargos: [], roles: [] },
      usuariosManuales: []
    }
  });

  // Cargar datos al iniciar
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      // Cargar usuarios
      const usersRes = await fetch('https://back-acciona.vercel.app/api/auth/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const users = await usersRes.json();
      setUsuarios(Array.isArray(users) ? users : []);
      
      // Cargar empresas
      const empresasRes = await fetch('https://back-acciona.vercel.app/api/auth/empresas/todas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const empresasData = await empresasRes.json();
      setEmpresas(Array.isArray(empresasData) ? empresasData : []);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (formData.destinatarios.tipo === 'manual' && formData.destinatarios.usuariosManuales.length === 0) {
      alert('Por favor, selecciona al menos un destinatario');
      return;
    }
    
    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      
      const payload = {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        prioridad: formData.prioridad,
        color: formData.color,
        icono: formData.icono,
        actionUrl: formData.actionUrl?.trim() || null,
        destinatarios: formData.destinatarios
      };

      console.log('Enviando anuncio:', payload);

      const response = await fetch('https://back-acciona.vercel.app/api/anuncios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ ${result.message}`);
        onSuccess();
      } else {
        throw new Error(result.error || 'Error al enviar anuncio');
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Nuevo Anuncio</h2>
              <p className="text-gray-600">Enviar notificación a usuarios</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              ✕
            </button>
          </div>
          
          {/* Stepper */}
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                1
              </div>
              <div className="text-sm font-medium">Contenido</div>
            </div>
            
            <div className="text-center">
              <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                2
              </div>
              <div className="text-sm font-medium">Destinatarios</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Título *</label>
                <Input
                  value={formData.titulo}
                  onChange={e => setFormData({...formData, titulo: e.target.value})}
                  placeholder="Asunto de la notificación"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Mensaje *</label>
                <textarea
                  value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe el anuncio en detalle..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prioridad</label>
                  <select
                    value={formData.prioridad}
                    onChange={e => setFormData({...formData, prioridad: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="1">Normal</option>
                    <option value="2">Media</option>
                    <option value="3">Alta</option>
                    <option value="4">Urgente</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Icono</label>
                  <select
                    value={formData.icono}
                    onChange={e => setFormData({...formData, icono: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="paper">📄 Documento</option>
                    <option value="alert">⚠️ Alerta</option>
                    <option value="info">ℹ️ Información</option>
                    <option value="announcement">📢 Anuncio</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">URL de acción (opcional)</label>
                <Input
                  value={formData.actionUrl}
                  onChange={e => setFormData({...formData, actionUrl: e.target.value})}
                  placeholder="/ruta/destino"
                />
                <p className="text-sm text-gray-500 mt-1">Los usuarios serán redirigidos aquí al hacer clic</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex gap-2">
                  {['#f5872dff', '#45577eff', '#bb8900ff', '#dc2626ff', '#059669ff', '#7c3aedff'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({...formData, color})}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-800' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              <Button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Continuar a Destinatarios →
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <DestinatariosSelector
                formData={formData}
                setFormData={setFormData}
                usuarios={usuarios}
                empresas={empresas}
              />
              
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1"
                >
                  ← Volver al Contenido
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