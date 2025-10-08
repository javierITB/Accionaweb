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
  const statusOptions = [
    { value: '', label: 'Todos los Estados' },
    { value: 'draft', label: 'Borrador' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'in_review', label: 'En Revisión' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'rejected', label: 'Rechazado' }
  ];

  const categoryOptions = [
    { value: '', label: 'Todas las Categorías' },
    { value: 'time_off', label: 'Tiempo Libre' },
    { value: 'expense', label: 'Gastos' },
    { value: 'it_support', label: 'Soporte TI' },
    { value: 'hr_general', label: 'RR.HH. General' },
    { value: 'payroll', label: 'Nómina' },
    { value: 'benefits', label: 'Beneficios' }
  ];

  const priorityOptions = [
    { value: '', label: 'Todas las Prioridades' },
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Media' },
    { value: 'low', label: 'Baja' }
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
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={20} className="text-accent" />
          <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
          {getActiveFilterCount() > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
              {getActiveFilterCount()}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              iconName="X"
              iconPosition="left"
              iconSize={16}
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
          />
        </div>
      </div>
      {/* Filter Content */}
      {isVisible && (
        <div className="p-4 space-y-4">
          {/* Search */}
          <div>
            <Input
              label="Buscar Solicitudes"
              type="search"
              placeholder="Buscar por título, descripción o ID..."
              value={filters?.search || ''}
              onChange={(e) => handleInputChange('search', e?.target?.value)}
              className="w-full"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Estado"
              options={statusOptions}
              value={filters?.status || ''}
              onChange={(value) => handleInputChange('status', value)}
            />

            <Select
              label="Categoría"
              options={categoryOptions}
              value={filters?.category || ''}
              onChange={(value) => handleInputChange('category', value)}
            />

            <Select
              label="Prioridad"
              options={priorityOptions}
              value={filters?.priority || ''}
              onChange={(value) => handleInputChange('priority', value)}
            />

            <Select
              label="Período"
              options={dateRangeOptions}
              value={filters?.dateRange || ''}
              onChange={(value) => handleInputChange('dateRange', value)}
            />
          </div>

          {/* Date Range Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Advanced Filters */}
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Asignado a"
                type="text"
                placeholder="Nombre del asignado..."
                value={filters?.assignedTo || ''}
                onChange={(e) => handleInputChange('assignedTo', e?.target?.value)}
              />

              <Input
                label="Enviado por"
                type="text"
                placeholder="Nombre del remitente..."
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