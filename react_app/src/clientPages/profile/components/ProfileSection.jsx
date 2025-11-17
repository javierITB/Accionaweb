import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon'; 
import Image from '../../components/AppImage'; 
import Button from '../../components/ui/Button'; 
import Input from '../../components/ui/Input'; 
import Select from '../../components/ui/Select'; 

// Función para obtener el email de sesión de sessionStorage
const getSessionEmail = () => {
  try {
    const sessionData = sessionStorage.getItem('email');
    if (sessionData) {
      return sessionData || null;
    }
  } catch (e) {
    console.error("Error reading session storage:", e);
  }
  return null;
};

const MOCK_SESSION_EMAIL = getSessionEmail() || "mail@mail.com"; 

const ProfileSection = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null); 
  
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    position: "",
    employeeId: "",
    department: "",
    profileImage: "https://placehold.co/128x128/3B82F6/FFFFFF?text=A",
    rol: 'user',
    estado: 'activo'
  });

  const [formData, setFormData] = useState(profileData);
  const [errors, setErrors] = useState({});

  const departmentOptions = [
    { value: 'Recursos Humanos', label: 'Recursos Humanos' },
    { value: 'Contabilidad', label: 'Contabilidad' },
    { value: 'Ventas', label: 'Ventas' },
    { value: 'Operaciones', label: 'Operaciones' },
    { value: 'Tecnología', label: 'Tecnología' },
    { value: 'Acciona Centro de Negocios Spa.', label: 'Acciona Centro de Negocios Spa.' },
  ];

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
        const response = await fetch(`https://accionaweb.vercel.app/api/auth/full/${userEmail}`);

        if (!response.ok) {
          throw new Error('Error al cargar el perfil. Usuario no encontrado o API caída.');
        }

        const user = await response.json();
        
        const initialData = {
          firstName: user.nombre || '',
          lastName: user.apellido || '',
          email: user.mail || '',
          position: user.cargo || user.rol || '',
          employeeId: user._id || '', 
          department: user.empresa || '',
          profileImage: `https://placehold.co/128x128/3B82F6/FFFFFF?text=${user.nombre?.[0]?.toUpperCase() || 'A'}`,
          rol: user.rol || 'user',
          estado: user.estado || 'activo'
        };
        
        setUserId(user._id);
        setProfileData(initialData);
        setFormData(initialData);

      } catch (error) {
        console.error("Error al cargar perfil:", error);
        
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
  }, []);

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

    const updateBody = {
      nombre: formData.firstName,
      apellido: formData.lastName,
      mail: formData.email,
      empresa: formData.department,
      cargo: formData.position,
      rol: profileData.rol, 
      estado: profileData.estado 
    };
    
    try {
      const response = await fetch(`https://accionaweb.vercel.app/api/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el perfil.');
      }
      
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
      <div className="bg-card rounded-lg border border-border shadow-subtle p-8 sm:p-12 text-center text-muted-foreground">
        <Icon name="Loader" size={24} className="animate-spin mx-auto mb-3 text-primary" />
        <span className="text-sm sm:text-base">Cargando datos del perfil...</span>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-subtle w-full">
      {/* Header - RESPONSIVE */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between space-y-3 xs:space-y-0">
          <div className="flex items-center space-x-3">
            <Icon name="User" size={18} className="text-primary sm:w-5 sm:h-5" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Información Personal</h2>
          </div>
          
          {/* Botones de acción - MEJORADOS PARA MÓVIL */}
          {!isEditing ? (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              iconName="Edit"
              iconPosition="left"
              size="sm"
              className="w-full xs:w-auto justify-center"
            >
              Editar Perfil
            </Button>
          ) : (
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center space-y-2 xs:space-y-0 xs:space-x-2 w-full xs:w-auto">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={isLoading}
                size="sm"
                className="w-full xs:w-auto justify-center"
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={handleSave}
                iconName="Save"
                iconPosition="left"
                disabled={isLoading}
                size="sm"
                className="w-full xs:w-auto justify-center"
              >
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content - RESPONSIVE */}
      <div className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Profile Image Section - MEJORADO PARA MÓVIL */}
          <div className="lg:w-1/3">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-border">
                  <Image
                    src={formData?.profileImage}
                    alt={`Foto de perfil de ${formData.firstName}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                    <Icon name="Camera" size={14} color="white" className="sm:w-4 sm:h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-medium text-foreground break-words">
                  {formData?.firstName} {formData?.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">{formData?.position}</p>
                <p className="text-xs text-muted-foreground mt-1">ID: {formData?.employeeId}</p>
                <p className="text-sm text-muted-foreground mt-1 font-semibold break-words">
                  {formData?.department}
                </p>
              </div>

              {isEditing && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Formatos soportados: JPG, PNG, GIF
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tamaño máximo: 5MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields - MEJORADO PARA MÓVIL */}
          <div className="lg:w-2/3">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Nombre"
                  type="text"
                  value={formData?.firstName}
                  onChange={(e) => handleInputChange('firstName', e?.target?.value)}
                  disabled={!isEditing}
                  error={errors?.firstName}
                  required
                  placeholder="Ingrese su nombre"
                />

                <Input
                  label="Apellidos"
                  type="text"
                  value={formData?.lastName}
                  onChange={(e) => handleInputChange('lastName', e?.target?.value)}
                  disabled={!isEditing}
                  error={errors?.lastName}
                  required
                  placeholder="Ingrese sus apellidos"
                />
              </div>

              <Input
                label="Correo Electrónico"
                type="email"
                value={formData?.email}
                onChange={(e) => handleInputChange('email', e?.target?.value)}
                disabled={!isEditing}
                error={errors?.email}
                required
                placeholder="correo@empresa.com"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Cargo"
                  type="text"
                  value={formData?.position}
                  onChange={(e) => handleInputChange('position', e?.target?.value)}
                  disabled
                  placeholder="Cargo actual"
                />

                <Input
                  label="Empresa / Departamento"
                  options={departmentOptions}
                  value={formData?.department}
                  disabled
                  placeholder="Seleccionar empresa/departamento"
                />
              </div>
            </div>

            {/* Department Assignments - RESPONSIVE */}
            <div className="mt-4 sm:mt-6">
              <h4 className="text-sm font-medium text-foreground mb-3">Asignaciones de Cuenta</h4>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted rounded-lg space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <Icon name="Building2" size={16} className="text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground break-words">
                        {profileData.department || 'Sin Empresa Asignada'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {profileData.position || 'N/A'} - {profileData.rol || 'Cliente'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full whitespace-nowrap">
                      Principal
                    </span>
                  </div>
                </div>

                {profileData.rol === 'admin' && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted rounded-lg space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <Icon name="Lock" size={16} className="text-red-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">Rol de Administración</p>
                        <p className="text-xs text-muted-foreground">Acceso de superusuario (Global)</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full whitespace-nowrap">
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
    </div>
  );
};

export default ProfileSection;