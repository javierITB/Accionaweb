import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const FilterPanel = ({
  filters,
  onFilterChange,
  onClearFilters,
  onApplyFilters,
  isVisible,
  onToggle
}) => {
  const statusOptions = [
    { value: '', label: 'Todos los Estados' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'documento_generado', label: 'Documento Generado' },
    { value: 'documento_enviado', label: 'Documento Enviado' },
    { value: 'solicitud_firmada', label: 'Solicitud Firmada' },
    { value: 'informado_sii', label: 'Informado al SII' },
    { value: 'dicom', label: 'DICOM' },
    { value: 'dado_de_baja', label: 'Dado de baja' }
  ];

  const dateRangeOptions = [
    { value: '', label: 'Cualquier Fecha' },
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mes' },
    { value: 'quarter', label: 'Este Trimestre' },
    { value: 'year', label: 'Este Año' }
  ];

  const handleInputChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters)?.filter(value => value && value?.toString()?.trim() !== '')?.length;
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={18} className="text-accent sm:w-5 sm:h-5" />
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Filtros</h3>
          {getActiveFilterCount() > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
              {getActiveFilterCount()}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {getActiveFilterCount() > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} iconName="X" iconPosition="left" iconSize={14} className="text-xs sm:text-sm">
              Limpiar
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onToggle} iconName={isVisible ? "ChevronUp" : "ChevronDown"} iconSize={16} className="w-8 h-8 sm:w-9 sm:h-9" />
        </div>
      </div>

      {isVisible && (
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div>
            <Input
              label="Buscar Solicitudes"
              type="search"
              placeholder="Buscar por nombre, razón social o rut..."
              value={filters?.search || ''}
              onChange={(e) => handleInputChange('search', e?.target?.value)}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Select label="Estado" options={statusOptions} value={filters?.status || ''} onChange={(value) => handleInputChange('status', value)} />
            <Select label="Período" options={dateRangeOptions} value={filters?.dateRange || ''} onChange={(value) => handleInputChange('dateRange', value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input label="Fecha Desde" type="date" value={filters?.startDate || ''} onChange={(e) => handleInputChange('startDate', e?.target?.value)} />
            <Input label="Fecha Hasta" type="date" value={filters?.endDate || ''} onChange={(e) => handleInputChange('endDate', e?.target?.value)} />
          </div>

          <div className="pt-3 sm:pt-4 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input 
                label="RUT EMPRESA" 
                type="text" 
                placeholder="Ej: 77.123.456-k" 
                value={filters?.company || ''} 
                onChange={(e) => handleInputChange('company', e?.target?.value)} 
              />
              <Input 
                label="ENVIADO POR" 
                type="text" 
                placeholder="Nombre del solicitante..." 
                value={filters?.submittedBy || ''} 
                onChange={(e) => handleInputChange('submittedBy', e?.target?.value)} 
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="default"
              onClick={onApplyFilters}
              iconName="Search"
              className="bg-accent text-accent-foreground px-8 w-full sm:w-auto font-bold shadow-sm"
            >
              Filtrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;