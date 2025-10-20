import React from 'react';
import Icon from '../../../components/AppIcon';
import { useState, useEffect } from 'react';

const QuickActionsCard = ({ section }) => {
  /*
  id: 1,
      title: 'Contrato de trabajo',
      description: 'Solicita días libres y vacaciones',
      icon: 'FileText',
      color: 'bg-blue-500',
      path: '/form-center?type=vacation'
  */
  const [allForms, setAllForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setIsLoading(true);

        const mail = sessionStorage.getItem("email");

        if (!mail) {
          console.error("No se encontró el email del usuario en sessionStorage.");
          return;
        }

        // Enviar mail como query param
        const res = await fetch(`http://192.168.0.2:4000/api/forms/section/${section}?mail=${encodeURIComponent(mail)}`);

        if (!res.ok) {
          throw new Error(`Error en la respuesta del servidor: ${res.status}`);
        }

        const data = await res.json();

        const normalizedForms = data.map(f => ({
          id: f._id,
          title: f.title || 'Sin título',
          description: f.description || '',
          category: f.category || 'general',
          icon: f.icon || 'FileText',
          status: f.status || 'draft',
          priority: f.priority || 'medium',
          estimatedTime: f.responseTime || '1-5 min',
          fields: f.questions ? f.questions.length : 0,
          documentsRequired: f.documentsRequired ?? false,
          color: f.primaryColor,
          tags: f.tags || [],
          lastModified: f.updatedAt ? f.updatedAt.split("T")[0] : null,
          path: "/forms?id=" + f._id
        }));

        setAllForms(normalizedForms);
      } catch (err) {
        console.error('Error cargando formularios:', err);
      } finally {
        setIsLoading(false);
      }
    };


    fetchForms();
  }, []);


  const handleActionClick = (path) => {
    window.location.href = path;
  };

  return (
    <div className="bg-card rounded-xl shadow-brand border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Formularios remuneraciones</h2>
            <p className="text-sm text-muted-foreground mt-1">
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allForms?.map((action) => (
            <button
              key={action?.id}
              onClick={() => handleActionClick(action?.path)}
              className="flex items-start space-x-4 p-4 rounded-lg border border-border hover:border-primary hover:shadow-brand-hover transition-brand text-left group"
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                style={{ backgroundColor: action?.color }}
              >
                <Icon name={action?.icon} size={20} color="white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {action?.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {action?.description}
                </p>
              </div>
              <Icon name="ChevronRight" size={16} className="text-muted-foreground group-hover:text-primary transition-colors mt-1" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActionsCard;