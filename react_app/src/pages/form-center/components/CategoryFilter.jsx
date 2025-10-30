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
      case 'otros':
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
      case 'benefits':
        return 'text-error';
      case 'otros':
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
            iconSize={16}
            className={`${isActive ? 'shadow-brand' : 'hover:shadow-brand-hover'} transition-brand`}
          >
            <span className={getCategoryColor(category?.id, isActive) + 'text-primary'}>
              {category?.name}
            </span>
            {category?.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                isActive 
                  ? 'bg-primary-foreground/20 text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {category?.count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;