import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

// ===============================================
// Componente que lista los formularios existentes
// (Sustituye al antiguo FormProperties / TemplateProperties)
// ===============================================

const TemplateList = ({ onUpdateFormData }) => {
  const [allForms, setAllForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Colores para el status (similares a los usados en FormCenter)
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'borrador':
        return 'bg-warning text-warning-foreground';
      case 'publicado':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // 1. Cargar Formularios desde la API
  useEffect(() => {
    const fetchForms = async () => {
      try {
        setIsLoading(true);
        // Usamos la URL de forms para listar las plantillas disponibles
        const res = await fetch('https://accionaweb.vercel.app/api/forms');

        if (!res.ok) {
          throw new Error('Error al obtener la lista de formularios');
        }

        const data = await res.json();

        // Normalización básica de la fecha
        const normalizedForms = data.map(f => ({
          id: f._id,
          title: f.title || 'Sin título',
          section: f.section || 'General',
          status: f.status || 'borrador',
          updatedAt: f.updatedAt ? new Date(f.updatedAt).toLocaleDateString('es-CL') : '—',
          // Incluye otros datos necesarios para la tabla
          questionsCount: f.questions?.length || 0,
          questions: f.questions || [],
          formId: f.plantillaId
        }));

        setAllForms(normalizedForms);
      } catch (err) {
        console.error('Error cargando formularios:', err);
        // Opcional: mostrar un mensaje de error en la UI
      } finally {
        setIsLoading(false);
      }
    };

    fetchForms();
  }, []);


  // Función placeholder para manejar la selección de una plantilla
  const handleTemplateSelect = (form) => {
    // Pasa el objeto completo del formulario (incluyendo preguntas) al componente padre
    onUpdateFormData(form);

    console.log('Formulario seleccionado como base:', form.id);
  };

  return (
    <div className="space-y-8">
      {/* 1. Encabezado */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon name="List" size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Selección de Plantilla Base
          </h3>
          <p className="text-sm text-muted-foreground">
            Selecciona un formulario existente para usar como estructura de la plantilla DOCX.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <Icon name="Loader" size={32} className="animate-spin text-primary" />
          <p className="text-muted-foreground mt-2">Cargando formularios existentes...</p>
        </div>
      ) : allForms.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-lg">
          <Icon name="Frown" size={32} className="text-muted-foreground" />
          <p className="text-muted-foreground mt-2">No se encontraron formularios disponibles.</p>
        </div>
      ) : (
        /* 2. Tabla de Formularios */
        <div className="overflow-x-auto bg-card border border-border rounded-lg">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted text-sm text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Vinculado</th>
                <th className="px-4 py-2 text-left">Título</th>
                <th className="px-4 py-2 text-left">Sección</th>
                <th className="px-4 py-2 text-left">Preguntas</th>
                <th className="px-4 py-2 text-left">Estado</th>
                <th className="px-4 py-2 text-left">Última Modificación</th>
                <th className="px-4 py-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allForms.map((form) => (
                <tr key={form.id} className="hover:bg-muted/50 transition">
                  {form.formId ? (
                    <td className="px-4 py-3 font-medium text-foreground text-sm">
                      <Icon name="CheckCircle" size={16} className="text-green-600 dark:text-green-300" />
                    </td>
                  ) : (
                    <td className="px-4 py-3 font-medium text-foreground text-sm">
                      <Icon name="HelpCircle" size={16} className="text-gray-500 dark:text-gray-300" />
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium text-foreground text-sm">{form.title}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{form.section}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{form.questionsCount}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(form.status)}`}>
                      {form.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{form.updatedAt}</td>
                  <td className="px-4 py-3 text-center">
                    {form.formId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTemplateSelect(form)}
                        iconName="Pen"
                        iconPosition="left"
                      >
                        Editar Plantilla
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTemplateSelect(form)}
                        iconName="Dock"
                        iconPosition="left"
                      >
                        Crear Plantilla
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default TemplateList;
