import React from 'react';
import Icon from '../../../components/AppIcon';


const WelcomeCard = ({ user }) => {
  const currentHour = new Date()?.getHours();
  const getGreeting = () => {
    if (currentHour < 12) return 'Buenos días';
    if (currentHour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="bg-gradient-to-br from-primary to-success p-6 rounded-xl text-white shadow-brand-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2 muted-foreground">
            {getGreeting()}, {user?.name}
          </h1>
          <p className="text-muted-foreground/80 mb-4">
            Bienvenido a Portal Acciona. Aquí puedes gestionar todas tus solicitudes y documentos de manera eficiente.
          </p>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2 text-black">
              <Icon name="Calendar" size={16} />
              <span>{new Date()?.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center space-x-2 text-black">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span>Sistema activo</span>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            <Icon name="User" size={32} />
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;