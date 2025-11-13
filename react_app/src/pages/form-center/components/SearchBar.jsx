import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const SearchBar = ({ onSearch, className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchSuggestions = [
    'Time off request',
    'Expense report',
    'Salary certificate',
    'IT support',
    'Training request',
    'Benefits enrollment',
    'Document request',
    'Performance review'
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
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="relative flex-1">
          <div className="relative">
            <Icon 
              name="Search" 
              size={18} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground sm:w-5 sm:h-5" 
            />
            <Input
              type="search"
              placeholder="Buscar forms por nombre, categoría o descripción..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 sm:pl-10 pr-8 sm:pr-10 text-sm sm:text-base"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 hover:bg-muted"
              >
                <Icon name="X" size={12} className="sm:w-3.5 sm:h-3.5" />
              </Button>
            )}
          </div>
          
          {/* Suggestions Dropdown - RESPONSIVE */}
          {showSuggestions && suggestions?.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-brand-hover z-50 animate-scale-in max-h-48 sm:max-h-56 overflow-y-auto">
              <div className="py-1 sm:py-2">
                {suggestions?.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm text-popover-foreground hover:bg-muted transition-brand flex items-center space-x-2"
                  >
                    <Icon name="Search" size={12} className="text-muted-foreground flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Search Status - RESPONSIVE */}
      {searchQuery && (
        <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
          Buscando: "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default SearchBar;