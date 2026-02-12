import React from 'react';
import Icon from '../../../components/AppIcon';

const TimelineView = ({ timeline, isVisible }) => {
  if (!isVisible) return null;

  const getStepIcon = (status, isCompleted, isCurrent) => {
    if (isCompleted) return 'CheckCircle';
    if (isCurrent) return 'Clock';
    return 'Circle';
  };

  const getStepColor = (status, isCompleted, isCurrent) => {
    if (isCompleted) return 'text-success';
    if (isCurrent) return 'text-accent';
    return 'text-muted-foreground';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString)?.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-card">
      <div className="flex items-center space-x-2 mb-6">
        <Icon name="GitBranch" size={20} className="text-accent" />
        <h3 className="text-lg font-semibold text-foreground">Cronología de la Solicitud</h3>
      </div>
      <div className="relative">
        {timeline?.map((step, index) => {
          const isLast = index === timeline?.length - 1;
          const isCompleted = step?.status === 'completed';
          const isCurrent = step?.status === 'current';
          
          return (
            <div key={step?.id} className="relative flex items-start space-x-4 pb-8">
              {/* Timeline Line */}
              {!isLast && (
                <div className="absolute left-5 top-10 w-0.5 h-full bg-border"></div>
              )}
              {/* Step Icon */}
              <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 bg-card ${
                isCompleted ? 'border-success bg-success/10' : isCurrent ?'border-accent bg-accent/10': 'border-border bg-muted/50'
              }`}>
                <Icon 
                  name={getStepIcon(step?.status, isCompleted, isCurrent)} 
                  size={16} 
                  className={getStepColor(step?.status, isCompleted, isCurrent)}
                />
              </div>
              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-sm font-medium ${
                    isCompleted ? 'text-foreground' : 
                    isCurrent ? 'text-foreground': 'text-muted-foreground'
                  }`}>
                    {step?.title}
                  </h4>
                  {step?.completedAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(step?.completedAt)}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {step?.description}
                </p>
                
                {step?.assignedTo && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Icon name="User" size={12} />
                    <span>Asignado a: {step?.assignedTo}</span>
                  </div>
                )}
                
                {step?.notes && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-md">
                    <p className="text-xs text-muted-foreground">{step?.notes}</p>
                  </div>
                )}
                
                {step?.estimatedCompletion && !step?.completedAt && (
                  <div className="mt-2 flex items-center space-x-1 text-xs text-warning">
                    <Icon name="Clock" size={12} />
                    <span>Estimado: {formatDateTime(step?.estimatedCompletion)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineView;