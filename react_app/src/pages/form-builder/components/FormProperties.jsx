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
          <Input
            label="Título del Formulario"
            placeholder="Ej: Evaluación de Desempeño Anual"
            value={formData?.title}
            onChange={(e) => onUpdateFormData('title', e?.target?.value)}
            required
            description="Este será el nombre visible del formulario"
          />

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
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Seccion <span className="text-destructive">*</span>
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
              Define la seccion en la que se verá el formulario
            </p>
          </div>

          <Input
            label="Autor"
            value={formData?.author}
            onChange={(e) => onUpdateFormData('author', e?.target?.value)}
            description="Nombre de quien creó el formulario"
            disabled
          />

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
                className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                  formData?.primaryColor === preset?.primary && formData?.secondaryColor === preset?.secondary
                    ? 'border-primary ring-2 ring-primary/20' :'border-border hover:border-muted-foreground'
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