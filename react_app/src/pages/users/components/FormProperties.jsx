import React from 'react';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const FormProperties = ({ formData, categories, sections, onUpdateFormData }) => {


  // FUNCIÓN PARA MANEJAR CAMBIOS EN EL TÍTULO CON VALIDACIÓN
  const handleTitleChange = (value) => {
    if (value.length <= 50) {
      onUpdateFormData('title', value);
    }
  };

  const handleColorPresetSelect = (preset) => {
    onUpdateFormData('primaryColor', preset?.primary);
    onUpdateFormData('secondaryColor', preset?.secondary);
  };

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
              Añadir usuario para permitir infresar al sistema
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* INPUT DE NOMBRE CON VALIDACIÓN MEJORADA */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Nombre<span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({formData?.title?.length || 0}/25 caracteres)
              </span>
            </label>
            <input
              type="text"
              placeholder="Ej: Juan"
              value={formData?.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              maxLength={25}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${(formData?.title?.length || 0) >= 50
                  ? 'border-red-500 focus-visible:ring-red-200'
                  : 'border-input focus-visible:ring-blue-200'
                }`}
            />
            {(formData?.title?.length || 0) >= 50 && (
              <p className="text-red-500 text-xs">
                Límite de 25 caracteres alcanzado
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Este será el nombre visible del usuario
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Apellido<span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({formData?.title?.length || 0}/25 caracteres)
              </span>
            </label>
            <input
              type="text"
              placeholder="Ej: Pérez"
              value={formData?.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              maxLength={25}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${(formData?.title?.length || 0) >= 50
                  ? 'border-red-500 focus-visible:ring-red-200'
                  : 'border-input focus-visible:ring-blue-200'
                }`}
            />
            {(formData?.title?.length || 0) >= 50 && (
              <p className="text-red-500 text-xs">
                Límite de 25 caracteres alcanzado
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Este será el Apellido del usuario
            </p>
          </div>

          {/* Cargo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Cargo <span className="text-destructive">*</span>
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData?.category}
              onChange={(e) => onUpdateFormData('category', e?.target?.value)}
            >
              <option value="">Selecciona un cargo</option>
              {categories?.map((category) => (
                <option key={category?.value} value={category?.value}>
                  {category?.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              Ayuda a organizar y limitar accesos en la web
            </p>
          </div>

           {/* EMPRESA */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Sección <span className="text-destructive">*</span>
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData?.section}
              onChange={(e) => onUpdateFormData('section', e?.target?.value)}
            >
              <option value="">Selecciona una empresa</option>
              {sections?.map((section) => (
                <option key={section?.value} value={section?.value}>
                  {section?.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              Define la empresa a la que pertenece el usuario </p>
          </div>
          

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Contraseña<span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({formData?.title?.length || 0}/25 caracteres)
              </span>
            </label>
            <input
              type="text"
              placeholder="Contraseña"
              value={formData?.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              maxLength={25}
              minLength={8}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${(formData?.title?.length || 0) >= 50
                  ? 'border-red-500 focus-visible:ring-red-200'
                  : 'border-input focus-visible:ring-blue-200'
                } ${(formData?.title?.length || 0) < 8
                  ? 'border-red-500 focus-visible:ring-red-200'
                  : 'border-input focus-visible:ring-blue-200'
                }
                `}
            />
            {(formData?.title?.length || 0) >= 50 && (
              <p className="text-red-500 text-xs">
                Límite de 25 caracteres alcanzado
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Este será el nombre visible del usuario
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Repetir Contraseña<span className="text-destructive">*</span>
              
            </label>
            <input
              type="text"
              placeholder="Contraseña"
              value={formData?.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              maxLength={25}
              minLength={8}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${(formData?.title?.length || 0) >= 50
                  ? 'border-red-500 focus-visible:ring-red-200'
                  : 'border-input focus-visible:ring-blue-200'
                } ${(formData?.title?.length || 0) < 8
                  ? 'border-red-500 focus-visible:ring-red-200'
                  : 'border-input focus-visible:ring-blue-200'
                }
                `}
            />
            {(formData?.title?.length || 0) >= 50 && (
              <p className="text-red-500 text-xs">
                Límite de 25 caracteres alcanzado
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Este será el nombre visible del usuario
            </p>
          </div>



        </div>
      </div>

    </div>
  );
};

export default FormProperties;