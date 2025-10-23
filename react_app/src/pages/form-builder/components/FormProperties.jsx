import React, { useState, useRef, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

// Componente de selección múltiple personalizado CON SCROLLBAR
const CustomMultiSelect = ({ options, value = [], onChange, placeholder = "Selecciona opciones..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabels = value.map(val => {
    const option = options.find(opt => opt.value === val);
    return option ? option.label : '';
  }).filter(label => label);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input que muestra las opciones seleccionadas */}
      <div
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedLabels.length > 0 ? (
            selectedLabels.map((label, index) => (
              <span
                key={index}
                className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded"
              >
                {label}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <Icon
          name={isOpen ? "ChevronUp" : "ChevronDown"}
          size={16}
          className="text-muted-foreground ml-2"
        />
      </div>

      {/* Dropdown CON SCROLLBAR MEJORADO */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Barra de búsqueda */}
          <div className="p-2 border-b border-input">
            <input
              type="text"
              placeholder="Buscar empresas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Lista de opciones CON SCROLLBAR ESTILIZADO */}
          <div className="py-1 max-h-48 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => toggleOption(option.value)}
                >
                  <input
                    type="checkbox"
                    checked={value.includes(option.value)}
                    onChange={() => { }}
                    className="w-4 h-4 text-primary rounded focus:ring-primary border-input"
                  />
                  <span className="ml-2 text-sm text-foreground">
                    {option.label}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                No se encontraron empresas
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FormProperties = ({ formData, categories, sections, onUpdateFormData }) => {
  const [companyOptions, setCompanyOptions] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Cargar empresas desde MongoDB
  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        setLoadingCompanies(true);

        let response;

        // Intentar con URL absoluta primero
        try {
          response = await fetch('https://accionaweb.vercel.app/api/auth/empresas/todas');
        } catch (error) {
          // Si falla, intentar con URL relativa
          response = await fetch('/api/auth/empresas/todas');
        }

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const empresasData = await response.json();

        const options = empresasData.map(empresa => ({
          value: empresa._id || empresa.id,
          label: empresa.nombre
        }));

        setCompanyOptions(options);
      } catch (error) {
        console.error('Error cargando empresas:', error);

        // Fallback más informativo
        const fallbackOptions = [
          { value: 'fallback1', label: 'No se pudieron cargar las empresas' },
          { value: 'fallback2', label: 'Recarga la página para intentar nuevamente' }
        ];
        setCompanyOptions(fallbackOptions);
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchEmpresas();
  }, []);

  // Time options for response time
  const timeOptions = [
    { value: '1-2', label: '1-2 minutos' },
    { value: '3-5', label: '3-5 minutos' },
    { value: '5-10', label: '5-10 minutos' },
    { value: '10-15', label: '10-15 minutos' },
    { value: '15-30', label: '15-30 minutos' },
    { value: '30+', label: 'Más de 30 minutos' }
  ];

  // Icono options - SOLO usa primaryColor, sin colores individuales
  const IconoOptions = [
    {
      value: 'FileText',
      label: 'Contrato de trabajo',
      icon: 'FileText'
    },
    {
      value: 'Briefcase',
      label: 'Contrato trabajo por obra',
      icon: 'Briefcase'
    },
    {
      value: 'Receipt',
      label: 'Sueldo empresarial',
      icon: 'Receipt'
    },
    {
      value: 'DollarSign',
      label: 'Permiso sin goce de sueldo',
      icon: 'DollarSign'
    },
    {
      value: 'Clock',
      label: 'Certificado de Vigencia',
      icon: 'Clock'
    },
    {
      value: 'MessageCircle',
      label: 'Certificado de Antigüedad',
      icon: 'MessageCircle'
    },
    {
      value: 'Edit',
      label: 'Certificado Licencias Médicas',
      icon: 'Edit'
    },
    {
      value: 'Calendar',
      label: 'Solicitud de vacaciones',
      icon: 'Calendar'
    }
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

  // FUNCIÓN PARA MANEJAR MULTISELECT DE EMPRESAS
  const handleCompanyChange = (selectedValues) => {
    onUpdateFormData('companies', selectedValues);
  };

  const handleColorPresetSelect = (preset) => {
    onUpdateFormData('primaryColor', preset.primary);
    onUpdateFormData('secondaryColor', preset.secondary);
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tiempo Estimado de Respuesta
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData?.responseTime}
              onChange={(e) => onUpdateFormData('responseTime', e.target.value)}
            >
              <option value="">Selecciona tiempo estimado</option>
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              Tiempo promedio que tomará completar el formulario
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Sección <span className="text-destructive">*</span>
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData?.section}
              onChange={(e) => onUpdateFormData('section', e.target.value)}
            >
              <option value="">Selecciona una sección</option>
              {sections.map((section) => (
                <option key={section.value} value={section.value}>
                  {section.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              Define la sección en la que se verá el formulario
            </p>
          </div>

          <Input
            label="Autor"
            value={formData?.author}
            onChange={(e) => onUpdateFormData('author', e.target.value)}
            description="Nombre de quien creó el formulario"
            disabled
          />

          {/* CATEGORÍA - MOVIDA ABAJO, DESPUÉS DEL AUTOR */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Categoría <span className="text-destructive">*</span>
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData?.category}
              onChange={(e) => onUpdateFormData('category', e.target.value)}
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              Define la categoría del formulario
            </p>
          </div>

          {/* EMPRESAS - CON DATOS DESDE MONGODB */}
          <div className="space-y-2 md:col-span-1">
            <label className="text-sm font-medium text-foreground">
              Empresa/s <span className="text-destructive">*</span>
            </label>

            {loadingCompanies ? (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Icon name="Loader" size={16} className="animate-spin" />
                <span>Cargando empresas...</span>
              </div>
            ) : (
              <CustomMultiSelect
                options={companyOptions}
                value={formData?.companies || []}
                onChange={handleCompanyChange}
                placeholder="Selecciona las empresas destino..."
              />
            )}

            <p className="text-sm text-muted-foreground">
              Selecciona las empresas que podrán ver este formulario
            </p>

            {(formData?.companies || []).length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">
                  Empresas seleccionadas: {(formData?.companies || []).length}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Icono Selection - SOLO USA PRIMARY COLOR */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-muted rounded-lg">
            <Icon name="Image" size={20} className="text-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Icono del Formulario
            </h3>
            <p className="text-sm text-muted-foreground">
              Selecciona un icono para identificar el formulario
            </p>
          </div>
        </div>

        {/* TODOS LOS ICONOS USAN SOLO EL PRIMARY COLOR */}
        <div className="flex flex-wrap justify-center gap-3">
          {IconoOptions.map((Icono) => (
            <button
              key={Icono.value}
              type="button"
              onClick={() => onUpdateFormData('icon', Icono.value)}
              className={`p-4 rounded-full transition-all transform hover:scale-110 hover:shadow-lg ${formData?.icon === Icono.value
                ? 'ring-4 ring-primary/50 shadow-lg scale-110'
                : 'shadow-md opacity-70 hover:opacity-100'
                }`}
              style={{
                backgroundColor: formData?.primaryColor || '#3B82F6',
                color: 'white'
              }}
              title={Icono.label}
            >
              <Icon name={Icono.icon} size={24} className="text-white" />
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
            {colorPresets.map((preset, index) => (
              <button
                type="button"
                key={index}
                onClick={() => handleColorPresetSelect(preset)}
                className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${formData?.primaryColor === preset.primary && formData?.secondaryColor === preset.secondary
                  ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground'
                  }`}
                style={{
                  background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`
                }}
              >
                <div className="text-xs font-medium text-white drop-shadow-sm">
                  {preset.name}
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
                onChange={(e) => onUpdateFormData('primaryColor', e.target.value)}
                className="w-12 h-10 rounded-md border border-input cursor-pointer"
              />
              <Input
                value={formData?.primaryColor}
                onChange={(e) => onUpdateFormData('primaryColor', e.target.value)}
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
                onChange={(e) => onUpdateFormData('secondaryColor', e.target.value)}
                className="w-12 h-10 rounded-md border border-input cursor-pointer"
              />
              <Input
                value={formData?.secondaryColor}
                onChange={(e) => onUpdateFormData('secondaryColor', e.target.value)}
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

      {/* Estilos para el scrollbar personalizado */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

export default FormProperties;