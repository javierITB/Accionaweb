// react_app/src/pages/anuncios/components/DestinatariosSelector.jsx
import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const DestinatariosSelector = ({ formData, setFormData, usuarios, empresas }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Opciones para filtros
  const rolesUnicos = [...new Set(usuarios.map(u => u.rol))].filter(Boolean);
  const cargosUnicos = [...new Set(usuarios.map(u => u.cargo))].filter(Boolean);

  const handleTipoChange = (tipo) => {
    setFormData({
      ...formData,
      destinatarios: {
        ...formData.destinatarios,
        tipo
      }
    });
  };

  const handleFiltroChange = (key, values) => {
    setFormData({
      ...formData,
      destinatarios: {
        ...formData.destinatarios,
        filtro: {
          ...formData.destinatarios.filtro,
          [key]: values
        }
      }
    });
  };

  const toggleUserSelection = (userId) => {
    const current = [...formData.destinatarios.usuariosManuales];
    const index = current.indexOf(userId);
    
    if (index === -1) {
      current.push(userId);
    } else {
      current.splice(index, 1);
    }
    
    setFormData({
      ...formData,
      destinatarios: {
        ...formData.destinatarios,
        usuariosManuales: current
      }
    });
  };

  const usuariosFiltrados = usuarios.filter(user =>
    user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.mail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Selecciona los destinatarios</h3>
        
        {/* Selector de tipo de envío */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            type="button"
            onClick={() => handleTipoChange('todos')}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              formData.destinatarios.tipo === 'todos'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="font-semibold">Todos los usuarios</h4>
            <p className="text-sm text-gray-500 mt-1">Enviar a todos los usuarios del sistema</p>
          </button>

          <button
            type="button"
            onClick={() => handleTipoChange('filtro')}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              formData.destinatarios.tipo === 'filtro'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h4 className="font-semibold">Por filtro</h4>
            <p className="text-sm text-gray-500 mt-1">Filtrar por empresa, cargo o rol</p>
          </button>

          <button
            type="button"
            onClick={() => handleTipoChange('manual')}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              formData.destinatarios.tipo === 'manual'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h4 className="font-semibold">Selección manual</h4>
            <p className="text-sm text-gray-500 mt-1">Elegir usuarios individualmente</p>
          </button>
        </div>

        {/* Contenido según tipo seleccionado */}
        {formData.destinatarios.tipo === 'filtro' && (
          <div className="bg-gray-50 rounded-xl p-6 space-y-6">
            <h4 className="font-semibold text-gray-900">Configurar filtros</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresas
                </label>
                <Select
                  multiple
                  value={formData.destinatarios.filtro.empresas}
                  onChange={(e) => handleFiltroChange('empresas', Array.from(e.target.selectedOptions, option => option.value))}
                >
                  <option value="">Seleccionar empresas...</option>
                  {empresas.map(empresa => (
                    <option key={empresa._id} value={empresa._id}>
                      {empresa.nombre}
                    </option>
                  ))}
                </Select>
                {formData.destinatarios.filtro.empresas.length > 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    {formData.destinatarios.filtro.empresas.length} empresa(s) seleccionada(s)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargos
                </label>
                <Select
                  multiple
                  value={formData.destinatarios.filtro.cargos}
                  onChange={(e) => handleFiltroChange('cargos', Array.from(e.target.selectedOptions, option => option.value))}
                >
                  <option value="">Seleccionar cargos...</option>
                  {cargosUnicos.map(cargo => (
                    <option key={cargo} value={cargo}>
                      {cargo}
                    </option>
                  ))}
                </Select>
                {formData.destinatarios.filtro.cargos.length > 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    {formData.destinatarios.filtro.cargos.length} cargo(s) seleccionado(s)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roles
                </label>
                <Select
                  multiple
                  value={formData.destinatarios.filtro.roles}
                  onChange={(e) => handleFiltroChange('roles', Array.from(e.target.selectedOptions, option => option.value))}
                >
                  <option value="">Seleccionar roles...</option>
                  {rolesUnicos.map(rol => (
                    <option key={rol} value={rol}>
                      {rol}
                    </option>
                  ))}
                </Select>
                {formData.destinatarios.filtro.roles.length > 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    {formData.destinatarios.filtro.roles.length} rol(es) seleccionado(s)
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-blue-700">
                  El anuncio se enviará a todos los usuarios que cumplan con AL MENOS UNO de los filtros seleccionados.
                </span>
              </div>
            </div>
          </div>
        )}

        {formData.destinatarios.tipo === 'manual' && (
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Seleccionar usuarios manualmente</h4>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar usuarios por nombre, email o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              {usuariosFiltrados.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No se encontraron usuarios
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seleccionar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cargo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usuariosFiltrados.map(user => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Checkbox
                            checked={formData.destinatarios.usuariosManuales.includes(user._id)}
                            onChange={() => toggleUserSelection(user._id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">
                                  {user.nombre?.[0]}{user.apellido?.[0]}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.nombre} {user.apellido}
                              </div>
                              <div className="text-sm text-gray-500">{user.rol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.mail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.empresa}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {user.cargo}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {formData.destinatarios.usuariosManuales.length} usuario(s) seleccionado(s)
              </span>
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
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
                >
                  Seleccionar todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      destinatarios: {
                        ...formData.destinatarios,
                        usuariosManuales: []
                      }
                    });
                  }}
                >
                  Limpiar selección
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Resumen */}
        {(formData.destinatarios.tipo === 'todos' || formData.destinatarios.tipo === 'filtro' || formData.destinatarios.tipo === 'manual') && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-green-800">
                {formData.destinatarios.tipo === 'todos' && `El anuncio se enviará a todos los usuarios (${usuarios.length} usuarios)`}
                {formData.destinatarios.tipo === 'filtro' && 'El anuncio se enviará a usuarios que cumplan los filtros seleccionados'}
                {formData.destinatarios.tipo === 'manual' && `El anuncio se enviará a ${formData.destinatarios.usuariosManuales.length} usuario(s) seleccionado(s)`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DestinatariosSelector;