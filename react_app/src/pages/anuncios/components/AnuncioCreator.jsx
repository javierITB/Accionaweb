import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import DestinatariosSelector from './DestinatariosSelector';
import ProgramacionSelector from './ProgramacionSelector';

// REEMPLAZO DE LA IMPORTACIÓN FALLIDA - Usamos fetch directo como en tu login
const AnuncioCreator = ({ anuncio, onClose, onSuccess }) => {
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
    estado: 'borrador',
    destinatarios: {
      tipo: 'todos',
      filtro: {
        empresas: [],
        cargos: [],
        roles: []
      },
      usuariosManuales: []
    },
    programacion: {
      tipo: 'inmediato',
      fecha: null,
      hora: null
    }
  });

  useEffect(() => {
    if (anuncio) {
      setFormData({
        ...anuncio,
        destinatarios: anuncio.destinatarios || {
          tipo: 'todos',
          filtro: { empresas: [], cargos: [], roles: [] },
          usuariosManuales: []
        },
        programacion: anuncio.programacion || {
          tipo: 'inmediato',
          fecha: null,
          hora: null
        }
      });
    }
    fetchUsuarios();
    fetchEmpresas();
  }, [anuncio]);

  // FUNCIÓN DE FETCH como en tu Sidebar.jsx
  const fetchUsuarios = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const email = sessionStorage.getItem('email');
      const cargo = sessionStorage.getItem('cargo');
      
      const response = await fetch('https://back-acciona.vercel.app/api/usuarios/list', {
        method: 'POST', // o GET según tu backend
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mail: email,
          token: token,
          cargo: cargo
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      const data = await response.json();
      setUsuarios(data.data || data || []);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    }
  };

  const fetchEmpresas = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      const response = await fetch('https://back-acciona.vercel.app/api/empresas', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      const data = await response.json();
      setEmpresas(data.data || data || []);
    } catch (error) {
      console.error('Error fetching empresas:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      const email = sessionStorage.getItem('email');
      const cargo = sessionStorage.getItem('cargo');
      
      const url = anuncio 
        ? `https://back-acciona.vercel.app/api/anuncios/${anuncio._id}`
        : 'https://back-acciona.vercel.app/api/anuncios';
      
      const method = anuncio ? 'PUT' : 'POST';
      
      // Prepara los datos como lo haces en Sidebar.jsx
      const payload = {
        ...formData,
        mail: email,
        token: token,
        cargo: cargo,
        enviarAhora: step === 3 && formData.programacion.tipo === 'inmediato'
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        onSuccess();
        alert(anuncio ? 'Anuncio actualizado' : 'Anuncio creado exitosamente');
      } else {
        alert(result.message || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving anuncio:', error);
      alert('Error al guardar el anuncio: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Contenido', description: 'Define el mensaje' },
    { id: 2, title: 'Destinatarios', description: 'Selecciona quién lo recibirá' },
    { id: 3, title: 'Programación', description: 'Cuándo se enviará' },
    { id: 4, title: 'Confirmación', description: 'Revisa y envía' }
  ];

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <ContenidoStep formData={formData} setFormData={setFormData} />;
      case 2:
        return (
          <DestinatariosSelector
            formData={formData}
            setFormData={setFormData}
            usuarios={usuarios}
            empresas={empresas}
          />
        );
      case 3:
        return <ProgramacionSelector formData={formData} setFormData={setFormData} />;
      case 4:
        return <ConfirmacionStep formData={formData} usuarios={usuarios} empresas={empresas} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {anuncio ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}
              </h2>
              <p className="text-gray-600">Comunícate con usuarios mediante notificaciones</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stepper */}
          <div className="mt-6">
            <div className="flex justify-between">
              {steps.map((s, index) => (
                <div key={s.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= s.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step > s.id ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.id
                    )}
                  </div>
                  <div className="ml-3">
                    <div className={`text-sm font-medium ${
                      step >= s.id ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {s.title}
                    </div>
                    <div className="text-xs text-gray-500">{s.description}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`ml-8 w-16 h-0.5 ${
                      step > s.id ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[60vh]">
          {renderStepContent()}
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <div>
              {step > 1 && (
                <Button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  variant="outline"
                >
                  Atrás
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
              >
                Cancelar
              </Button>
              
              {step < 4 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continuar
                </Button>
              ) : (
                <Button
                  type="submit"
                  loading={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {formData.programacion.tipo === 'inmediato' ? 'Enviar Ahora' : 'Programar'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContenidoStep = ({ formData, setFormData }) => {
  const iconos = [
    { value: 'paper', label: '📄 Documento', desc: 'Información general' },
    { value: 'alert', label: '⚠️ Alerta', desc: 'Importante o urgente' },
    { value: 'info', label: 'ℹ️ Información', desc: 'Noticias o actualizaciones' },
    { value: 'announcement', label: '📢 Anuncio', desc: 'Comunicados oficiales' },
    { value: 'check', label: '✅ Confirmación', desc: 'Aprobaciones o confirmaciones' },
    { value: 'warning', label: '🚨 Advertencia', desc: 'Atención requerida' }
  ];

  const colores = [
    { value: '#f5872dff', label: 'Naranja', bg: 'bg-orange-500' },
    { value: '#45577eff', label: 'Azul', bg: 'bg-blue-500' },
    { value: '#bb8900ff', label: 'Ámbar', bg: 'bg-amber-500' },
    { value: '#dc2626ff', label: 'Rojo', bg: 'bg-red-500' },
    { value: '#059669ff', label: 'Verde', bg: 'bg-green-500' },
    { value: '#7c3aedff', label: 'Púrpura', bg: 'bg-purple-500' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título del anuncio *
        </label>
        <Input
          value={formData.titulo}
          onChange={(e) => setFormData({...formData, titulo: e.target.value})}
          placeholder="Ej: Nueva actualización del sistema"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción detallada *
        </label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe el anuncio en detalle..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL de acción (opcional)
        </label>
        <Input
          value={formData.actionUrl}
          onChange={(e) => setFormData({...formData, actionUrl: e.target.value})}
          placeholder="/ruta/de/destino"
        />
        <p className="mt-1 text-sm text-gray-500">
          Los usuarios serán redirigidos aquí al hacer clic en la notificación
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Icono
          </label>
          <Select
            value={formData.icono}
            onChange={(e) => setFormData({...formData, icono: e.target.value})}
            options={iconos.map(icon => ({
              value: icon.value,
              label: (
                <div className="flex items-center">
                  <span className="mr-2 text-lg">{icon.label.split(' ')[0]}</span>
                  <span>{icon.label.split(' ').slice(1).join(' ')}</span>
                </div>
              )
            }))}
          />
          <p className="mt-1 text-sm text-gray-500">
            {iconos.find(i => i.value === formData.icono)?.desc}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="flex gap-2">
            {colores.map(color => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData({...formData, color: color.value})}
                className={`w-10 h-10 rounded-full border-2 ${
                  formData.color === color.value ? 'border-gray-900' : 'border-transparent'
                } ${color.bg}`}
                title={color.label}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prioridad
          </label>
          <Select
            value={formData.prioridad}
            onChange={(e) => setFormData({...formData, prioridad: parseInt(e.target.value)})}
            options={[
              { value: 1, label: 'Normal' },
              { value: 2, label: 'Media' },
              { value: 3, label: 'Alta' },
              { value: 4, label: 'Urgente' }
            ]}
          />
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full`}
                  style={{ backgroundColor: `${formData.color}20` }}>
              <span className="text-lg" style={{ color: formData.color }}>
                {iconos.find(i => i.value === formData.icono)?.label.split(' ')[0] || '📄'}
              </span>
            </span>
          </div>
          <div className="ml-3">
            <h4 className="font-semibold text-gray-900">Vista previa</h4>
            <div className="mt-2 p-3 bg-white rounded border">
              <div className="font-medium" style={{ color: formData.color }}>
                {formData.titulo || '[Título del anuncio]'}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {formData.descripcion || '[Descripción del anuncio]'}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Notificación · Prioridad {formData.prioridad}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfirmacionStep = ({ formData, usuarios, empresas }) => {
  const countDestinatarios = () => {
    if (formData.destinatarios.tipo === 'todos') {
      return usuarios.length;
    } else if (formData.destinatarios.tipo === 'manual') {
      return formData.destinatarios.usuariosManuales.length;
    } else {
      // Para filtro, necesitarías calcular en backend
      return 'Calculando...';
    }
  };

  const getDestinatariosDesc = () => {
    switch (formData.destinatarios.tipo) {
      case 'todos':
        return 'Todos los usuarios del sistema';
      case 'filtro':
        const filters = [];
        if (formData.destinatarios.filtro.empresas.length > 0) {
          filters.push(`${formData.destinatarios.filtro.empresas.length} empresa(s)`);
        }
        if (formData.destinatarios.filtro.cargos.length > 0) {
          filters.push(`${formData.destinatarios.filtro.cargos.length} cargo(s)`);
        }
        if (formData.destinatarios.filtro.roles.length > 0) {
          filters.push(`${formData.destinatarios.filtro.roles.length} rol(es)`);
        }
        return `Usuarios por filtro: ${filters.join(', ')}`;
      case 'manual':
        return `${formData.destinatarios.usuariosManuales.length} usuario(s) seleccionado(s) manualmente`;
      default:
        return 'No especificado';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Resumen del anuncio</h3>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full`}
                    style={{ backgroundColor: `${formData.color}20` }}>
                <span className="text-xl" style={{ color: formData.color }}>
                  {formData.icono === 'paper' ? '📄' : 
                   formData.icono === 'alert' ? '⚠️' : 
                   formData.icono === 'info' ? 'ℹ️' : '📢'}
                </span>
              </span>
            </div>
            <div className="ml-4">
              <h4 className="font-bold text-gray-900">{formData.titulo}</h4>
              <p className="text-gray-600 mt-1">{formData.descripcion}</p>
              {formData.actionUrl && (
                <p className="text-sm text-blue-600 mt-2">
                  🔗 Redirige a: {formData.actionUrl}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-sm text-gray-500">Prioridad</div>
              <div className="font-medium">
                {formData.prioridad === 1 ? 'Normal' :
                 formData.prioridad === 2 ? 'Media' :
                 formData.prioridad === 3 ? 'Alta' : 'Urgente'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Estado inicial</div>
              <div className="font-medium">
                {formData.programacion.tipo === 'inmediato' ? 'Enviar ahora' : 'Programado'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Destinatarios</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Tipo de envío:</span>
            <span className="font-medium capitalize">{formData.destinatarios.tipo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total de destinatarios:</span>
            <span className="font-medium">{countDestinatarios()}</span>
          </div>
          <div>
            <span className="text-gray-600">Descripción:</span>
            <p className="mt-1 text-sm text-gray-700">{getDestinatariosDesc()}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Programación</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Tipo:</span>
            <span className="font-medium capitalize">{formData.programacion.tipo}</span>
          </div>
          {formData.programacion.tipo === 'programado' && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha:</span>
                <span className="font-medium">
                  {new Date(formData.programacion.fecha).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hora:</span>
                <span className="font-medium">{formData.programacion.hora}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Confirmación requerida</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Al {formData.programacion.tipo === 'inmediato' ? 'enviar ahora' : 'programar'} este anuncio, 
                {countDestinatarios()} usuarios recibirán esta notificación en su bandeja.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnuncioCreator;