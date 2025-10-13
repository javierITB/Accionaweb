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

  // Función para truncar texto manualmente como fallback
  const truncateText = (text, maxLength = 30) => {
    if (!text) return '';
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  // ✅ CORREGIDO: Función simplificada sin mapeo estático
  const getIconInfo = () => {
    return {
      icon: form?.icon || 'FileText', // ✅ Usa directamente form?.icon
      color: form?.primaryColor || '#3B82F6' // ✅ Usa el color real del formulario
    };
  };

  const iconInfo = getIconInfo();

  return (
    <div className={`bg-card border border-border rounded-lg p-6 hover:shadow-brand-hover transition-brand group ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* ✅ ICONO CON COLOR DINÁMICO */}
          <div
            className="p-2 rounded-lg flex-shrink-0"
            style={{
              backgroundColor: iconInfo.color // ← Color dinámico del formulario
            }}
          >
            <Icon
              name={iconInfo.icon} // ← Icono dinámico del formulario
              size={20}
              className="text-white"
            />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <h3
              className="font-semibold text-foreground group-hover:text-primary transition-brand truncate overflow-hidden whitespace-nowrap text-ellipsis"
              title={form?.title}
            >
              {truncateText(form?.title, 30)}
            </h3>
            <p className="text-sm text-muted-foreground truncate overflow-hidden whitespace-nowrap text-ellipsis">
              {form?.category}
            </p>
          </div>
        </div>

        {form?.priority && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full border flex-shrink-0 ml-2 ${getPriorityColor(form?.priority)}`}>
            {form?.priority}
          </span>
        )}
      </div>

      {/* DESCRIPCIÓN */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {form?.description}
      </p>

      {/* SECCIÓN: EMPRESAS - MEJORADA */}
      {form?.companies && form.companies.length > 0 && (
        <div className="mb-4">
          <span className="text-xs text-muted-foreground">
            {form.companies.slice(0, 3).map((companyValue, index, array) => {
              // Conversión segura
              let companyName = 'Empresa';
              if (companyValue && typeof companyValue === 'string') {
                companyName = companyValue.replace('empresa', 'Empresa ');
              }

              return (
                <span key={companyValue || index}>
                  {companyName}
                  {index < array.length - 1 ? ', ' : ''}
                </span>
              );
            })}
            {form.companies.length > 3 && (
              <span> ... +{form.companies.length - 3}</span>
            )}
          </span>
        </div>
      )}

      {/* ... (el resto del código permanece igual) ... */}
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
          Last modified: {form?.lastModified}
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