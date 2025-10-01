import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VideoTutorials = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Todos', icon: 'Grid3X3' },
    { id: 'getting-started', name: 'Primeros Pasos', icon: 'Play' },
    { id: 'forms', name: 'Formularios', icon: 'FileText' },
    { id: 'payroll', name: 'Nómina', icon: 'DollarSign' },
    { id: 'benefits', name: 'Beneficios', icon: 'Heart' }
  ];

  const tutorials = [
    {
      id: 1,
      title: "Introducción al Portal HR de Acciona",
      description: "Conoce las funcionalidades principales y cómo navegar por el portal",
      category: "getting-started",
      duration: "5:30",
      views: 2450,
      thumbnail: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=300&h=200&fit=crop",
      level: "Principiante",
      isNew: true
    },
    {
      id: 2,
      title: "Cómo Solicitar Vacaciones Paso a Paso",
      description: "Guía completa para solicitar días de vacaciones a través del sistema",
      category: "forms",
      duration: "8:15",
      views: 1890,
      thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop",
      level: "Principiante",
      isNew: false
    },
    {
      id: 3,
      title: "Entendiendo tu Liquidación de Sueldo",
      description: "Explicación detallada de cada concepto en tu liquidación mensual",
      category: "payroll",
      duration: "12:45",
      views: 1567,
      thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop",
      level: "Intermedio",
      isNew: false
    },
    {
      id: 4,
      title: "Configuración de Beneficios de Salud",
      description: "Cómo configurar y gestionar tus beneficios médicos y de salud",
      category: "benefits",
      duration: "10:20",
      views: 1234,
      thumbnail: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop",
      level: "Intermedio",
      isNew: true
    },
    {
      id: 5,
      title: "Reportar Gastos de Viaje",
      description: "Proceso completo para reportar gastos y obtener reembolsos",
      category: "forms",
      duration: "7:30",
      views: 987,
      thumbnail: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop",
      level: "Principiante",
      isNew: false
    },
    {
      id: 6,
      title: "Actualización de Datos Personales",
      description: "Cómo mantener actualizada tu información personal y de contacto",
      category: "getting-started",
      duration: "4:45",
      views: 756,
      thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
      level: "Principiante",
      isNew: false
    }
  ];

  const filteredTutorials = tutorials?.filter(tutorial => 
    selectedCategory === 'all' || tutorial?.category === selectedCategory
  );

  const handlePlayVideo = (tutorial) => {
    alert(`Reproduciendo: ${tutorial?.title}`);
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Principiante': return 'bg-success text-success-foreground';
      case 'Intermedio': return 'bg-warning text-warning-foreground';
      case 'Avanzado': return 'bg-error text-error-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div id="tutorials-section" className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Video Tutoriales</h2>
        <Button variant="outline" iconName="Youtube" iconPosition="left">
          Ver Canal Completo
        </Button>
      </div>
      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories?.map((category) => (
          <Button
            key={category?.id}
            variant={selectedCategory === category?.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category?.id)}
            iconName={category?.icon}
            iconPosition="left"
            iconSize={16}
          >
            {category?.name}
          </Button>
        ))}
      </div>
      {/* Tutorials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutorials?.map((tutorial) => (
          <div
            key={tutorial?.id}
            className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-brand-hover transition-brand group cursor-pointer"
            onClick={() => handlePlayVideo(tutorial)}
          >
            {/* Thumbnail */}
            <div className="relative">
              <img
                src={tutorial?.thumbnail}
                alt={tutorial?.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                  <Icon name="Play" size={24} className="text-primary ml-1" />
                </div>
              </div>
              
              {/* Duration Badge */}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
                {tutorial?.duration}
              </div>
              
              {/* New Badge */}
              {tutorial?.isNew && (
                <div className="absolute top-2 left-2 bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium">
                  Nuevo
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {tutorial?.title}
                </h3>
              </div>
              
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {tutorial?.description}
              </p>

              {/* Meta Information */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(tutorial?.level)}`}>
                    {tutorial?.level}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Icon name="Eye" size={12} />
                  <span>{tutorial?.views?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filteredTutorials?.length === 0 && (
        <div className="text-center py-12">
          <Icon name="Video" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No hay tutoriales disponibles</h3>
          <p className="text-muted-foreground">
            Selecciona una categoría diferente para ver más contenido
          </p>
        </div>
      )}
      {/* Featured Tutorial */}
      <div className="mt-8 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="Star" size={24} color="white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Tutorial Destacado de la Semana
            </h3>
            <p className="text-muted-foreground mb-3">
              "Introducción al Portal HR de Acciona" - Perfecto para nuevos usuarios
            </p>
            <Button size="sm" onClick={() => handlePlayVideo(tutorials?.[0])}>
              Ver Ahora
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoTutorials;