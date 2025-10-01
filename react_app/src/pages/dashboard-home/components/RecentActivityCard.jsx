import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecentActivityCard = () => {
  const recentActivities = [
    {
      id: 1,
      type: 'form_submitted',
      title: 'Solicitud de Vacaciones Enviada',
      description: 'Solicitud para el período del 15-20 de enero',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'pending',
      icon: 'Calendar',
      color: 'bg-blue-500'
    },
    {
      id: 2,
      type: 'document_uploaded',
      title: 'Certificado Médico Subido',
      description: 'Documento adjuntado a solicitud de licencia médica',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      status: 'completed',
      icon: 'Upload',
      color: 'bg-green-500'
    },
    {
      id: 3,
      type: 'approval_received',
      title: 'Reporte de Gastos Aprobado',
      description: 'Gastos de viaje por $125.000 CLP aprobados',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      status: 'approved',
      icon: 'CheckCircle',
      color: 'bg-success'
    },
    {
      id: 4,
      type: 'message_received',
      title: 'Mensaje de RRHH',
      description: 'Recordatorio sobre actualización de datos personales',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'info',
      icon: 'MessageSquare',
      color: 'bg-orange-500'
    },
    {
      id: 5,
      type: 'training_completed',
      title: 'Capacitación Completada',
      description: 'Curso de seguridad informática finalizado exitosamente',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      status: 'completed',
      icon: 'GraduationCap',
      color: 'bg-purple-500'
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: 'Pendiente', class: 'bg-warning/10 text-warning border-warning/20' },
      completed: { text: 'Completado', class: 'bg-success/10 text-success border-success/20' },
      approved: { text: 'Aprobado', class: 'bg-success/10 text-success border-success/20' },
      info: { text: 'Información', class: 'bg-blue-500/10 text-blue-600 border-blue-500/20' }
    };
    return statusConfig?.[status] || statusConfig?.info;
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `hace ${days} día${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      return 'hace unos minutos';
    }
  };

  const handleActivityClick = (activity) => {
    const routes = {
      'form_submitted': '/request-tracking',
      'document_uploaded': '/request-tracking',
      'approval_received': '/request-tracking',
      'message_received': '/support-portal',
      'training_completed': '/form-center'
    };
    window.location.href = routes?.[activity?.type] || '/dashboard-home';
  };

  return (
    <div className="bg-card rounded-xl shadow-brand border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Actividad Reciente</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Últimas acciones y notificaciones
            </p>
          </div>
          <Icon name="Activity" size={24} className="text-accent" />
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {recentActivities?.map((activity, index) => (
            <div
              key={activity?.id}
              className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-brand cursor-pointer group"
              onClick={() => handleActivityClick(activity)}
            >
              <div className={`w-10 h-10 ${activity?.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                <Icon name={activity?.icon} size={16} color="white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {activity?.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity?.description}
                    </p>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(activity?.timestamp)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(activity?.status)?.class}`}>
                        {getStatusBadge(activity?.status)?.text}
                      </span>
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            fullWidth
            iconName="History"
            iconPosition="left"
            onClick={() => window.location.href = '/request-tracking'}
          >
            Ver Historial Completo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecentActivityCard;