import React from 'react';
import Button from '../../../components/ui/Button';

const CategoryFilter = ({ categories, activeCategory, onCategoryChange, className = '' }) => {
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'all':
        return 'Grid3X3';
      case 'Remuneraciones':
        return 'Receipt';
      case 'Anexos':
        return 'Calendar';
      case 'Finiquitos':
        return 'CreditCard';
      case 'Otras':
        return 'FileText';
      default:
        return 'FileText';
    }
  };

  const getCategoryColor = (category, isActive) => {
    if (!isActive) return 'text-muted-foreground';
    
    switch (category) {
      case 'all':
        return 'text-primary';
      case 'Remuneraciones':
        return 'text-secondary';
      case 'Anexos':
        return 'text-accent';
      case 'Finiquitos':
        return 'text-success';
      case 'Otras':
        return 'text-warning';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {categories?.map((category) => {
        const isActive = activeCategory === category?.id;
        return (
          <Button
            key={category?.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(category?.id)}
            iconName={getCategoryIcon(category?.id)}
            iconPosition="left"
            iconSize={14}
            className={`${
              isActive ? 'shadow-brand' : 'hover:shadow-brand-hover'
            } transition-brand min-h-8 sm:min-h-9 text-xs sm:text-sm`}
          >
            {/* Texto del botón - RESPONSIVE */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span className={`${getCategoryColor(category?.id, isActive)} whitespace-nowrap`}>
                {category?.name}
              </span>
              {category?.count > 0 && (
                <span className={`px-1.5 sm:px-2 py-0.5 text-xs rounded-full ${
                  isActive 
                    ? 'bg-primary-foreground/20 text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                } whitespace-nowrap`}>
                  {category?.count}
                </span>
              )}
            </div>
          </Button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;