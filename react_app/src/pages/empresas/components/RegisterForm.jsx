import React, { useState, useEffect } from 'react';
import Input from 'components/ui/Input';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RegisterForm = ({ formData, onUpdateFormData, onRegister, isLoading }) => {
  const [logoPreview, setLogoPreview] = useState(null);

  // Manejar upload de logo
  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        // Crear preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setLogoPreview(e.target.result);
          onUpdateFormData('logo', file);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Por favor selecciona un archivo de imagen válido');
      }
    }
  };

  // Remover logo
  const handleRemoveLogo = () => {
    setLogoPreview(null);
    onUpdateFormData('logo', null);
  };

  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name="Building2" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Registrar Empresa
            </h3>
            <p className="text-sm text-muted-foreground">
              Añadir empresa para asociar al sistema de usuarios
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NOMBRE DE EMPRESA */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Nombre de Empresa<span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({formData?.nombre?.length || 0}/50 caracteres)
              </span>
            </label>
            <input
              type="text"
              placeholder="Ej: Walmart Chile S.A."
              value={formData?.nombre || ''}
              onChange={(e) => onUpdateFormData('nombre', e.target.value)}
              maxLength={50}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                (formData?.nombre?.length || 0) >= 50
                  ? 'border-red-500 focus-visible:ring-red-200' 
                  : 'border-input focus-visible:ring-blue-200'
              }`}
            />
            {(formData?.nombre?.length || 0) >= 50 && (
              <p className="text-red-500 text-xs">
                Límite de 50 caracteres alcanzado
              </p>
            )}
          </div>
          
          {/* RUT */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              RUT<span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: 76.123.456-7"
              value={formData?.rut || ''}
              onChange={(e) => onUpdateFormData('rut', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* DIRECCIÓN */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground">
              Dirección
            </label>
            <input
              type="text"
              placeholder="Ej: Av. Providencia 1000, Santiago"
              value={formData?.direccion || ''}
              onChange={(e) => onUpdateFormData('direccion', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* ENCARGADO - AHORA COMO TEXTO LIBRE */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Encargado
            </label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez González"
              value={formData?.encargado || ''}
              onChange={(e) => onUpdateFormData('encargado', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-xs text-muted-foreground">
              Nombre de la persona responsable (opcional)
            </p>
          </div>

          {/* LOGO */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Logo de la Empresa
            </label>
            <div className="space-y-3">
              {logoPreview ? (
                <div className="flex items-center space-x-4">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="w-16 h-16 object-contain border rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Icon name="X" size={14} className="mr-1" />
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <Icon name="Upload" size={24} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Haz clic para subir logo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, SVG (max 2MB)
                    </p>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTÓN DE REGISTRO */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={onRegister}
            disabled={isLoading || !formData?.nombre || !formData?.rut}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            iconName="Building2"
            iconPosition="left"
          >
            {isLoading ? 'Registrando...' : 'Registrar Empresa'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;