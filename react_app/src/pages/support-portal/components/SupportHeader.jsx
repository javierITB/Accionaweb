import React from 'react';
import Icon from '../../../components/AppIcon';

const SupportHeader = () => {
  return (
    <div className="bg-gradient-to-r from-primary to-accent text-white p-8 rounded-lg mb-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <Icon name="HelpCircle" size={24} color="white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Centro de Soporte</h1>
            <p className="text-white/90">Obtén ayuda rápida y eficiente para todas tus consultas</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Icon name="Clock" size={20} color="white" />
              <div>
                <p className="font-semibold">Tiempo de Respuesta</p>
                <p className="text-sm text-white/80">Promedio: 2 horas</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Icon name="Users" size={20} color="white" />
              <div>
                <p className="font-semibold">Soporte 24/7</p>
                <p className="text-sm text-white/80">Disponible siempre</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Icon name="Star" size={20} color="white" />
              <div>
                <p className="font-semibold">Satisfacción</p>
                <p className="text-sm text-white/80">98% de usuarios</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportHeader;