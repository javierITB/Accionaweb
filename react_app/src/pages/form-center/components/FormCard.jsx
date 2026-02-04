import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FormCard = ({ form, onSelect, className = '', permisos = {} }) => {

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
      icon: form?.icon || 'FileText',
      color: form?.primaryColor || '#3B82F6'
    };
  };

  const iconInfo = getIconInfo();

  return (
    <div className={`bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-brand-hover transition-brand group ${className}`}>
      {/* Header - Solo padding responsive */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          {/* ICONO CON COLOR DINÁMICO - Tamaño responsive */}
          <div
            className="p-1.5 sm:p-2 rounded-lg flex-shrink-0"
            style={{
              backgroundColor: iconInfo.color
            }}
          >
            <Icon
              name={iconInfo.icon}
              size={16}
              className="text-white sm:w-5 sm:h-5"
            />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            {/* Título responsive */}
            <h3
              className="font-semibold text-foreground group-hover:text-primary transition-brand truncate overflow-hidden whitespace-nowrap text-ellipsis text-sm sm:text-base"
              title={form?.title}
            >
              {truncateText(form?.title, window.innerWidth < 640 ? 25 : 30)}
            </h3>
            {/* Descripción responsive */}
            <p className="text-xs sm:text-sm text-muted-foreground truncate overflow-hidden whitespace-nowrap text-ellipsis">
              {form?.category}, modificado: {form?.lastModified}
            </p>
          </div>
        </div>

        {form?.status && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full border flex-shrink-0 ml-2 ${getStatusColor(form?.status)} whitespace-nowrap`}>
            {form?.status}
          </span>
        )}
      </div>

      {/* SECCIÓN: EMPRESAS - Solo truncado responsive */}
      {form?.companies && form.companies.length > 0 && (
        <div className="mb-3 sm:mb-4">
          <span className="text-xs text-muted-foreground">
            {form.companies.slice(0, window.innerWidth < 640 ? 2 : 3).map((companyValue, index, array) => {
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
            {form.companies.length > (window.innerWidth < 640 ? 2 : 3) && (
              <span> ... +{form.companies.length - (window.innerWidth < 640 ? 2 : 3)}</span>
            )}
          </span>
        </div>
      )}

      {/* Footer - MANTIENE DISEÑO ORIGINAL con mejoras responsive mínimas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-muted-foreground">
          {/* Iconos más pequeños en móvil */}
          <div className="flex items-center space-x-1">
            <Icon name="Clock" size={12} className="sm:w-3.5 sm:h-3.5" />
            <span className="whitespace-nowrap">{form?.estimatedTime}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="FileText" size={12} className="sm:w-3.5 sm:h-3.5" />
            <span className="whitespace-nowrap">{form?.fields} Preguntas</span>
          </div>
          {form?.documentsRequired && (
            <div className="flex items-center space-x-1">
              <Icon name="Paperclip" size={12} className="sm:w-3.5 sm:h-3.5" />
              <span className="whitespace-nowrap">Docs</span>
            </div>
          )}
        </div>

        {/* BOTÓN - MANTIENE TAMAÑO PEQUEÑO ORIGINAL EN TODAS LAS PANTALLAS */}
        {permisos.edit_formularios && (<Button
          variant={form?.status === 'borrador' ? 'outline' : 'default'}
          size="sm"
          onClick={() => window.location.href = `/form-builder?id=${form?.id}`}
          iconName={form?.status === 'borrador' ? 'Edit' : 'ArrowRight'}
          iconPosition="right"
          iconSize={14}
          className="flex-shrink-0 text-xs sm:text-sm"
        >
          {form?.status === 'borrador' ? 'Continuar' : 'Editar'}
        </Button>)}
      </div>
    </div>
  );
};

export default FormCard;