import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CommunityForum = () => {
  const [selectedTopic, setSelectedTopic] = useState('all');

  const topics = [
    { id: 'all', name: 'Todos los Temas', icon: 'MessageSquare', count: 156 },
    { id: 'general', name: 'General', icon: 'Users', count: 45 },
    { id: 'tips', name: 'Tips y Trucos', icon: 'Lightbulb', count: 32 },
    { id: 'technical', name: 'Soporte Técnico', icon: 'Monitor', count: 28 },
    { id: 'policies', name: 'Políticas', icon: 'Shield', count: 21 },
    { id: 'announcements', name: 'Anuncios', icon: 'Megaphone', count: 15 },
    { id: 'feedback', name: 'Sugerencias', icon: 'MessageCircle', count: 15 }
  ];

  const forumPosts = [
    {
      id: 1,
      title: "¿Cómo optimizar el proceso de solicitud de vacaciones?",
      content: "He notado que el proceso puede ser más eficiente si...",
      author: {
        name: "María González",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
        role: "Especialista RH"
      },
      topic: "tips",
      replies: 12,
      views: 234,
      lastActivity: "2025-01-22T10:30:00",
      isSticky: true,
      tags: ["vacaciones", "optimización", "proceso"]
    },
    {
      id: 2,
      title: "Problema con la carga de documentos en formularios",
      content: "Algunos usuarios reportan dificultades al subir archivos PDF...",
      author: {
        name: "Carlos Ruiz",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
        role: "Soporte IT"
      },
      topic: "technical",
      replies: 8,
      views: 156,
      lastActivity: "2025-01-22T09:15:00",
      isSticky: false,
      tags: ["documentos", "upload", "pdf"]
    },
    {
      id: 3,
      title: "Nueva política de trabajo remoto - Preguntas frecuentes",
      content: "Compilación de las preguntas más comunes sobre la nueva política...",
      author: {
        name: "Ana López",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
        role: "Gerente RH"
      },
      topic: "policies",
      replies: 25,
      views: 567,
      lastActivity: "2025-01-21T16:45:00",
      isSticky: true,
      tags: ["remoto", "política", "faq"]
    },
    {
      id: 4,
      title: "Tip: Cómo llenar correctamente el formulario de gastos",
      content: "Después de varios años usando el sistema, aquí van mis mejores consejos...",
      author: {
        name: "Roberto Silva",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
        role: "Empleado Senior"
      },
      topic: "tips",
      replies: 15,
      views: 289,
      lastActivity: "2025-01-21T14:20:00",
      isSticky: false,
      tags: ["gastos", "formulario", "tips"]
    },
    {
      id: 5,
      title: "Sugerencia: Notificaciones push para el móvil",
      content: "Sería genial tener notificaciones push en la app móvil para...",
      author: {
        name: "Laura Martín",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face",
        role: "Analista"
      },
      topic: "feedback",
      replies: 6,
      views: 123,
      lastActivity: "2025-01-21T11:30:00",
      isSticky: false,
      tags: ["móvil", "notificaciones", "sugerencia"]
    },
    {
      id: 6,
      title: "Mantenimiento programado del sistema - 25 de enero",
      content: "El sistema estará en mantenimiento el próximo viernes de 2:00 AM a 4:00 AM...",
      author: {
        name: "Equipo IT",
        avatar: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=40&h=40&fit=crop&crop=face",
        role: "Administrador"
      },
      topic: "announcements",
      replies: 3,
      views: 445,
      lastActivity: "2025-01-20T08:00:00",
      isSticky: true,
      tags: ["mantenimiento", "sistema", "anuncio"]
    }
  ];

  const filteredPosts = forumPosts?.filter(post => 
    selectedTopic === 'all' || post?.topic === selectedTopic
  );

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    return `Hace ${Math.floor(diffInHours / 24)} días`;
  };

  const handlePostClick = (post) => {
    alert(`Abriendo: ${post?.title}`);
  };

  const getTopicColor = (topic) => {
    const colors = {
      general: 'bg-primary text-primary-foreground',
      tips: 'bg-success text-success-foreground',
      technical: 'bg-warning text-warning-foreground',
      policies: 'bg-accent text-accent-foreground',
      announcements: 'bg-secondary text-secondary-foreground',
      feedback: 'bg-muted text-muted-foreground'
    };
    return colors?.[topic] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Foro de la Comunidad</h2>
        <Button iconName="Plus" iconPosition="left">
          Nueva Publicación
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Topics Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-4">Temas</h3>
            <div className="space-y-2">
              {topics?.map((topic) => (
                <button
                  key={topic?.id}
                  onClick={() => setSelectedTopic(topic?.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-brand ${
                    selectedTopic === topic?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title = {`Filtrar por tema: ${topic?.name}`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon name={topic?.icon} size={16} />
                    <span>{topic?.name}</span>
                  </div>
                  <span className="text-xs opacity-75">{topic?.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Community Stats */}
          <div className="bg-card border border-border rounded-lg p-4 mt-4">
            <h3 className="font-semibold text-foreground mb-4">Estadísticas</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Total Posts</span>
                <span className="font-medium text-foreground">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Miembros Activos</span>
                <span className="font-medium text-foreground">89</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Esta Semana</span>
                <span className="font-medium text-foreground">23</span>
              </div>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="lg:col-span-3 space-y-4">
          {filteredPosts?.map((post) => (
            <div
              key={post?.id}
              className={`bg-card border rounded-lg p-6 hover:shadow-brand-hover transition-brand cursor-pointer ${
                post?.isSticky ? 'border-primary/50 bg-primary/5' : 'border-border'
              }`}
              onClick={() => handlePostClick(post)}
            >
              <div className="flex items-start space-x-4">
                <img
                  src={post?.author?.avatar}
                  alt={post?.author?.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {post?.isSticky && (
                      <Icon name="Pin" size={14} className="text-primary" />
                    )}
                    <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                      {post?.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTopicColor(post?.topic)}`}>
                      {topics?.find(t => t?.id === post?.topic)?.name}
                    </span>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {post?.content}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post?.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Post Meta */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <span>Por {post?.author?.name} • {post?.author?.role}</span>
                      <span>{formatTimeAgo(post?.lastActivity)}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Icon name="MessageSquare" size={12} />
                        <span>{post?.replies}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Icon name="Eye" size={12} />
                        <span>{post?.views}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredPosts?.length === 0 && (
            <div className="text-center py-12">
              <Icon name="MessageSquare" size={48} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No hay publicaciones</h3>
              <p className="text-muted-foreground mb-4">
                Sé el primero en iniciar una conversación en este tema
              </p>
              <Button>
                Crear Primera Publicación
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityForum;