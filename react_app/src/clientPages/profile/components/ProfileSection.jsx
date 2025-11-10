import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const ProfileSection = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "María",
    lastName: "González",
    email: "maria.gonzalez@empresa.com",
    position: "Supervisora de Recursos Humanos",
    employeeId: "EMP-2024-001",
    profileImage: "https://images.unsplash.com/photo-1628595556262-4cffd053a4bf"
  });

  const [formData, setFormData] = useState(profileData);
  const [errors, setErrors] = useState({});

  const departmentOptions = [
  { value: 'hr', label: 'Recursos Humanos' },
  { value: 'accounting', label: 'Contabilidad' },
  { value: 'sales', label: 'Ventas' },
  { value: 'operations', label: 'Operaciones' },
  { value: 'it', label: 'Tecnología' }];


  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
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
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      setProfileData(formData);
      setIsEditing(false);
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
      // Mock image upload - in real app would upload to server
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
              onClick={handleCancel}>

                Cancelar
              </Button>
              <Button
              variant="default"
              onClick={handleSave}
              iconName="Save"
              iconPosition="left">

                Guardar
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
                    alt="Foto de perfil de María González, supervisora con cabello castaño y sonrisa profesional"
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
                disabled
                placeholder="Cargo actual" />


              <Select
                label="Departamento Principal"
                options={departmentOptions}
                value="hr"
                disabled
                placeholder="Seleccionar departamento"
                className="md:col-span-2" />

            </div>

            {/* Department Assignments */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-foreground mb-3">Asignaciones de Departamento</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon name="Building2" size={16} className="text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Recursos Humanos</p>
                      <p className="text-xs text-muted-foreground">Supervisora - Acceso completo</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                      Principal
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon name="Building2" size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Operaciones</p>
                      <p className="text-xs text-muted-foreground">Colaboradora - Solo lectura</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Secundario
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);

};

export default ProfileSection;