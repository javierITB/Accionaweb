import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecentForms = ({ onFormSelect, className = '' }) => {
  const recentForms = [
    {
      id: 'recent-1',
      title: 'Expense Report - September',
      category: 'expense',
      icon: 'Receipt',
      status: 'draft',
      lastModified: '2 hours ago',
      progress: 75,
      estimatedTimeLeft: '2 min'
    },
    {
      id: 'recent-2',
      title: 'Annual Leave Request',
      category: 'timeoff',
      icon: 'Calendar',
      status: 'submitted',
      lastModified: '1 day ago',
      submittedDate: '22/09/2025',
      approvalStatus: 'pending'
    },
    {
      id: 'recent-3',
      title: 'IT Equipment Request',
      category: 'it',
      icon: 'Monitor',
      status: 'approved',
      lastModified: '3 days ago',
      submittedDate: '20/09/2025',
      approvalStatus: 'approved'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'submitted':
        return 'text-primary bg-primary/10 border-primary/20';
      case 'approved':
        return 'text-success bg-success/10 border-success/20';
      case 'rejected':
        return 'text-error bg-error/10 border-error/20';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'timeoff':
        return 'bg-primary/10 text-primary';
      case 'expense':
        return 'bg-secondary/10 text-secondary';
      case 'it':
        return 'bg-accent/10 text-accent';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Recent Forms</h3>
        <Button
          variant="ghost"
          size="sm"
          iconName="History"
          iconPosition="left"
          iconSize={16}
          className="text-muted-foreground hover:text-foreground"
        >
          View All
        </Button>
      </div>
      <div className="space-y-3">
        {recentForms?.map((form) => (
          <div
            key={form?.id}
            className="bg-card border border-border rounded-lg p-4 hover:shadow-brand-hover transition-brand cursor-pointer group"
            onClick={() => onFormSelect(form)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className={`p-2 rounded-lg ${getCategoryColor(form?.category)}`}>
                  <Icon name={form?.icon} size={18} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground group-hover:text-primary transition-brand truncate">
                    {form?.title}
                  </h4>
                  <p className="text-sm text-muted-foreground capitalize">{form?.category}</p>
                  
                  {form?.status === 'draft' && form?.progress && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress: {form?.progress}%</span>
                        <span>{form?.estimatedTimeLeft} left</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${form?.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {form?.submittedDate && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Submitted: {form?.submittedDate}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(form?.status)}`}>
                  {form?.status === 'draft' ? 'Draft' : 
                   form?.status === 'submitted' ? 'Submitted' : 
                   form?.status === 'approved' ? 'Approved' : 'Rejected'}
                </span>
                
                <span className="text-xs text-muted-foreground">
                  {form?.lastModified}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                {form?.approvalStatus && (
                  <div className="flex items-center space-x-1">
                    <Icon 
                      name={form?.approvalStatus === 'approved' ? 'CheckCircle' : 
                            form?.approvalStatus === 'pending' ? 'Clock' : 'XCircle'} 
                      size={12} 
                    />
                    <span className="capitalize">{form?.approvalStatus}</span>
                  </div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                iconName={form?.status === 'draft' ? 'Edit' : 'Eye'}
                iconPosition="right"
                iconSize={14}
                className="text-xs"
              >
                {form?.status === 'draft' ? 'Continue' : 'View'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentForms;