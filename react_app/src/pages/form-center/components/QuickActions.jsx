import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActions = ({ onActionSelect, className = '' }) => {
  const quickActions = [
    {
      id: 'timeoff-request',
      title: 'Time Off Request',
      description: 'Submit vacation, sick leave, or personal time requests',
      icon: 'Calendar',
      color: 'primary',
      estimatedTime: '3 min',
      popular: true
    },
    {
      id: 'expense-report',
      title: 'Expense Report',
      description: 'Submit business expenses for reimbursement',
      icon: 'Receipt',
      color: 'secondary',
      estimatedTime: '5 min',
      popular: true
    },
    {
      id: 'it-support',
      title: 'IT Support Request',
      description: 'Request technical assistance or equipment',
      icon: 'Monitor',
      color: 'accent',
      estimatedTime: '2 min',
      popular: false
    },
    {
      id: 'document-request',
      title: 'Document Request',
      description: 'Request employment certificates or references',
      icon: 'FileText',
      color: 'success',
      estimatedTime: '1 min',
      popular: true
    }
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'primary':
        return 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20';
      case 'secondary':
        return 'bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20';
      case 'accent':
        return 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20';
      case 'success':
        return 'bg-success/10 text-success border-success/20 hover:bg-success/20';
      default:
        return 'bg-muted text-muted-foreground border-border hover:bg-muted/80';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
        <span className="text-sm text-muted-foreground">Most frequently used forms</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions?.map((action) => (
          <div
            key={action?.id}
            className={`relative p-4 rounded-lg border cursor-pointer transition-brand group ${getColorClasses(action?.color)}`}
            onClick={() => onActionSelect(action)}
          >
            {action?.popular && (
              <div className="absolute -top-2 -right-2 bg-warning text-warning-foreground text-xs font-medium px-2 py-1 rounded-full">
                Popular
              </div>
            )}
            
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-2 rounded-lg ${getColorClasses(action?.color)?.replace('hover:', '')}`}>
                <Icon name={action?.icon} size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground group-hover:text-primary transition-brand">
                  {action?.title}
                </h4>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Icon name="Clock" size={12} />
                  <span>{action?.estimatedTime}</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {action?.description}
            </p>
            
            <Button
              variant="ghost"
              size="sm"
              iconName="ArrowRight"
              iconPosition="right"
              iconSize={14}
              className="w-full justify-between group-hover:bg-background/50"
            >
              Start Form
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;