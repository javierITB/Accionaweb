import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { API_BASE_URL } from '../../../utils/api';

const TemplateList = ({ onUpdateFormData }) => {
  const [allForms, setAllForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [selectedFormForTemplate, setSelectedFormForTemplate] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [selectedTemplateForDuplicate, setSelectedTemplateForDuplicate] = useState(null);

  // Colores para el status
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

  // Cargar Formularios y Plantillas
  const fetchFormsAndTemplates = async () => {
    try {
      setIsLoading(true);

      // Cargar formularios
      const formsRes = await fetch(`${API_BASE_URL}/forms`);
      if (!formsRes.ok) throw new Error('Error al obtener formularios');
      const formsData = await formsRes.json();

      // Cargar plantillas
      const templatesRes = await fetch(`${API_BASE_URL}/plantillas`);
      const templatesData = templatesRes.ok ? await templatesRes.json() : [];

      // Combinar información: para cada plantilla, encontrar su formulario asociado
      const templatesWithFormInfo = templatesData.map(template => {
        const associatedForm = formsData.find(form => form.plantillaId === template._id || form._id === template.formId);
        return {
          ...template,
          formTitle: associatedForm?.title || 'Formulario no encontrado',
          formSection: associatedForm?.section || 'General'
        };
      });

      // Normalizar formularios para la tabla
      const normalizedForms = formsData.map(f => ({
        id: f._id,
        title: f.title || 'Sin título',
        section: f.section || 'General',
        status: f.status || 'borrador',
        updatedAt: f.updatedAt ? new Date(f.updatedAt).toLocaleDateString('es-CL') : '—',
        questionsCount: f.questions?.length || 0,
        questions: f.questions || [],
        formId: f.plantillaId
      }));

      setAllForms(normalizedForms);
      setAvailableTemplates(templatesWithFormInfo);

    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFormsAndTemplates();
  }, []);

  // Función para eliminar plantilla
  const handleDeleteTemplate = async (formId, plantillaId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta plantilla? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setDeletingId(plantillaId);

      const response = await fetch(`${API_BASE_URL}/plantillas/${plantillaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la plantilla');
      }

      await fetchFormsAndTemplates();
      alert('Plantilla eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando plantilla:', error);
      alert('Error al eliminar la plantilla: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Función para manejar click en "Crear Plantilla"
  const handleCreateTemplateClick = (form) => {
    setSelectedFormForTemplate(form);
    setShowCreateOptions(true);
  };

  // Función para crear desde cero
  const handleCreateFromScratch = () => {
    const newTemplateData = {
      // Datos del formulario base
      id: selectedFormForTemplate.id,
      title: selectedFormForTemplate.title,
      section: selectedFormForTemplate.section,
      questions: selectedFormForTemplate.questions,

      // Datos de plantilla vacía (pero con estructura completa)
      documentTitle: ``,
      paragraphs: [{
        id: 'p1',
        content: 'Primera cláusula del contrato - {{FECHA_ACTUAL}}.',
        conditionalVar: ''
      }],
      signature1Text: 'Firma del Empleador (Emisor).',
      signature2Text: 'Firma del Empleado (Receptor).',

      // Indicar explícitamente que es nueva
      isNewTemplate: true
    };

    onUpdateFormData(newTemplateData);
    setShowCreateOptions(false);
    setSelectedFormForTemplate(null);
  };

  // Función para duplicar desde plantilla existente
  const handleDuplicateFromTemplate = async () => {
    if (!selectedTemplateForDuplicate) {
      alert('Por favor selecciona una plantilla para usar como base');
      return;
    }

    try {
      // Obtener los datos completos de la plantilla seleccionada
      const response = await fetch(`${API_BASE_URL}/plantillas/${selectedTemplateForDuplicate.formId}`);

      if (!response.ok) {
        throw new Error('Error al cargar la plantilla para duplicar');
      }

      const templateData = await response.json();

      // Crear objeto con TODOS los datos necesarios para la duplicación
      const duplicatedTemplate = {
        // Datos del formulario base (para el vínculo)
        id: selectedFormForTemplate.id,
        title: selectedFormForTemplate.title,
        section: selectedFormForTemplate.section,
        questions: selectedFormForTemplate.questions,

        // Datos COMPLETOS de la plantilla a duplicar
        documentTitle: `${templateData.documentTitle} (Copia)`,
        paragraphs: templateData.paragraphs ? templateData.paragraphs.map(p => ({
          ...p,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5)
        })) : [],
        signature1Text: templateData.signature1Text,
        signature2Text: templateData.signature2Text,

        // Campos que indican que es una duplicación
        isDuplication: true
      };

      // Pasar al editor con los datos duplicados
      onUpdateFormData(duplicatedTemplate);
      setShowCreateOptions(false);
      setSelectedFormForTemplate(null);
      setSelectedTemplateForDuplicate(null);

    } catch (error) {
      console.error('Error duplicando plantilla:', error);
      alert('Error al cargar la plantilla para duplicar: ' + error.message);
    }
  };

  // Función para editar plantilla existente
  const handleEditTemplate = (form) => {
    onUpdateFormData(form);
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

      {/* Modal de Opciones de Creación */}
      {showCreateOptions && selectedFormForTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-2xl mx-4 w-full">
            <div className="flex items-center space-x-3 mb-4">
              <Icon name="FileText" size={24} className="text-primary" />
              <h3 className="text-lg font-semibold">
                Crear Plantilla para: {selectedFormForTemplate.title}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Opción 1: Crear desde cero */}
              <div
                className="border-2 border-border rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={handleCreateFromScratch}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Icon name="FilePlus" size={20} className="text-primary" />
                  <h4 className="font-semibold">Crear desde Cero</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Comienza con una plantilla vacía y diseña todo el contenido desde cero.
                </p>
              </div>

              {/* Opción 2: Duplicar desde existente */}
              <div className="border-2 border-border rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Icon name="Copy" size={20} className="text-primary" />
                  <h4 className="font-semibold">Usar Plantilla Existente</h4>
                </div>

                {availableTemplates.length > 0 ? (
                  <div className="space-y-3">
                    <select
                      value={selectedTemplateForDuplicate?._id || ''}
                      onChange={(e) => {
                        const selected = availableTemplates.find(t => t._id === e.target.value);
                        setSelectedTemplateForDuplicate(selected);
                      }}
                      className="w-full p-2 border border-border rounded-md text-sm bg-background text-foreground" // AGREGADO: bg-background text-foreground
                    >
                      <option value="">Selecciona una plantilla...</option>
                      {availableTemplates.map(template => (
                        <option key={template._id} value={template._id}>
                          {template.formTitle}
                        </option>
                      ))}
                    </select>

                    <Button
                      variant="default"
                      onClick={handleDuplicateFromTemplate}
                      disabled={!selectedTemplateForDuplicate}
                      className="w-full"
                      iconName="Copy"
                      iconPosition="left"
                    >
                      Usar esta Plantilla
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay plantillas disponibles para duplicar.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateOptions(false);
                  setSelectedFormForTemplate(null);
                  setSelectedTemplateForDuplicate(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

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
        /* Tabla de Formularios */
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
                <th className="px-4 py-2 text-center">Eliminar</th>
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

                  {/* Columna Acción */}
                  <td className="px-4 py-3 text-center">
                    {form.formId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(form)}
                        iconName="Pen"
                        iconPosition="left"
                        className="w-full max-w-[160px]"
                      >
                        Editar Plantilla
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateTemplateClick(form)}
                        iconName="Dock"
                        iconPosition="left"
                        className="w-full max-w-[160px]"
                      >
                        Crear Plantilla
                      </Button>
                    )}
                  </td>

                  {/* Columna Eliminar */}
                  <td className="px-4 py-3 text-center">
                    {form.formId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTemplate(form.id, form.formId)}
                        disabled={deletingId === form.formId}
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        type="button"
                      >
                        {deletingId === form.formId ? (
                          <Icon name="Loader" size={14} className="animate-spin" />
                        ) : (
                          <Icon name="Trash2" size={14} />
                        )}
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