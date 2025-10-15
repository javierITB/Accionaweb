import React from 'react';
import Input from '../../../components/ui/Input';
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
              Registrar Empresa
            </h3>
            <p className="text-sm text-muted-foreground">
              Añadir empresa para asociar al sistema de usuarios
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
              placeholder="Ej: Wallmart"
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
          
          {/* CARGO */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Administrador <span className="text-destructive">*</span>
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData?.cargo || ''}
              onChange={(e) => onUpdateFormData('cargo', e.target.value)}
            >
              <option value="">Selecciona un Usuario</option>
              {cargos?.map((cargo) => (
                <option key={cargo?.value} value={cargo?.value}>
                  {cargo?.label}
                </option>
              ))}
            </select>
          </div>
        

        {/* BOTÓN DE REGISTRO */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={onRegister}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            iconName="UserPlus"
            iconPosition="left"
          >
            Registrar Empresa
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;