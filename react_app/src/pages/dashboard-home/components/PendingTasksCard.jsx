import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PendingTasksCard = () => {
  const pendingTasks = [
    {
      id: 1,
      title: 'Completar Evaluación de Desempeño',
      description: 'Evaluación anual pendiente de completar',
      priority: 'high',
      dueDate: '2025-01-15',
      type: 'evaluation',
      progress: 60
    },
    {
      id: 2,
      title: 'Actualizar Datos de Contacto',
      description: 'Información de emergencia desactualizada',
      priority: 'medium',
      dueDate: '2025-01-20',
      type: 'personal-data',
      progress: 0
    },
    {
      id: 3,
      title: 'Revisar Política de Seguridad',
      description: 'Nueva política de seguridad informática',
      priority: 'medium',
      dueDate: '2025-01-25',
      type: 'policy',
      progress: 30
    },
    {
      id: 4,
      title: 'Confirmar Capacitación Obligatoria',
      description: 'Capacitación en prevención de riesgos',
      priority: 'high',
      dueDate: '2025-01-18',
      type: 'training',
      progress: 0
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-error bg-error/10 border-error/20';
      case 'medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'low': return 'text-success bg-success/10 border-success/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return 'AlertTriangle';
      case 'medium': return 'Clock';
      case 'low': return 'CheckCircle';
      default: return 'Circle';
    }
  };

  const handleTaskClick = (task) => {
    const routes = {
      'evaluation': '/form-center?type=evaluation',
      'personal-data': '/form-center?type=personal-data',
      'policy': '/form-center?type=policy',
      'training': '/form-center?type=training'
    };
    window.location.href = routes?.[task?.type] || '/form-center';
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="bg-card rounded-xl shadow-brand border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Tareas Pendientes</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {pendingTasks?.length} elementos requieren tu atención
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-error/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-error">{pendingTasks?.length}</span>
            </div>
            <Icon name="AlertCircle" size={20} className="text-error" />
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {pendingTasks?.map((task) => (
            <div
              key={task?.id}
              className="border border-border rounded-lg p-4 hover:border-primary hover:shadow-brand-hover transition-brand cursor-pointer group"
              onClick={() => handleTaskClick(task)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {task?.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task?.priority)}`}>
                      <Icon name={getPriorityIcon(task?.priority)} size={12} className="inline mr-1" />
                      {task?.priority === 'high' ? 'Alta' : task?.priority === 'medium' ? 'Media' : 'Baja'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {task?.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Icon name="Calendar" size={12} />
                        <span>Vence: {formatDate(task?.dueDate)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Icon name="BarChart3" size={12} />
                        <span>Progreso: {task?.progress}%</span>
                      </div>
                    </div>
                    <Icon name="ChevronRight" size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  {task?.progress > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task?.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            fullWidth
            iconName="Eye"
            iconPosition="left"
            onClick={() => window.location.href = '/request-tracking'}
          >
            Ver Todas las Tareas
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PendingTasksCard;