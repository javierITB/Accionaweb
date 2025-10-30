import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';


const FormCard = ({ form, onSelect, className = '' }) => {

  const getStatusColor = (status) => {
    switch (status) {
      case 'borrador':
        return 'text-primary';
      case 'publicado':
        return 'text-success';
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
    <div className={`bg-card border border-border rounded-lg p-4 hover:shadow-brand-hover transition-brand group ${className}`}>
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
              {form?.category}, modificado: {form?.lastModified}
            </p>
          </div>
        </div>

        {form?.status && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full border flex-shrink-0 ml-2 ${getStatusColor(form?.status)}`}>
            {form?.status}
          </span>
        )}
      </div>

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
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Icon name="Clock" size={14} />
            <span>{form?.estimatedTime}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="FileText" size={14} />
            <span>{form?.fields} Preguntas</span>
          </div>
          {form?.documentsRequired && (
            <div className="flex items-center space-x-1">
              <Icon name="Paperclip" size={14} />
              <span>Docs required</span>
            </div>
          )}
        </div>

        <Button
          variant={form?.status === 'borrador' ? 'outline' : 'default'}
          size="sm"
          onClick={() => window.location.href = `/form-builder?id=${form?.id}`}
          iconName={form?.status === 'borrador' ? 'Edit' : 'ArrowRight'}
          iconPosition="right"
          iconSize={16}
        >
          {form?.status === 'borrador' ? 'Continuar' : 'Editar'}
        </Button>
      </div>
    </div>
  );
};

export default FormCard;