import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import { useNavigate } from 'react-router-dom';
import { apiFetch, API_BASE_URL } from '../../../utils/api';

const QuickActionsCard = ({ orientation = 'horizontal' }) => {
  const navigate = useNavigate();
  const [actions, setActions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Obtenemos el mail del usuario desde el localStorage o contexto de auth
  const userMail = localStorage.getItem("email");

  useEffect(() => {
    const fetchQuickActions = async () => {
      if (!userMail) return;
      try {
         setIsLoading(true);
         const res = await apiFetch(`${API_BASE_URL}/auth/quick-actions/${userMail}`);
         if (res) {
            const result = await res.json();
            setActions(result.quickActions || []);
         }
      } catch (error) {
         console.error("Error al cargar acciones rápidas:", error);
      } finally {
         setIsLoading(false);
      }
    };

    fetchQuickActions();
  }, [userMail]);

  // LÓGICA DE PRIORIDAD PONDERADA (Top 6)
  const prioritizedActions = useMemo(() => {
    return [...actions]
      .map(action => {
        const lastUsedMs = new Date(action.lastUsed || 0).getTime();
        const nowMs = Date.now();
        
        // Normalización de tiempo (0 a 1, donde 1 es "ahora mismo")
        // Consideramos una ventana de relevancia de 30 días para el decaimiento
        const timeScore = Math.max(0, 1 - (nowMs - lastUsedMs) / (30 * 24 * 60 * 60 * 1000));
        
        // Puntuación de uso (Logarítmica para evitar que un solo form domine por siempre)
        const usageScore = Math.log10((action.usageCount || 0) + 1);

        // Score Final: 70% tiempo, 30% frecuencia
        const finalScore = (timeScore * 0.7) + (usageScore * 0.3);
        
        return { ...action, finalScore };
      })
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 6); // Solo los 6 más relevantes
  }, [actions]);

  const handleActionClick = (formId) => {
    // Redirigir al formulario usando el ID dinámico
    navigate(`/forms?id=${formId}`);
  };

  const gridClasses = orientation === 'vertical'
    ? 'space-y-3 sm:space-y-4'
    : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4';

  return (
    <div className="bg-card rounded-xl shadow-brand border border-border w-full">
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Acciones Rápidas</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Tus formularios más utilizados y recientes
            </p>
          </div>
          <Icon name="Zap" size={20} className="text-secondary flex-shrink-0 ml-4 sm:w-6 sm:h-6" />
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Icon name="Loader2" className="animate-spin text-primary" size={32} />
          </div>
        ) : prioritizedActions.length > 0 ? (
          <div className={gridClasses}>
            {prioritizedActions.map((action) => (
              <button
                key={action.formId}
                onClick={() => handleActionClick(action.formId)}
                className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg border border-border hover:border-primary hover:shadow-brand-hover transition-brand text-left group w-full"
                title={action.nombre}
              >
                {/* Icon con color dinámico del backend */}
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: action.color || '#3b82f6' }}
                >
                  <Icon name={action.logo || 'FileText'} size={18} color="white" className="sm:w-5 sm:h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors text-sm sm:text-base truncate">
                    {action.nombre}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {action.descripcion || 'Acceso rápido'}
                  </p>
                </div>

                <Icon
                  name="ChevronRight"
                  size={14}
                  className="text-muted-foreground group-hover:text-primary transition-colors mt-1 flex-shrink-0"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm italic">
            Aún no tienes acciones registradas.
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickActionsCard;