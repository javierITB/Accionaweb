import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { apiFetch, API_BASE_URL } from '../../../../utils/api';

const ShareModal = ({ isOpen, onClose, request }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const mailSesion = sessionStorage.getItem("email");

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    } else {
      setUsers([]);
      setSelectedUsers([]);
      setSearchTerm('');
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      if (!mailSesion) {
        console.error('No se encontró el email en la sesión');
        return;
      }

      const response = await apiFetch(`${API_BASE_URL}/auth/empresas/usuarios/${mailSesion}`);

      if (response.ok) {
        const result = await response.json();

        // AJUSTE: Accedemos a result.data que es donde viene el array ahora
        const userData = result.data || [];
        
        // AJUSTE: Filtramos comparando con u.mail según tu nuevo formato de objeto
        const otherUsers = userData.filter(u => u.mail !== mailSesion);
        setUsers(otherUsers);
      } else {
        console.error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) return;

    setIsSharing(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/respuestas/compartir`, {
        method: 'POST',
        body: JSON.stringify({
          id: request._id,      // El backend espera 'id'
          usuarios: selectedUsers // El backend espera 'usuarios' (array de IDs)
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Solicitud compartida correctamente.");
        onClose();
      } else {
        alert(data.message || 'Error al compartir la solicitud');
      }
    } catch (error) {
      console.error('Error sharing request:', error);
      alert('Error de conexión al compartir');
    } finally {
      setIsSharing(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.mail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border shadow-brand-active w-full max-w-md rounded-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Compartir Solicitud</h3>
            <p className="text-xs text-muted-foreground truncate max-w-[250px]">{request?.title || 'Sin título'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} iconName="X" iconSize={20} />
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Icon name="Loader" size={24} className="animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Cargando compañeros...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <div
                  key={user.id} // AJUSTE: Ahora es 'id' según tu JSON
                  onClick={() => handleToggleUser(user.id)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUsers.includes(user.id) ? 'bg-accent/10 border-accent/20 border' : 'hover:bg-muted/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs uppercase">
                      {user.nombre?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.nombre} {user.apellido}</p>
                      <p className="text-xs text-muted-foreground">{user.mail}</p>
                    </div>
                  </div>
                  <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                    selectedUsers.includes(user.id) ? 'bg-accent border-accent' : 'border-border'
                  }`}>
                    {selectedUsers.includes(user.id) && <Icon name="Check" size={14} className="text-white" />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon name="Users" size={32} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No se encontraron usuarios</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground font-medium">
              {selectedUsers.length} {selectedUsers.length === 1 ? 'seleccionado' : 'seleccionados'}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button
                variant="default"
                onClick={handleShare}
                disabled={selectedUsers.length === 0 || isSharing}
                iconName={isSharing ? "Loader" : "Share2"}
              >
                {isSharing ? 'Compartiendo...' : 'Compartir'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;