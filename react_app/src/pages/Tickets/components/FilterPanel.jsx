import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const FilterPanel = ({
  filters,
  onFilterChange,
  onClearFilters,
  isVisible,
  onToggle
}) => {
  // Opciones de estado basadas en los estados reales del sistema
  const statusOptions = [
    { value: '', label: 'Todos los Estados' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_revision', label: 'En Revisión' },
    { value: 'aprobado', label: 'Aprobado' },
    { value: 'firmado', label: 'Firmado' },
    { value: 'finalizado', label: 'finalizado' },
    { value: 'archivado', label: 'archivado' },
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
    <div className="bg-card border border-border rounded-lg">
      {/* Filter Header - RESPONSIVE */}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              iconName="X"
              iconPosition="left"
              iconSize={14}
              className="text-xs sm:text-sm"
            >
              Limpiar
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            iconName={isVisible ? "ChevronUp" : "ChevronDown"}
            iconSize={16}
            className="w-8 h-8 sm:w-9 sm:h-9"
          />
        </div>
      </div>

      {/* Filter Content - RESPONSIVE */}
      {isVisible && (
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Search */}
          <div>
            <Input
              label="Buscar Solicitudes"
              type="search"
              placeholder="Buscar por título, empresa o usuario..."
              value={filters?.search || ''}
              onChange={(e) => handleInputChange('search', e?.target?.value)}
              className="w-full"
            />
          </div>

          {/* Filter Grid - RESPONSIVE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Select
              label="Estado"
              options={statusOptions}
              value={filters?.status || ''}
              onChange={(value) => handleInputChange('status', value)}
            />

            <Select
              label="Período"
              options={dateRangeOptions}
              value={filters?.dateRange || ''}
              onChange={(value) => handleInputChange('dateRange', value)}
            />
          </div>

          {/* Date Range Inputs - RESPONSIVE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Fecha Desde"
              type="date"
              value={filters?.startDate || ''}
              onChange={(e) => handleInputChange('startDate', e?.target?.value)}
            />

            <Input
              label="Fecha Hasta"
              type="date"
              value={filters?.endDate || ''}
              onChange={(e) => handleInputChange('endDate', e?.target?.value)}
            />
          </div>

          {/* Advanced Filters - RESPONSIVE */}
          <div className="pt-3 sm:pt-4 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label="Empresa"
                type="text"
                placeholder="Filtrar por empresa..."
                value={filters?.company || ''}
                onChange={(e) => handleInputChange('company', e?.target?.value)}
              />

              <Input
                label="Enviado por"
                type="text"
                placeholder="Nombre del usuario..."
                value={filters?.submittedBy || ''}
                onChange={(e) => handleInputChange('submittedBy', e?.target?.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;