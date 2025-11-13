import React, { useState, useEffect } from 'react';
// Ajuste de rutas: Asumiendo que el componente se encuentra a 1 o 2 niveles de la carpeta 'components'.
// Si ProfileSection está en src/pages/profile/ProfileSection.jsx, y AppIcon está en src/components/AppIcon.jsx
// La ruta correcta podría ser:
import Icon from '../../components/AppIcon'; 
import Image from '../../components/AppImage'; 
import Button from '../../components/ui/Button'; 
import Input from '../../components/ui/Input'; 
import Select from '../../components/ui/Select'; 

// Función para obtener el email de sesión de sessionStorage
const getSessionEmail = () => {
  try {
    // Asumo que la sesión se guarda en una clave 'userSession' y contiene el 'email'
    const sessionData = sessionStorage.getItem('email');
    if (sessionData) {
      // Se necesita la estructura: { email: 'user@domain.com', ... }
      return sessionData || null;
    }
  } catch (e) {
    console.error("Error reading session storage:", e);
  }
  return null;
};

// Obtenemos el email, si no existe, usamos el mock de administrador como fallback.
const MOCK_SESSION_EMAIL = getSessionEmail() || "mail@mail.com"; 

const ProfileSection = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para guardar el ID de MongoDB (necesario para la actualización PUT)
  const [userId, setUserId] = useState(null); 
  
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    position: "", // Mapeado a 'cargo'
    employeeId: "", // Mapeado a '_id'
    department: "", // Mapeado a 'empresa'
    profileImage: "https://placehold.co/128x128/3B82F6/FFFFFF?text=A", // Placeholder por defecto
    rol: 'user', // Asumo valor por defecto
    estado: 'activo' // Asumo valor por defecto
  });

  const [formData, setFormData] = useState(profileData);
  const [errors, setErrors] = useState({});

  const departmentOptions = [
    { value: 'Recursos Humanos', label: 'Recursos Humanos' },
    { value: 'Contabilidad', label: 'Contabilidad' },
    { value: 'Ventas', label: 'Ventas' },
    { value: 'Operaciones', label: 'Operaciones' },
    { value: 'Tecnología', label: 'Tecnología' },
    // **Importante:** Si 'empresa' es Acciona Centro de Negocios Spa., debe estar aquí:
    { value: 'Acciona Centro de Negocios Spa.', label: 'Acciona Centro de Negocios Spa.' },
  ];

  // --- Lógica de Carga Inicial ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      const userEmail = getSessionEmail() || MOCK_SESSION_EMAIL;
      
      if (!userEmail) {
        setIsLoading(false);
        alert('No se pudo encontrar el email de sesión. Intente iniciar sesión.');
        return;
      }
      
      try {
        setIsLoading(true);
        // Usamos el email obtenido dinámicamente o el mock
        const response = await fetch(`https://accionaapi.vercel.app/api/auth/full/${userEmail}`);

        if (!response.ok) {
          throw new Error('Error al cargar el perfil. Usuario no encontrado o API caída.');
        }

        const user = await response.json();
        
        // Mapeo basado en la estructura de tu objeto de usuario
        const initialData = {
          firstName: user.nombre || '',
          lastName: user.apellido || '',
          email: user.mail || '',
          position: user.cargo || user.rol || '', // 'position' será 'Empleado'
          employeeId: user._id || '', 
          department: user.empresa || '', // 'department' será 'Acciona Centro de Negocios Spa.'
          profileImage: `https://placehold.co/128x128/3B82F6/FFFFFF?text=${user.nombre[0].toUpperCase()}`,
          rol: user.rol || 'user',
          estado: user.estado || 'activo'
        };
        
        setUserId(user._id);
        setProfileData(initialData);
        setFormData(initialData);

      } catch (error) {
        console.error("Error al cargar perfil:", error);
        
        // Carga de datos de ejemplo si falla la API (usando la estructura real)
        const fallbackData = {
          firstName: "",
          lastName: "",
          email: "",
          position: "Empleado",
          employeeId: "",
          department: ".",
          rol: '',
          estado: 'activo',
          profileImage: profileData.profileImage
        };
        setProfileData(fallbackData);
        setFormData(fallbackData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []); // Se ejecuta una sola vez al montar

  // --- Lógica de Interacción del Formulario ---

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    if (errors?.[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.firstName?.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    }

    if (!formData?.lastName?.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    }

    if (!formData?.email?.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData?.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!userId) return alert('Error: ID de usuario no disponible para actualizar.');
    
    setIsLoading(true);

    // Mapeo inverso de campos de vuelta a la estructura de la API (PUT /users/:id)
    const updateBody = {
      nombre: formData.firstName,
      apellido: formData.lastName,
      mail: formData.email,
      empresa: formData.department, // Mapeado a 'empresa'
      cargo: formData.position,
      rol: profileData.rol, 
      estado: profileData.estado 
    };
    
    try {
      const response = await fetch(`https://accionaapi.vercel.app/api/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Aquí iría el token de autenticación: 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el perfil.');
      }
      
      // La API respondió OK, actualizamos los datos locales y salimos de edición
      setProfileData({ ...formData, rol: profileData.rol, estado: profileData.estado });
      setIsEditing(false);
      alert('Perfil actualizado exitosamente.');
      
    } catch (error) {
      console.error("Error guardando perfil:", error);
      alert("Error al guardar el perfil: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(profileData);
    setErrors({});
    setIsEditing(false);
  };

  const handleImageUpload = (event) => {
    const file = event?.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          profileImage: e?.target?.result
        }));
      };
      reader?.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-subtle p-12 text-center text-muted-foreground">
        <Icon name="Loader" size={24} className="animate-spin mx-auto mb-3 text-primary" />
        Cargando datos del perfil...
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-subtle">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon name="User" size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Información Personal</h2>
          </div>
          {!isEditing ?
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            iconName="Edit"
            iconPosition="left">

              Editar Perfil
            </Button> :

          <div className="flex items-center space-x-2">
              <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isLoading}>

                Cancelar
              </Button>
              <Button
              variant="default"
              onClick={handleSave}
              iconName="Save"
              iconPosition="left"
              disabled={isLoading}>

                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          }
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Image Section */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border">
                  <Image
                    src={formData?.profileImage}
                    alt={`Foto de perfil de ${formData.firstName}`}
                    className="w-full h-full object-cover" />

                </div>
                {isEditing &&
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                    <Icon name="Camera" size={16} color="white" />
                    <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden" />

                  </label>
                }
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-foreground">
                  {formData?.firstName} {formData?.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">{formData?.position}</p>
                <p className="text-xs text-muted-foreground mt-1">ID: {formData?.employeeId}</p>
                <p className="text-sm text-muted-foreground mt-1 font-semibold">{formData?.department}</p>
              </div>

              {isEditing &&
              <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Formatos soportados: JPG, PNG, GIF
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tamaño máximo: 5MB
                  </p>
                </div>
              }
            </div>
          </div>

          {/* Form Fields */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                type="text"
                value={formData?.firstName}
                onChange={(e) => handleInputChange('firstName', e?.target?.value)}
                disabled={!isEditing}
                error={errors?.firstName}
                required
                placeholder="Ingrese su nombre" />


              <Input
                label="Apellidos"
                type="text"
                value={formData?.lastName}
                onChange={(e) => handleInputChange('lastName', e?.target?.value)}
                disabled={!isEditing}
                error={errors?.lastName}
                required
                placeholder="Ingrese sus apellidos" />


              <Input
                label="Correo Electrónico"
                type="email"
                value={formData?.email}
                onChange={(e) => handleInputChange('email', e?.target?.value)}
                disabled={!isEditing}
                error={errors?.email}
                required
                placeholder="correo@empresa.com"
                className="md:col-span-2" />


              <Input
                label="Cargo"
                type="text"
                value={formData?.position}
                onChange={(e) => handleInputChange('position', e?.target?.value)}
                disabled
                placeholder="Cargo actual" />


              <Input
                label="Empresa / Departamento"
                options={departmentOptions}
                value={formData?.department}
                disabled
                placeholder="Seleccionar empresa/departamento"
                className="md:col-span-2" />

            </div>

            {/* Department Assignments - Usamos los datos cargados */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-foreground mb-3">Asignaciones de Cuenta</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon name="Building2" size={16} className="text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{profileData.department || 'Sin Empresa Asignada'}</p>
                      <p className="text-xs text-muted-foreground">{profileData.position || 'N/A'} - {profileData.rol || 'Cliente'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                      Principal
                    </span>
                  </div>
                </div>

                {/* El bloque secundario se puede mantener como ejemplo mock si no tienes más datos de asignación */}
                {profileData.rol === 'admin' && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon name="Lock" size={16} className="text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Rol de Administración</p>
                        <p className="text-xs text-muted-foreground">Acceso de superusuario (Global)</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        {profileData.rol.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);

};

export default ProfileSection;