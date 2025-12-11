import React, { useState } from 'react';

const DestinatariosSelector = ({ formData, setFormData, usuarios, empresas }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Cargos predefinidos basados en tus datos
  const cargosDisponibles = ['RRHH', 'Cliente', 'Admin', 'Usuario'];
  const rolesDisponibles = ['Admin', 'user'];

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

  // Filtrar usuarios para búsqueda
  const usuariosFiltrados = usuarios.filter(user => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      (user.nombre && user.nombre.toLowerCase().includes(term)) ||
      (user.apellido && user.apellido.toLowerCase().includes(term)) ||
      (user.mail && user.mail.toLowerCase().includes(term)) ||
      (user.empresa && user.empresa.toLowerCase().includes(term)) ||
      (user.cargo && user.cargo.toLowerCase().includes(term))
    );
  });

  // Contar destinatarios estimados
  const contarDestinatarios = () => {
    if (formData.destinatarios.tipo === 'todos') {
      return usuarios.length;
    } else if (formData.destinatarios.tipo === 'manual') {
      return formData.destinatarios.usuariosManuales.length;
    } else {
      // Estimación para filtros
      const filtro = formData.destinatarios.filtro;
      if (filtro.empresas.length === 0 && filtro.cargos.length === 0 && filtro.roles.length === 0) {
        return usuarios.length;
      }
      return 'Calculando...';
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Seleccionar Destinatarios</h3>
      
      {/* Botones de tipo */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => handleTipoChange('todos')}
          className={`p-4 rounded-lg border text-center ${formData.destinatarios.tipo === 'todos' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <div className="font-medium">Todos los usuarios</div>
          <div className="text-sm text-gray-500 mt-1">{usuarios.length} usuarios activos</div>
        </button>
        
        <button
          type="button"
          onClick={() => handleTipoChange('filtro')}
          className={`p-4 rounded-lg border text-center ${formData.destinatarios.tipo === 'filtro' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <div className="font-medium">Por filtros</div>
          <div className="text-sm text-gray-500 mt-1">Empresa, cargo, rol</div>
        </button>
        
        <button
          type="button"
          onClick={() => handleTipoChange('manual')}
          className={`p-4 rounded-lg border text-center ${formData.destinatarios.tipo === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <div className="font-medium">Selección manual</div>
          <div className="text-sm text-gray-500 mt-1">Usuarios específicos</div>
        </button>
      </div>

      {/* Contenido según tipo */}
      {formData.destinatarios.tipo === 'filtro' && (
        <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium">Configurar filtros</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Empresas</label>
              <select
                multiple
                className="w-full border rounded-lg p-2"
                value={formData.destinatarios.filtro.empresas}
                onChange={e => handleFiltroChange('empresas', 
                  Array.from(e.target.selectedOptions, o => o.value)
                )}
              >
                {empresas.map(empresa => (
                  <option key={empresa._id} value={empresa.nombre}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                {formData.destinatarios.filtro.empresas.length} empresa(s) seleccionada(s)
              </p>
            </div>
            
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
                {cargosDisponibles.map(cargo => (
                  <option key={cargo} value={cargo}>{cargo}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                {formData.destinatarios.filtro.cargos.length} cargo(s) seleccionado(s)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Roles</label>
              <select
                multiple
                className="w-full border rounded-lg p-2"
                value={formData.destinatarios.filtro.roles}
                onChange={e => handleFiltroChange('roles', 
                  Array.from(e.target.selectedOptions, o => o.value)
                )}
              >
                {rolesDisponibles.map(rol => (
                  <option key={rol} value={rol}>{rol}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                {formData.destinatarios.filtro.roles.length} rol(es) seleccionado(s)
              </p>
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 rounded text-sm text-blue-700">
            <strong>Nota:</strong> El anuncio se enviará a usuarios que cumplan AL MENOS UNO de los filtros seleccionados.
          </div>
        </div>
      )}

      {formData.destinatarios.tipo === 'manual' && (
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Buscar usuarios por nombre, email, empresa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-1">
              {usuariosFiltrados.length} de {usuarios.length} usuarios encontrados
            </p>
          </div>
          
          <div className="max-h-64 overflow-y-auto border rounded-lg">
            {usuariosFiltrados.map(user => (
              <div
                key={user._id}
                className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                  formData.destinatarios.usuariosManuales.includes(user._id) ? 'bg-blue-50' : ''
                }`}
                onClick={() => toggleUsuario(user._id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{user.nombre} {user.apellido}</div>
                    <div className="text-sm text-gray-500">
                      {user.cargo} • {user.empresa} • {user.mail}
                    </div>
                  </div>
                  {formData.destinatarios.usuariosManuales.includes(user._id) && (
                    <span className="text-blue-600 font-bold">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span className="font-medium">{formData.destinatarios.usuariosManuales.length}</span> usuario(s) seleccionado(s)
            </div>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => {
                  const allIds = usuariosFiltrados.map(u => u._id);
                  setFormData({
                    ...formData,
                    destinatarios: {
                      ...formData.destinatarios,
                      usuariosManuales: allIds
                    }
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Seleccionar todos
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    destinatarios: {
                      ...formData.destinatarios,
                      usuariosManuales: []
                    }
                  });
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
            <span className="text-green-600">📢</span>
          </div>
          <div>
            <div className="font-medium text-green-800">
              {formData.destinatarios.tipo === 'todos' && `Se enviará a todos los usuarios (${usuarios.length})`}
              {formData.destinatarios.tipo === 'filtro' && `Se enviará por filtros (${contarDestinatarios()})`}
              {formData.destinatarios.tipo === 'manual' && `Se enviará a ${formData.destinatarios.usuariosManuales.length} usuario(s) seleccionado(s)`}
            </div>
            <div className="text-sm text-green-600 mt-1">
              La notificación se enviará inmediatamente con todos los parámetros configurados
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinatariosSelector;