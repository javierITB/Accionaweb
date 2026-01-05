import React, { useState, useEffect } from 'react';

const DestinatariosSelector = ({ formData, setFormData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar usuarios y empresas
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const token = sessionStorage.getItem('token');

        // Cargar usuarios
        const usersRes = await fetch('https://back-desa.vercel.app/api/auth/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await usersRes.json();
        setUsuarios(Array.isArray(users) ? users : []);

        // Cargar empresas
        const empresasRes = await fetch('https://back-desa.vercel.app/api/auth/empresas/todas', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const empresasData = await empresasRes.json();
        setEmpresas(Array.isArray(empresasData) ? empresasData : []);

      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

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
    } else if (formData.destinatarios.tipo === 'filtro') {
      const filtro = formData.destinatarios.filtro;

      // Si no hay filtros seleccionados, es como "todos"
      if (filtro.empresas.length === 0 && filtro.cargos.length === 0 && filtro.roles.length === 0) {
        return usuarios.length;
      }

      // Calcular usuarios que cumplen TODOS los filtros seleccionados (AND)
      const usuariosFiltrados = usuarios.filter(user => {
        let cumpleTodos = true;

        // Verificar empresa (si se seleccionó al menos una)
        if (filtro.empresas.length > 0) {
          cumpleTodos = cumpleTodos && filtro.empresas.includes(user.empresa);
        }

        // Verificar cargo (si se seleccionó al menos uno)
        if (filtro.cargos.length > 0) {
          cumpleTodos = cumpleTodos && filtro.cargos.includes(user.cargo);
        }

        // Verificar rol (si se seleccionó al menos uno)
        if (filtro.roles.length > 0) {
          cumpleTodos = cumpleTodos && filtro.roles.includes(user.rol);
        }

        return cumpleTodos;
      });

      return usuariosFiltrados.length;
    }

    return 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-card-foreground">Seleccionar Destinatarios</h3>
        <div className="text-center p-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Cargando datos de usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-card-foreground">Seleccionar Destinatarios</h3>

      {/* Botones de tipo */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => handleTipoChange('todos')}
          className={`p-4 rounded-lg border text-center transition-colors ${formData.destinatarios.tipo === 'todos'
              ? 'border-primary bg-primary/10 text-card-foreground'
              : 'border-border hover:border-primary/50 bg-card text-card-foreground'
            }`}
        >
          <div className="font-medium">Todos los usuarios</div>
          <div className={`text-sm mt-1 ${formData.destinatarios.tipo === 'todos' ? 'text-muted-foreground' : 'text-muted-foreground'
            }`}>{usuarios.length} usuarios activos</div>
        </button>

        <button
          type="button"
          onClick={() => handleTipoChange('filtro')}
          className={`p-4 rounded-lg border text-center transition-colors ${formData.destinatarios.tipo === 'filtro'
              ? 'border-primary bg-primary/10 text-card-foreground'
              : 'border-border hover:border-primary/50 bg-card text-card-foreground'
            }`}
        >
          <div className="font-medium">Por filtros</div>
          <div className={`text-sm mt-1 ${formData.destinatarios.tipo === 'filtro' ? 'text-muted-foreground' : 'text-muted-foreground'
            }`}>Empresa, cargo, rol</div>
        </button>

        <button
          type="button"
          onClick={() => handleTipoChange('manual')}
          className={`p-4 rounded-lg border text-center transition-colors ${formData.destinatarios.tipo === 'manual'
              ? 'border-primary bg-primary/10 text-card-foreground'
              : 'border-border hover:border-primary/50 bg-card text-card-foreground'
            }`}
        >
          <div className="font-medium">Selección manual</div>
          <div className={`text-sm mt-1 ${formData.destinatarios.tipo === 'manual' ? 'text-muted-foreground' : 'text-muted-foreground'
            }`}>Usuarios específicos</div>
        </button>
      </div>

      {/* Contenido según tipo */}
      {formData.destinatarios.tipo === 'filtro' && (
        <div className="space-y-6 p-4 bg-muted rounded-lg border border-border">
          <h4 className="font-medium text-card-foreground">Configurar filtros</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-card-foreground">Empresas</label>
              <select
                multiple
                className="w-full border border-border rounded-lg p-2 bg-input text-foreground"
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
              <p className="text-sm text-muted-foreground mt-1">
                {formData.destinatarios.filtro.empresas.length} empresa(s) seleccionada(s)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-card-foreground">Cargos</label>
              <select
                multiple
                className="w-full border border-border rounded-lg p-2 bg-input text-foreground"
                value={formData.destinatarios.filtro.cargos}
                onChange={e => handleFiltroChange('cargos',
                  Array.from(e.target.selectedOptions, o => o.value)
                )}
              >
                {cargosDisponibles.map(cargo => (
                  <option key={cargo} value={cargo}>{cargo}</option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground mt-1">
                {formData.destinatarios.filtro.cargos.length} cargo(s) seleccionado(s)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-card-foreground">Roles</label>
              <select
                multiple
                className="w-full border border-border rounded-lg p-2 bg-input text-foreground"
                value={formData.destinatarios.filtro.roles}
                onChange={e => handleFiltroChange('roles',
                  Array.from(e.target.selectedOptions, o => o.value)
                )}
              >
                {rolesDisponibles.map(rol => (
                  <option key={rol} value={rol}>{rol}</option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground mt-1">
                {formData.destinatarios.filtro.roles.length} rol(es) seleccionado(s)
              </p>
            </div>
          </div>

          <div className="p-3 bg-primary/10 rounded text-sm text-primary border border-primary/20">
            <strong>Nota:</strong> El anuncio se enviará a usuarios que cumplan con todos los filtros.
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
              className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {usuariosFiltrados.length} de {usuarios.length} usuarios encontrados
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto border border-border rounded-lg bg-card">
            {usuariosFiltrados.map(user => (
              <div
                key={user._id}
                className={`p-3 border-b border-border hover:bg-muted cursor-pointer transition-colors ${formData.destinatarios.usuariosManuales.includes(user._id)
                    ? 'bg-primary/10'
                    : 'bg-card'
                  }`}
                onClick={() => toggleUsuario(user._id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-card-foreground">{user.nombre} {user.apellido}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.cargo} • {user.empresa} • {user.mail}
                    </div>
                  </div>
                  {formData.destinatarios.usuariosManuales.includes(user._id) && (
                    <span className="text-primary font-bold">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-card-foreground">
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
                className="text-sm text-primary hover:text-primary/80 transition-colors"
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
                className="text-sm text-error hover:text-error/80 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="p-4 bg-success/10 rounded-lg border border-success/20">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center mr-3">
            <span className="text-success">📢</span>
          </div>
          <div>
            <div className="font-medium text-success">
              {formData.destinatarios.tipo === 'todos' && `Se enviará a todos los usuarios (${usuarios.length})`}
              {formData.destinatarios.tipo === 'filtro' && `Se enviará por filtros (${contarDestinatarios()})`}
              {formData.destinatarios.tipo === 'manual' && `Se enviará a ${formData.destinatarios.usuariosManuales.length} usuario(s) seleccionado(s)`}
            </div>
            <div className="text-sm text-success/80 mt-1">
              La notificación se enviará inmediatamente con todos los parámetros configurados
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinatariosSelector;