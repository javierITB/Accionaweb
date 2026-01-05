import React from 'react';
import Icon from '../../../components/AppIcon';
import { useState, useEffect } from 'react';

const QuickActionsCard = ({ section }) => {
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
        const res = await fetch(`https://back-desa.vercel.app/api/forms/section/${section}/${encodeURIComponent(mail)}`);

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
          status: f.status || 'borrador',
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
    <div className="bg-card rounded-xl shadow-brand border border-border w-full">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Formularios {section}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {/* Descripción opcional */}
            </p>
          </div>
        </div>
      </div>

      {/* Forms Grid - RESPONSIVE */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Cargando formularios...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {allForms?.map((action) => (
              <button
                key={action?.id}
                onClick={() => handleActionClick(action?.path)}
                className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg border border-border hover:border-primary hover:shadow-brand-hover transition-brand text-left group w-full"
                title={action.title}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: action?.color }}
                >
                  <Icon name={action?.icon} size={18} color="white" className="sm:w-5 sm:h-5" />
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors text-sm sm:text-base leading-tight">
                    {action?.title}
                  </h3>
                  {action?.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                      {action?.description}
                    </p>
                  )}
                </div>

                {/* Chevron */}
                <Icon
                  name="ChevronRight"
                  size={14}
                  className="text-muted-foreground group-hover:text-primary transition-colors mt-1 flex-shrink-0 sm:w-4 sm:h-4"
                />
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && allForms?.length === 0 && (
          <div className="text-center py-8">
            <Icon name="FileText" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No hay formularios disponibles</h3>
            <p className="text-sm text-muted-foreground">
              No se encontraron formularios en la sección {section}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickActionsCard;