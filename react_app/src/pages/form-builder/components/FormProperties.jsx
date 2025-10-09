import React from 'react';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const FormProperties = ({ formData, categories, sections, onUpdateFormData }) => {
  // Time options for response time
  const timeOptions = [
    { value: '1-2', label: '1-2 minutos' },
    { value: '3-5', label: '3-5 minutos' },
    { value: '5-10', label: '5-10 minutos' },
    { value: '10-15', label: '10-15 minutos' },
    { value: '15-30', label: '15-30 minutos' },
    { value: '30+', label: 'Más de 30 minutos' }
  ];

  // Logo options with icons from quickActions
  const logoOptions = [
    {
      value: 'logo1',
      label: 'Contrato de trabajo',
      icon: 'FileText',
      color: 'bg-blue-500'
    },
    {
      value: 'logo2',
      label: 'Contrato trabajo por obra',
      icon: 'FileText',
      color: 'bg-blue-500'
    },
    {
      value: 'logo3',
      label: 'Sueldo empresarial',
      icon: 'Receipt',
      color: 'bg-green-500'
    },
    {
      value: 'logo4',
      label: 'Permiso sin goce de sueldo',
      icon: 'Receipt',
      color: 'bg-red-500'
    },
    {
      value: 'logo5',
      label: 'Certificado de Vigencia',
      icon: 'Clock',
      color: 'bg-purple-500'
    },
    {
      value: 'logo6',
      label: 'Certificado de Antigüedad',
      icon: 'MessageCircle',
      color: 'bg-teal-500'
    },
    {
      value: 'logo7',
      label: 'Certificado Licencias Médicas',
      icon: 'Edit',
      color: 'bg-teal-500'
    },
    {
      value: 'logo8',
      label: 'Solicitud de vacaciones',
      icon: 'Calendar',
      color: 'bg-orange-500'
    }
  ];

  // Company options
  const companyOptions = [
    { value: 'empresa1', label: 'Empresa 1' },
    { value: 'empresa2', label: 'Empresa 2' },
    { value: 'empresa3', label: 'Empresa 3' },
    { value: 'empresa4', label: 'Empresa 4' },
    { value: 'empresa5', label: 'Empresa 5' },
    { value: 'empresa6', label: 'Empresa 6' },
    { value: 'empresa7', label: 'Empresa 7' },
    { value: 'empresa8', label: 'Empresa 8' }
  ];

  // Color presets
  const colorPresets = [
    { primary: '#3B82F6', secondary: '#F3F4F6', name: 'Azul Clásico' },
    { primary: '#10B981', secondary: '#F0FDF4', name: 'Verde Natura' },
    { primary: '#F59E0B', secondary: '#FFFBEB', name: 'Naranja Vibrante' },
    { primary: '#EF4444', secondary: '#FEF2F2', name: 'Rojo Energético' },
    { primary: '#8B5CF6', secondary: '#FAF5FF', name: 'Púrpura Moderno' },
    { primary: '#06B6D4', secondary: '#F0F9FF', name: 'Cian Profesional' },
    { primary: '#84CC16', secondary: '#F7FEE7', name: 'Lima Fresco' },
    { primary: '#F97316', secondary: '#FFF7ED', name: 'Naranja Cálido' }
  ];

  // FUNCIÓN PARA MANEJAR CAMBIOS EN EL TÍTULO CON VALIDACIÓN
  const handleTitleChange = (value) => {
    if (value.length <= 50) {
      onUpdateFormData('title', value);
    }
  };

  // FUNCIÓN PARA MANEJAR CAMBIOS EN LA DESCRIPCIÓN
  const handleDescriptionChange = (value) => {
    if (value.length <= 200) {
      onUpdateFormData('description', value);
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
            <Icon name="FileText" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Información Básica
            </h3>
            <p className="text-sm text-muted-foreground">
              Configura los detalles principales del formulario
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* INPUT DE TÍTULO CON VALIDACIÓN MEJORADA */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Título del Formulario <span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({formData?.title?.length || 0}/50 caracteres)
              </span>
            </label>
            <input
              type="text"
              placeholder="Ej: Evaluación de Desempeño Anual"
              value={formData?.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              maxLength={50}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${(formData?.title?.length || 0) >= 50
                  ? 'border-red-500 focus-visible:ring-red-200'
                  : 'border-input focus-visible:ring-blue-200'
                }`}
            />
            {(formData?.title?.length || 0) >= 50 && (
              <p className="text-red-500 text-xs">
                Límite de 50 caracteres alcanzado
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Este será el nombre visible del formulario
            </p>
          </div>

          {/* DESCRIPCIÓN DEL FORMULARIO */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Descripción del Formulario
              <span className="text-xs text-muted-foreground ml-2">
                ({formData?.description?.length || 0}/200 caracteres)
              </span>
            </label>
            <textarea
              placeholder="Ej: Formulario para evaluar el desempeño anual de los empleados"
              value={formData?.description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              maxLength={200}
              rows={3}
              className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${(formData?.description?.length || 0) >= 200
                  ? 'border-red-500 focus-visible:ring-red-200'
                  : 'border-input focus-visible:ring-blue-200'
                }`}
            />
            {(formData?.description?.length || 0) >= 200 && (
              <p className="text-red-500 text-xs">
                Límite de 200 caracteres alcanzado
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Breve descripción del propósito del formulario
            </p>
          </div>

          {/* CATEGORÍA */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Categoría <span className="text-destructive">*</span>
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData?.category}
              onChange={(e) => onUpdateFormData('category', e?.target?.value)}
            >
              <option value="">Selecciona una categoría</option>
              {categories?.map((category) => (
                <option key={category?.value} value={category?.value}>
                  {category?.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              Ayuda a organizar y filtrar los formularios
            </p>
          </div>

          {/* EMPRESA */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Empresas <span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({formData?.companies?.length || 0} seleccionadas)
              </span>
            </label>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-input rounded-md">
                {companyOptions?.map((company) => {
                  const isSelected = formData?.companies?.includes(company.value);
                  return (
                    <label
                      key={company.value}
                      className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${isSelected
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50 border border-transparent'
                        }`}
                    >
                      <input
                        type="checkbox"
                        value={company.value}
                        checked={isSelected || false}
                        onChange={(e) => {
                          const currentCompanies = formData?.companies || [];
                          let newCompanies;

                          if (e.target.checked) {
                            newCompanies = [...currentCompanies, company.value];
                          } else {
                            newCompanies = currentCompanies.filter(c => c !== company.value);
                          }

                          onUpdateFormData('companies', newCompanies);
                        }}
                        className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                      />
                      <span className="text-sm">{company.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Selecciona las empresas asociadas al formulario
            </p>
          </div>

          {/* TIEMPO ESTIMADO */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tiempo Estimado de Respuesta
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData?.responseTime}
              onChange={(e) => onUpdateFormData('responseTime', e?.target?.value)}
            >
              <option value="">Selecciona tiempo estimado</option>
              {timeOptions?.map((option) => (
                <option key={option?.value} value={option?.value}>
                  {option?.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              Tiempo promedio que tomará completar el formulario
            </p>
          </div>

          {/* SECCIÓN */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Sección <span className="text-destructive">*</span>
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData?.section}
              onChange={(e) => onUpdateFormData('section', e?.target?.value)}
            >
              <option value="">Selecciona una sección</option>
              {sections?.map((section) => (
                <option key={section?.value} value={section?.value}>
                  {section?.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              Define la sección en la que se verá el formulario
            </p>
          </div>

          {/* AUTOR */}
          <Input
            label="Autor"
            value={formData?.author}
            onChange={(e) => onUpdateFormData('author', e?.target?.value)}
            description="Nombre de quien creó el formulario"
            disabled
          />

        </div>
      </div>

      {/* Logo Selection - Minimalista */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-muted rounded-lg">
            <Icon name="Image" size={20} className="text-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Logo del Formulario
            </h3>
            <p className="text-sm text-muted-foreground">
              Selecciona un icono para identificar el formulario
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {logoOptions?.map((logo) => (
            <button
              key={logo.value}
              type="button"
              onClick={() => onUpdateFormData('logo', logo.value)}
              className={`flex flex-col items-center p-2 rounded-lg transition-all ${formData?.logo === logo.value
                  ? 'bg-primary/10 ring-2 ring-primary/50'
                  : 'hover:bg-muted/50'
                }`}
            >
              <div className={`${logo.color} p-2 rounded-full mb-1`}>
                <Icon name={logo.icon} size={16} className="text-white" />
              </div>
              <span className="text-xs text-center text-muted-foreground leading-tight">
                {logo.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Color Customization */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name="Palette" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Personalización de Colores
            </h3>
            <p className="text-sm text-muted-foreground">
              Define la apariencia visual del formulario
            </p>
          </div>
        </div>

        {/* Color Presets */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Esquemas Predefinidos</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {colorPresets?.map((preset, index) => (
              <button
                type="button"
                key={index}
                onClick={() => handleColorPresetSelect(preset)}
                className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${formData?.primaryColor === preset?.primary && formData?.secondaryColor === preset?.secondary
                    ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground'
                  }`}
                style={{
                  background: `linear-gradient(135deg, ${preset?.primary} 0%, ${preset?.secondary} 100%)`
                }}
              >
                <div className="text-xs font-medium text-white drop-shadow-sm">
                  {preset?.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Color Primario
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData?.primaryColor}
                onChange={(e) => onUpdateFormData('primaryColor', e?.target?.value)}
                className="w-12 h-10 rounded-md border border-input cursor-pointer"
              />
              <Input
                value={formData?.primaryColor}
                onChange={(e) => onUpdateFormData('primaryColor', e?.target?.value)}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Color principal para botones y elementos activos
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Color Secundario
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData?.secondaryColor}
                onChange={(e) => onUpdateFormData('secondaryColor', e?.target?.value)}
                className="w-12 h-10 rounded-md border border-input cursor-pointer"
              />
              <Input
                value={formData?.secondaryColor}
                onChange={(e) => onUpdateFormData('secondaryColor', e?.target?.value)}
                placeholder="#F3F4F6"
                className="flex-1"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Color de fondo y elementos secundarios
            </p>
          </div>
        </div>

        {/* Color Preview */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Vista Previa de Colores</h4>
          <div
            className="p-6 rounded-lg border border-border"
            style={{ backgroundColor: formData?.secondaryColor }}
          >
            <div className="space-y-4">
              <h5 className="font-semibold text-foreground">Ejemplo de Formulario</h5>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">
                    Campo de ejemplo
                  </label>
                  <input
                    type="text"
                    placeholder="Texto de ejemplo"
                    className="w-full px-3 py-2 border border-input rounded-md bg-white"
                    disabled
                  />
                </div>
                <button
                  type="button"
                  style={{ backgroundColor: formData?.primaryColor }}
                  className="px-4 py-2 text-white rounded-md font-medium"
                  disabled
                >
                  Botón Primario
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormProperties;