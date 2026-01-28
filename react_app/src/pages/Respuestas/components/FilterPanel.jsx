import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { apiFetch, API_BASE_URL } from '../../../utils/api';

const FilterPanel = ({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  onApplyFilters, 
  isVisible, 
  onToggle 
}) => {
  const [empresas, setEmpresas] = useState([]);
  const [filteredEmpresas, setFilteredEmpresas] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingEmpresas, setIsLoadingEmpresas] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        setIsLoadingEmpresas(true);
        const response = await apiFetch(`${API_BASE_URL}/auth/empresas/todas`);
        if (response.ok) {
          const data = await response.json();
          const nombres = data.map(e => e.nombre);
          setEmpresas(nombres);
          setFilteredEmpresas(nombres);
        }
      } catch (error) {
        console.error('Error cargando empresas:', error);
      } finally {
        setIsLoadingEmpresas(false);
      }
    };
    if (isVisible) fetchEmpresas();
  }, [isVisible]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formateador robusto para evitar desfases de zona horaria en los inputs tipo date
  const toISODateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleInputChange = (field, value) => {
    let newFilters = { ...filters, [field]: value };

    if (field === 'dateRange' && value !== '') {
      const ahora = new Date();
      let start = new Date();
      let end = new Date();
      
      // El límite superior siempre es el final del día de hoy
      end.setHours(23, 59, 59, 999);

      switch (value) {
        case 'today':
          // Lógica solicitada: 48 horas hacia atrás desde este momento
          // Esto captura registros de 1.99 días de antigüedad (visual "hace 1 día")
          start.setTime(ahora.getTime() - (48 * 60 * 60 * 1000));
          break;
        case 'week':
          // Últimos 7 días deslizantes
          start.setTime(ahora.getTime() - (7 * 24 * 60 * 60 * 1000));
          break;
        case 'month':
          // Últimos 30 días deslizantes
          start.setTime(ahora.getTime() - (30 * 24 * 60 * 60 * 1000));
          break;
        case 'quarter':
          // Últimos 90 días deslizantes
          start.setTime(ahora.getTime() - (90 * 24 * 60 * 60 * 1000));
          break;
        case 'year':
          // Últimos 365 días deslizantes
          start.setTime(ahora.getTime() - (365 * 24 * 60 * 60 * 1000));
          break;
        default:
          break;
      }

      newFilters.startDate = toISODateString(start);
      newFilters.endDate = toISODateString(end);
    }

    onFilterChange(newFilters);
    
    if (field === 'company') {
      const filtered = empresas.filter(emp => 
        emp.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredEmpresas(filtered);
      setShowDropdown(true);
    }
  };

  const selectEmpresa = (nombre) => {
    handleInputChange('company', nombre);
    setShowDropdown(false);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters)?.filter(v => v && v.toString().trim() !== '').length;
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-visible">
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Icon name="Filter" size={20} className="text-accent" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Filtros</h3>
          {getActiveFilterCount() > 0 && (
            <span className="flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold bg-accent text-accent-foreground">
              {getActiveFilterCount()}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {getActiveFilterCount() > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground hover:text-destructive transition-colors">
              Limpiar filtros
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onToggle} iconName={isVisible ? "ChevronUp" : "ChevronDown"} className="rounded-full" />
        </div>
      </div>

      {isVisible && (
        <div className="p-5 space-y-6">
          <Input
            label="Buscar Solicitudes"
            placeholder="Buscar por Id, título, empresa o usuario..."
            value={filters?.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
            className="w-full bg-background"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select 
              label="Período" 
              options={[
                { value: '', label: 'Cualquier Fecha' },
                { value: 'today', label: 'Hoy' },
                { value: 'week', label: 'Esta Semana' },
                { value: 'month', label: 'Este Mes' },
                { value: 'quarter', label: 'Este Trimestre' },
                { value: 'year', label: 'Este Año' },
              ]} 
              value={filters?.dateRange || ''} 
              onChange={(value) => handleInputChange('dateRange', value)} 
            />
            <Input 
              label="Fecha Desde"
              type="date"
              value={filters?.startDate || ''}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="bg-background"
            />
            <Input 
              label="Fecha Hasta"
              type="date"
              value={filters?.endDate || ''}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative" ref={dropdownRef}>
              <Input 
                label="Empresa"
                placeholder={isLoadingEmpresas ? "Cargando..." : "Escribe para buscar..."}
                value={filters?.company || ''}
                onChange={(e) => handleInputChange('company', e.target.value)}
                onFocus={() => setShowDropdown(true)}
                disabled={isLoadingEmpresas}
                className="w-full bg-background"
              />
              
              {showDropdown && filteredEmpresas.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {filteredEmpresas.map((nombre, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectEmpresa(nombre)}
                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border/10 last:border-none"
                    >
                      {nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <Input 
              label="Enviado por" 
              placeholder="Nombre del usuario..." 
              value={filters?.submittedBy || ''} 
              onChange={(e) => handleInputChange('submittedBy', e.target.value)} 
              className="bg-background"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="default"
              onClick={onApplyFilters}
              iconName="Search"
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-10 w-full md:w-auto font-bold rounded-lg shadow-md transition-all active:scale-95"
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