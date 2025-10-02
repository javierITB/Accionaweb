import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const SearchBar = ({ onSearch, onFilterToggle, showFilters, className = '' }) => {
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
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <div className="relative">
            <Icon 
              name="Search" 
              size={20} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
            />
            <Input
              type="search"
              placeholder="buscar forms por nombre, categoria o descripción..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 hover:bg-muted"
              >
                <Icon name="X" size={14} />
              </Button>
            )}
          </div>
          
          {showSuggestions && suggestions?.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-brand-hover z-50 animate-scale-in">
              <div className="py-2">
                {suggestions?.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-muted transition-brand flex items-center space-x-2"
                  >
                    <Icon name="Search" size={14} className="text-muted-foreground" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="default"
          onClick={onFilterToggle}
          iconName="Filter"
          iconPosition="left"
          iconSize={18}
          className="min-w-[100px]"
        >
          Filters
        </Button>
        
        <Button
          variant="outline"
          size="default"
          iconName="SortAsc"
          iconPosition="left"
          iconSize={18}
          className="hidden md:flex"
        >
          Sort
        </Button>
      </div>
      {searchQuery && (
        <div className="mt-2 text-sm text-muted-foreground">
          Searching for "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default SearchBar;