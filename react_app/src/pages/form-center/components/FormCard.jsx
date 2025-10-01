import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FormCard = ({ form, onSelect, className = '' }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-error bg-error/10 border-error/20';
      case 'medium':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'low':
        return 'text-success bg-success/10 border-success/20';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'text-success';
      case 'draft':
        return 'text-warning';
      case 'submitted':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-6 hover:shadow-brand-hover transition-brand group ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${form?.category === 'timeoff' ? 'bg-primary/10' : 
            form?.category === 'expense' ? 'bg-secondary/10' : 
            form?.category === 'hr' ? 'bg-accent/10' : 'bg-muted'}`}>
            <Icon 
              name={form?.icon} 
              size={20} 
              className={form?.category === 'timeoff' ? 'text-primary' : 
                form?.category === 'expense' ? 'text-secondary' : 
                form?.category === 'hr' ? 'text-accent' : 'text-muted-foreground'}
            />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-brand">
              {form?.title}
            </h3>
            <p className="text-sm text-muted-foreground">{form?.category}, Fecha Creación: {form?.createdAt}</p>
          </div>
        </div>
        
        {form?.priority && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(form?.priority)}`}>
            {form?.priority}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {form?.description}
      </p>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Icon name="Clock" size={14} />
            <span>{form?.estimatedTime}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="FileText" size={14} />
            <span>{form?.fields} fields</span>
          </div>
          {form?.documentsRequired && (
            <div className="flex items-center space-x-1">
              <Icon name="Paperclip" size={14} />
              <span>Docs required</span>
            </div>
          )}
        </div>
        
        <div className={`flex items-center space-x-1 text-xs font-medium ${getStatusColor(form?.status)}`}>
          <Icon 
            name={form?.status === 'available' ? 'CheckCircle' : 
              form?.status === 'draft' ? 'Edit' : 'Send'} 
            size={14} 
          />
          <span className="capitalize">{form?.status}</span>
        </div>
      </div>
      {form?.lastModified && (
        <div className="text-xs text-muted-foreground mb-4">
          Ultima modificación: {form?.lastModified}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {form?.tags?.slice(0, 2)?.map((tag, index) => (
            <span key={index} className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
              {tag}
            </span>
          ))}
          {form?.tags?.length > 2 && (
            <span className="text-xs text-muted-foreground">+{form?.tags?.length - 2} more</span>
          )}
        </div>
        
        <Button
          variant={form?.status === 'draft' ? 'outline' : 'default'}
          size="sm"
          onClick={() => window.location.href = `/form-builder?id=${form?.id}`}
          iconName={form?.status === 'draft' ? 'Edit' : 'ArrowRight'}
          iconPosition="right"
          iconSize={16}
        >
          {form?.status === 'draft' ? 'Continuar' : 'Editar'}
        </Button>
      </div>
    </div>
  );
};

export default FormCard;