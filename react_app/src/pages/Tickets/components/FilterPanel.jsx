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
  onToggle,
  ticketConfigs = []
}) => {

  // 1. DYNAMIC STATUS OPTIONS
  const statusOptions = React.useMemo(() => {
    const uniqueStatuses = new Map();

    // Default 'Todos'
    const options = [{ value: '', label: 'Todos los Estados' }];

    ticketConfigs.forEach(config => {
      if (config.statuses) {
        config.statuses.forEach(s => {
          if (!uniqueStatuses.has(s.value)) {
            uniqueStatuses.set(s.value, s.label);
          }
        });
      }
    });

    if (!uniqueStatuses.has('archivado')) {
      uniqueStatuses.set('archivado', 'Archivado');
    }

    uniqueStatuses.forEach((label, value) => {
      options.push({ value, label });
    });

    return options;
  }, [ticketConfigs]);


  // 2. DYNAMIC CATEGORY OPTIONS
  const categoryOptions = React.useMemo(() => {
    const options = [{ value: '', label: 'Todas las Categorías' }];

    ticketConfigs.forEach(config => {
      const val = config.id || config.category || config.name;
      if (val) {
        options.push({ value: val, label: config.title || config.name || val });
      }
    });

    return options;
  }, [ticketConfigs]);


  const dateRangeOptions = [
    { value: '', label: 'Cualquier Fecha' },
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mes' },
    { value: 'quarter', label: 'Este Trimestre' },
    { value: 'year', label: 'Este Año' }
  ];

  const handleInputChange = (field, value) => {
    let newFilters = { ...filters, [field]: value };

    if (field === 'dateRange') {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayString = `${yyyy}-${mm}-${dd}`;

      let start = '';
      let end = todayString;

      if (value === 'today') {
        start = todayString;
      } else if (value === 'week') {
        const d = new Date(today);
        const day = d.getDay() || 7; // Lunes=1, Dom=7
        if (day !== 1) d.setHours(-24 * (day - 1));
        const smm = String(d.getMonth() + 1).padStart(2, '0');
        const sdd = String(d.getDate()).padStart(2, '0');
        start = `${d.getFullYear()}-${smm}-${sdd}`;
      } else if (value === 'month') {
        start = `${yyyy}-${mm}-01`;
      } else if (value === 'quarter') {
        const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
        const qmm = String(quarterMonth + 1).padStart(2, '0');
        start = `${yyyy}-${qmm}-01`;
      } else if (value === 'year') {
        start = `${yyyy}-01-01`;
      } else {
        start = '';
        end = '';
      }
      newFilters.startDate = start;
      newFilters.endDate = end;
    }

    onFilterChange(newFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters)?.filter(value => value && value?.toString()?.trim() !== '')?.length;
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Filter Header */}
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

      {/* Filter Content */}
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

          {/* Filter Grid: STATUS & CATEGORY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
              label="Período"
              options={dateRangeOptions}
              value={filters?.dateRange || ''}
              onChange={(value) => handleInputChange('dateRange', value)}
            />
          </div>

          {/* Date Range Inputs */}
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


          {/* BOTÓN FILTRAR */}
          <div className="flex justify-end pt-4">
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