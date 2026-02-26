import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom'; // Importar necesario

const SearchBar = ({ onSearch, className = '', permisos }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate(); // Inicializar

  const searchSuggestions = [
    'Time off request', 'Expense report', 'Salary certificate',
    'IT support', 'Training request', 'Benefits enrollment',
    'Document request', 'Performance review'
  ];

  const handleSearchChange = (e) => {
    const value = e?.target?.value;
    setSearchQuery(value);

    if (value?.length > 0) {
      const filtered = searchSuggestions?.filter(suggestion =>
        suggestion?.toLowerCase()?.includes(value?.toLowerCase())
      );
      setSuggestions(filtered?.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
    onSearch(value);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    onSearch('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Contenedor Flex para alinear Barra + Botón */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative flex-1">
          <div className="relative">
            <Icon
              name="Search"
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="Buscar forms..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-10 h-11"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Icon name="X" size={16} />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions?.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted flex items-center gap-2"
                >
                  <Icon name="Search" size={14} className="text-muted-foreground" />
                  <span className="truncate">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* BOTÓN UBICADO JUNTO A LA BARRA */}
        {permisos?.create_formularios && (
          <Button 
            variant="default" 
            className="whitespace-nowrap h-11 shadow-sm"
            iconName="Plus" 
            onClick={() => navigate("/form-builder")}
          >
            <span className="hidden sm:inline">Nuevo Formulario</span>
          </Button>
        )}
      </div>

      {searchQuery && (
        <div className="mt-2 text-xs text-muted-foreground px-1">
          Mostrando resultados para: <span className="font-medium text-foreground">"{searchQuery}"</span>
        </div>
      )}
    </div>
  );
};

export default SearchBar;