import React, { useState, useEffect } from 'react';

const DestinatariosSelector = ({ formData, setFormData }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cargos, setCargos] = useState([]);

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
      
      // Extraer cargos únicos
      const cargosUnicos = [...new Set(users.map(u => u.cargo).filter(Boolean))];
      setCargos(cargosUnicos);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const handleTipoChange = (tipo) => {
    setFormData({
      ...formData,
      destinatarios: { ...formData.destinatarios, tipo }
    });
  };

  const handleFiltroChange = (campo, valores) => {
    setFormData({
      ...formData,
      destinatarios: {
        ...formData.destinatarios,
        filtro: { ...formData.destinatarios.filtro, [campo]: valores }
      }
    });
  };

  const toggleUsuario = (userId) => {
    const current = [...formData.destinatarios.usuariosManuales];
    const index = current.indexOf(userId);
    
    if (index === -1) {
      current.push(userId);
    } else {
      current.splice(index, 1);
    }
    
    setFormData({
      ...formData,
      destinatarios: { ...formData.destinatarios, usuariosManuales: current }
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Destinatarios</h3>
      
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => handleTipoChange('todos')}
          className={`p-4 rounded-lg border ${formData.destinatarios.tipo === 'todos' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
        >
          <div className="font-medium">Todos</div>
          <div className="text-sm text-gray-500">{usuarios.length} usuarios</div>
        </button>
        
        <button
          type="button"
          onClick={() => handleTipoChange('filtro')}
          className={`p-4 rounded-lg border ${formData.destinatarios.tipo === 'filtro' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
        >
          <div className="font-medium">Por Filtro</div>
          <div className="text-sm text-gray-500">Empresa, cargo, rol</div>
        </button>
        
        <button
          type="button"
          onClick={() => handleTipoChange('manual')}
          className={`p-4 rounded-lg border ${formData.destinatarios.tipo === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
        >
          <div className="font-medium">Manual</div>
          <div className="text-sm text-gray-500">Seleccionar usuarios</div>
        </button>
      </div>

      {formData.destinatarios.tipo === 'filtro' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-2">Cargos</label>
            <select
              multiple
              className="w-full border rounded-lg p-2"
              value={formData.destinatarios.filtro.cargos}
              onChange={e => handleFiltroChange('cargos', 
                Array.from(e.target.selectedOptions, o => o.value)
              )}
            >
              {cargos.map(cargo => (
                <option key={cargo} value={cargo}>{cargo}</option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            {formData.destinatarios.filtro.cargos.length} cargo(s) seleccionado(s)
          </div>
        </div>
      )}

      {formData.destinatarios.tipo === 'manual' && (
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto border rounded-lg">
            {usuarios.map(user => (
              <div
                key={user._id}
                className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                  formData.destinatarios.usuariosManuales.includes(user._id) ? 'bg-blue-50' : ''
                }`}
                onClick={() => toggleUsuario(user._id)}
              >
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{user.nombre} {user.apellido}</div>
                    <div className="text-sm text-gray-500">{user.cargo} • {user.empresa}</div>
                  </div>
                  {formData.destinatarios.usuariosManuales.includes(user._id) && (
                    <span className="text-blue-600">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-sm text-gray-600">
            {formData.destinatarios.usuariosManuales.length} usuario(s) seleccionado(s)
          </div>
        </div>
      )}
    </div>
  );
};

export default DestinatariosSelector;