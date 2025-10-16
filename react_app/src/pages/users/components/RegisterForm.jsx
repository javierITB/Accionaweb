import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RegisterForm = ({ formData, empresas, cargos, roles, onUpdateFormData, onRegister }) => {
  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name="User" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Registrar Usuario
            </h3>
            <p className="text-sm text-muted-foreground">
              Añadir usuario para permitir ingresar al sistema
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NOMBRE */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Nombre<span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({formData?.nombre?.length || 0}/25 caracteres)
              </span>
            </label>
            <input
              type="text"
              placeholder="Ej: Juan"
              value={formData?.nombre || ''}
              onChange={(e) => onUpdateFormData('nombre', e.target.value)}
              maxLength={25}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                (formData?.nombre?.length || 0) >= 25
                  ? 'border-red-500 focus-visible:ring-red-200' 
                  : 'border-input focus-visible:ring-blue-200'
              }`}
            />
            {(formData?.nombre?.length || 0) >= 25 && (
              <p className="text-red-500 text-xs">
                Límite de 25 caracteres alcanzado
              </p>
            )}
          </div>

          {/* APELLIDO */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Apellido<span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({formData?.apellido?.length || 0}/25 caracteres)
              </span>
            </label>
            <input
              type="text"
              placeholder="Ej: Pérez"
              value={formData?.apellido || ''}
              onChange={(e) => onUpdateFormData('apellido', e.target.value)}
              maxLength={25}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                (formData?.apellido?.length || 0) >= 25
                  ? 'border-red-500 focus-visible:ring-red-200' 
                  : 'border-input focus-visible:ring-blue-200'
              }`}
            />
            {(formData?.apellido?.length || 0) >= 25 && (
              <p className="text-red-500 text-xs">
                Límite de 25 caracteres alcanzado
              </p>
            )}
          </div>

          {/* EMAIL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Email<span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              placeholder="Ej: usuario@empresa.com"
              value={formData?.mail || ''}
              onChange={(e) => onUpdateFormData('mail', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-sm text-muted-foreground">
              Se enviará un correo para establecer la contraseña
            </p>
          </div>
          
          {/* EMPRESA */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Empresa <span className="text-destructive">*</span>
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData?.empresa || ''}
              onChange={(e) => onUpdateFormData('empresa', e.target.value)}
            >
              <option value="">Selecciona una empresa</option>
              {empresas?.map((empresa) => (
                <option key={empresa?.value} value={empresa?.value}>
                  {empresa?.label}
                </option>
              ))}
            </select>
          </div>

          {/* CARGO */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Cargo <span className="text-destructive">*</span>
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData?.cargo || ''}
              onChange={(e) => onUpdateFormData('cargo', e.target.value)}
            >
              <option value="">Selecciona un cargo</option>
              {cargos?.map((cargo) => (
                <option key={cargo?.value} value={cargo?.value}>
                  {cargo?.label}
                </option>
              ))}
            </select>
          </div>

          {/* ROL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Rol <span className="text-destructive">*</span>
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData?.rol || 'user'}
              onChange={(e) => onUpdateFormData('rol', e.target.value)}
            >
              {roles?.map((rol) => (
                <option key={rol?.value} value={rol?.value}>
                  {rol?.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              Define los permisos del usuario en el sistema
            </p>
          </div>
        </div>

        {/* BOTÓN DE REGISTRO */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={onRegister}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            iconName="UserPlus"
            iconPosition="left"
          >
            Registrar Usuario
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;