import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import DestinatariosSelector from './DestinatariosSelector';

const AnuncioCreator = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 1,
    color: '#f5872dff',
    actionUrl: '',
    destinatarios: {
      tipo: 'todos',
      filtro: { empresas: [], cargos: [], roles: [] },
      usuariosManuales: []
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.destinatarios.tipo === 'manual' && formData.destinatarios.usuariosManuales.length === 0) {
      alert('Por favor, selecciona al menos un destinatario');
      return;
    }
    
    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      
      // 🔥 PAYLOAD SIMPLE - SOLO DATOS PARA NOTIFICACIONES
      const payload = {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        prioridad: formData.prioridad,
        color: formData.color,
        actionUrl: formData.actionUrl?.trim() || null,
        destinatarios: formData.destinatarios
        // NO enviar enviarNotificacion ni enviarCorreo
      };

      console.log('📤 Enviando anuncio (solo notificaciones):', payload);

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
        alert(`${result.message}`);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(result.error || 'Error al enviar anuncio');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Crear Anuncio</h2>
            <p className="text-gray-600">Configura el contenido y destinatarios</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-8">
          {/* Sección de Contenido */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium border-b pb-2">Contenido del Anuncio</h3>
            
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <label className="block text-sm font-medium mb-2">Color de notificación</label>
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
          </div>

          {/* Sección de Destinatarios */}
          <div className="space-y-6 pt-6 border-t">
            <h3 className="text-lg font-medium">Destinatarios</h3>
            
            <DestinatariosSelector
              formData={formData}
              setFormData={setFormData}
            />
          </div>

          {/* 🔥 NO HAY SECCIÓN DE MÉTODO DE ENVÍO (sin checkboxes) */}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              onClick={() => window.history.back()}
              variant="outline"
              className="px-6"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="px-6 bg-blue-600 hover:bg-blue-700"
            >
              Enviar Anuncio
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AnuncioCreator;