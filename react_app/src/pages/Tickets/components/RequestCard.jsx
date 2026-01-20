
import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { getStatusColorClass, findConfigForCategory, getStatusIcon, getDefaultStatusColor, formatStatusText } from '../../../utils/ticketStatusStyles';

const RequestCard = ({ request, onRemove, onViewDetails, ticketConfigs }) => {
  const [currentRequest, setCurrentRequest] = useState(request);

  useEffect(() => {
    setCurrentRequest(request);
  }, [request]);

  /* Lógica para obtener configuración dinámica de estado */
  const getDynamicStatusConfig = () => {
    if (!ticketConfigs || ticketConfigs.length === 0) return null;

    // 1. Obtener la categoría del ticket
    const category = currentRequest?.categoryData || currentRequest?.responses?.['Categoría'] || 'General';
    // console.log('DEBUG RequestCard:', { id: currentRequest?._id, category, status: currentRequest?.status, configs: ticketConfigs.map(c => c.key) });

    // 2. Buscar la configuración para esa categoría (o una por defecto)
    const config = findConfigForCategory(ticketConfigs, category) ||
      ticketConfigs.find(c => c.key === 'domicilio_virtual'); // Fallback último recurso

    if (!config || !config.statuses) return null;

    // 3. Buscar el estado específico
    const statusDef = config.statuses.find(s => s.value === currentRequest?.status);
    return statusDef;
  };

  const dynamicStatus = getDynamicStatusConfig();


  // ... (maintain existing helper functions for fallback) ...


  // ... (keep other helpers) ...

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-error';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return 'fecha desconocida';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();

    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffTime < 0) {
      return 'en el futuro';
    } else if (diffSeconds < 60) {
      return 'hace un momento';
    } else if (diffMinutes < 60) {
      return `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''} `;
    } else if (diffHours < 24) {
      return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''} `;
    } else if (diffDays === 1) {
      return 'hace 1 día';
    } else if (diffDays < 7) {
      return `hace ${diffDays} día${diffDays > 1 ? 's' : ''} `;
    } else if (diffDays < 30) {
      const diffWeeks = Math.floor(diffDays / 7);
      return `hace ${diffWeeks} semana${diffWeeks > 1 ? 's' : ''} `;
    } else if (diffDays < 365) {
      const diffMonths = Math.floor(diffDays / 30);
      return `hace ${diffMonths} mes${diffMonths > 1 ? 'es' : ''} `;
    } else {
      const diffYears = Math.floor(diffDays / 365);
      return `hace ${diffYears} año${diffYears > 1 ? 's' : ''} `;
    }
  };

  const getCombinedTitle = () => {
    // Extraemos la información de las respuestas del ticket
    const subcategory = currentRequest?.responses?.['Subcategoría'];
    const subject = currentRequest?.responses?.['Asunto'] || '';
    const formTitle = currentRequest?.formTitle || 'Ticket';

    // Si existe una subcategoría (casos Sistema o Domicilio Virtual), se usa como título principal
    if (subcategory) {
      return subject ? `${subcategory} - ${subject} ` : subcategory;
    }

    // Fallback para otros formularios que no tienen el campo subcategoría definido en responses
    if (subject) {
      return `${formTitle} - ${subject} `;
    }

    return formTitle;
  };

  const getCompanyDisplay = () => {
    if (currentRequest?.responses) {
      const keys = Object.keys(currentRequest?.responses || {});
      const normalize = k => k.toLowerCase().trim().replace(':', '');

      const companyKey = keys.find(k => {
        const n = normalize(k);
        if (n.includes('rut') ||
          n.includes('teléfono') || n.includes('telefono') ||
          n.includes('celular') ||
          n.includes('mail') || n.includes('correo') ||
          n.includes('dirección') || n.includes('direccion') || n.includes('calle')) return false;

        return ['razón social', 'razon social', 'nombre que llevará la empresa', 'empresa', 'cliente'].some(t => n.includes(t));
      });

      const rutKey = keys.find(k => {
        const n = normalize(k);
        return n.includes('rut de la empresa') || n.includes('rut representante');
      });

      if (companyKey) {
        const companyName = currentRequest?.responses?.[companyKey];
        const rut = currentRequest?.responses?.[rutKey] || currentRequest?.rutEmpresa;
        if (companyName) {
          return `${companyName}${rut ? ` (${rut})` : ''} `;
        }
      }
    }

    return currentRequest?.company || currentRequest?.user?.empresa || 'Empresa Desconocida';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:shadow-brand-hover transition-brand">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col xs:flex-row xs:items-center xs:space-x-3 space-y-1 xs:space-y-0 mb-2">
            <h3 className="text-base sm:text-lg font-semibold text-foreground break-words">
              {getCombinedTitle()}
            </h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {getRelativeTime(currentRequest?.submittedAt || currentRequest?.createdAt)}
            </span>
          </div>



          <div className="flex flex-col xs:flex-row xs:items-center space-y-2 xs:space-y-0 xs:space-x-3 sm:space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Icon name="Briefcase" size={12} className="flex-shrink-0 sm:w-3.5 sm:h-3.5" />
              <span className="truncate">Empresa: {getCompanyDisplay()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="User" size={12} className="flex-shrink-0 sm:w-3.5 sm:h-3.5" />
              <span className="truncate">Por: {currentRequest?.submittedBy}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto sm:ml-4">
          {currentRequest?.hasMessages && (
            <div className="relative">
              <Icon name="MessageCircle" size={14} className="text-accent sm:w-4 sm:h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full"></span>
            </div>
          )}
          {/* Status Badge */}
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${dynamicStatus
              ? getStatusColorClass(dynamicStatus.color)
              : getDefaultStatusColor(currentRequest?.status)
              } `}
          >
            <Icon
              name={dynamicStatus?.icon || getStatusIcon(currentRequest?.status)}
              size={12}
              className="mr-1.5"
            />
            {formatStatusText(currentRequest?.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
        <div>
          <span className="font-semibold block">Creado:</span>
          {formatDate(currentRequest?.submittedAt || currentRequest?.createdAt)}
        </div>
        <div>
          <span className="font-semibold block">Tomado:</span>
          {currentRequest?.assignedAt ? formatDate(currentRequest.assignedAt) : '-'}
        </div>
        <div>
          <span className="font-semibold block">Est. Término:</span>
          {currentRequest?.estimatedCompletionAt || currentRequest?.expirationDate ? formatDate(currentRequest.estimatedCompletionAt || currentRequest.expirationDate) : '-'}
        </div>
        <div>
          <span className="font-semibold block">Término Real:</span>
          {currentRequest?.finalizedAt ? formatDate(currentRequest.finalizedAt) : (currentRequest?.approvedAt ? formatDate(currentRequest.approvedAt) : '-')}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 sm:mt-3">
        <div className="flex-1"></div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Badge de Prioridad */}
          {/* Badge de Prioridad - Estilo Refinado */}
          {currentRequest?.priority && (
            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide mr-2 border ${currentRequest.priority === 'critica' ? 'border-red-600 text-red-600 bg-red-50' :
              currentRequest.priority === 'alta' ? 'border-orange-500 text-orange-600 bg-orange-50' :
                currentRequest.priority === 'media' ? 'border-amber-500 text-amber-600 bg-amber-50' :
                  currentRequest.priority === 'baja' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' :
                    'border-slate-200 text-slate-500 bg-slate-50'
              } `}>
              {currentRequest.priority}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            title="Eliminar"
            onClick={() => onRemove(currentRequest)}
            className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Icon name="Trash2" size={12} className="sm:w-3.5 sm:h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewDetails(currentRequest)}
            className="h-7 w-7 sm:h-8 sm:w-8 sm:!hidden"
          >
            <Icon name="Info" size={12} className="sm:w-3.5 sm:h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            title="Ver detalles"
            onClick={() => onViewDetails(currentRequest)}
            iconName="Info"
            iconPosition="left"
            iconSize={14}
            className="hidden sm:flex"
          >
            Detalles
          </Button>
        </div>
      </div>
    </div >
  );
};

export default RequestCard;