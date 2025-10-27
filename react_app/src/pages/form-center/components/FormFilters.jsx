import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const FormFilters = ({ onFiltersChange, className = '' }) => {
  const [filters, setFilters] = useState({
    status: [],
    priority: [],
    estimatedTime: [],
    documentsRequired: false,
    recentlyUsed: false
  });

  const filterOptions = {
    status: [
      { id: 'available', label: 'Available', count: 24 },
      { id: 'borrador', label: 'borrador', count: 3 },
      { id: 'submitted', label: 'Submitted', count: 8 }
    ],
    priority: [
      { id: 'high', label: 'High Priority', count: 5 },
      { id: 'medium', label: 'Medium Priority', count: 12 },
      { id: 'low', label: 'Low Priority', count: 18 }
    ],
    estimatedTime: [
      { id: 'quick', label: 'Quick (< 5 min)', count: 15 },
      { id: 'medium', label: 'Medium (5-15 min)', count: 12 },
      { id: 'long', label: 'Long (> 15 min)', count: 8 }
    ]
  };

  const handleFilterChange = (category, value, checked) => {
    const newFilters = { ...filters };
    
    if (category === 'documentsRequired' || category === 'recentlyUsed') {
      newFilters[category] = checked;
    } else {
      if (checked) {
        newFilters[category] = [...newFilters?.[category], value];
      } else {
        newFilters[category] = newFilters?.[category]?.filter(item => item !== value);
      }
    }
    
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      status: [],
      priority: [],
      estimatedTime: [],
      documentsRequired: false,
      recentlyUsed: false
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    return filters?.status?.length + 
           filters?.priority?.length + 
           filters?.estimatedTime?.length + 
           (filters?.documentsRequired ? 1 : 0) + 
           (filters?.recentlyUsed ? 1 : 0);
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-6 space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
          <Icon name="Filter" size={20} />
          <span>Filtros</span>
        </h3>
        {getActiveFilterCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            iconName="X"
            iconPosition="left"
            iconSize={14}
            className="text-muted-foreground hover:text-foreground"
          >
            Limpiar Filtros({getActiveFilterCount()})
          </Button>
        )}
      </div>
      {/* Status Filter */}
      <div className="space-y-3">
        <h4 className="font-medium text-foreground flex items-center space-x-2">
          <Icon name="CheckCircle" size={16} />
          <span>Estado</span>
        </h4>
        <div className="space-y-2">
          {filterOptions?.status?.map((option) => (
            <Checkbox
              key={option?.id}
              label={
                <div className="flex items-center justify-between w-full">
                  <span>{option?.label}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {option?.count}
                  </span>
                </div>
              }
              checked={filters?.status?.includes(option?.id)}
              onChange={(e) => handleFilterChange('status', option?.id, e?.target?.checked)}
            />
          ))}
        </div>
      </div>
      {/* Priority Filter */}
      <div className="space-y-3">
        <h4 className="font-medium text-foreground flex items-center space-x-2">
          <Icon name="AlertTriangle" size={16} />
          <span>Prioridad</span>
        </h4>
        <div className="space-y-2">
          {filterOptions?.priority?.map((option) => (
            <Checkbox
              key={option?.id}
              label={
                <div className="flex items-center justify-between w-full">
                  <span>{option?.label}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {option?.count}
                  </span>
                </div>
              }
              checked={filters?.priority?.includes(option?.id)}
              onChange={(e) => handleFilterChange('priority', option?.id, e?.target?.checked)}
            />
          ))}
        </div>
      </div>
      {/* Estimated Time Filter */}
      <div className="space-y-3">
        <h4 className="font-medium text-foreground flex items-center space-x-2">
          <Icon name="Clock" size={16} />
          <span>Tiempo de Respuesta</span>
        </h4>
        <div className="space-y-2">
          {filterOptions?.estimatedTime?.map((option) => (
            <Checkbox
              key={option?.id}
              label={
                <div className="flex items-center justify-between w-full">
                  <span>{option?.label}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {option?.count}
                  </span>
                </div>
              }
              checked={filters?.estimatedTime?.includes(option?.id)}
              onChange={(e) => handleFilterChange('estimatedTime', option?.id, e?.target?.checked)}
            />
          ))}
        </div>
      </div>
      {/* Additional Filters */}
      <div className="space-y-3 pt-3 border-t border-border">
        <h4 className="font-medium text-foreground flex items-center space-x-2">
          <Icon name="Settings" size={16} />
          <span>Opciones Adicionales</span>
        </h4>
        <div className="space-y-2">
          <Checkbox
            label="Requires Documents"
            description="Forms that need file attachments"
            checked={filters?.documentsRequired}
            onChange={(e) => handleFilterChange('documentsRequired', null, e?.target?.checked)}
          />
          <Checkbox
            label="Recently Used"
            description="Forms you've used in the last 30 days"
            checked={filters?.recentlyUsed}
            onChange={(e) => handleFilterChange('recentlyUsed', null, e?.target?.checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default FormFilters;