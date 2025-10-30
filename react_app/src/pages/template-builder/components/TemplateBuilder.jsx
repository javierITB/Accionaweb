import React, { useState, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
// Usaremos Input simple en lugar de importar un componente externo para simplificar el ejemplo
const Input = (props) => <input {...props} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />;
const Textarea = (props) => <textarea {...props} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />;

// ********************************************************
// 💡 CAMBIO PRINCIPAL: Recibir 'availableVariables' por props
// ********************************************************

const DocumentTemplateEditor = ({ availableVariables = [] }) => {
  // 💡 ELIMINAR: Ya no necesitamos MOCK_VARIABLES ni la línea de asignación
  // const MOCK_VARIABLES  = availableVariables 

  const [templateData, setTemplateData] = useState({
    title: 'Contrato de Trabajo - {{EMPLEADO_NOMBRE}}',
    paragraphs: [
      { id: 'p1', content: 'Mediante el presente documento se establece que la empresa {{COMPANIA_NOMBRE}}, RUT {{COMPANIA_RUT}}, contrata a {{EMPLEADO_NOMBRE}}, RUT {{EMPLEADO_RUT}}, a partir de la fecha {{FECHA_INICIO}}.' },
      { id: 'p2', content: 'El empleado desempeñará el cargo de {{CARGO_CONTRATADO}} con un salario base de {{SALARIO_BASE}}.' },
    ],
    signatureText: 'Declaro haber leído y aceptado los términos de este contrato.',
  });

  const [lastId, setLastId] = useState(2); // Para generar IDs únicos
  const [isSaving, setIsSaving] = useState(false);

  // --- Lógica del Array Dinámico de Párrafos ---

  const handleUpdateTemplate = useCallback((field, value) => {
    setTemplateData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAddParagraph = useCallback(() => {
    const newId = `p${lastId + 1}`;
    setTemplateData(prev => ({
      ...prev,
      paragraphs: [...prev.paragraphs, { id: newId, content: '' }]
    }));
    setLastId(prev => prev + 1);
  }, [lastId]);

  const handleUpdateParagraph = useCallback((id, content) => {
    setTemplateData(prev => ({
      ...prev,
      paragraphs: prev.paragraphs.map(p => p.id === id ? { ...p, content } : p)
    }));
  }, []);

  const handleDeleteParagraph = useCallback((id) => {
    if (templateData.paragraphs.length <= 1) {
      alert("La plantilla debe tener al menos un párrafo.");
      return;
    }
    setTemplateData(prev => ({
      ...prev,
      paragraphs: prev.paragraphs.filter(p => p.id !== id)
    }));
  }, [templateData.paragraphs.length]);

  const handleMoveParagraph = useCallback((id, direction) => {
    const paragraphs = templateData.paragraphs;
    const index = paragraphs.findIndex(p => p.id === id);
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < paragraphs.length) {
      const newParagraphs = [...paragraphs];
      [newParagraphs[index], newParagraphs[newIndex]] = [newParagraphs[newIndex], newParagraphs[index]];
      setTemplateData(prev => ({ ...prev, paragraphs: newParagraphs }));
    }
  }, [templateData.paragraphs]);

  // --- Manejo del Copiado de Variables ---

  const copyVariable = (tag) => {
    // Usamos document.execCommand('copy') como fallback para entornos sandboxed
    const tempInput = document.createElement('textarea');
    tempInput.value = tag;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    alert(`Variable ${tag} copiada al portapapeles.`);
  };
  
  // --- Simulación de Guardado ---
  
  const handleSaveTemplate = async () => {
      if (!templateData.title || templateData.paragraphs.some(p => !p.content.trim())) {
          alert('El título y todos los párrafos deben tener contenido.');
          return;
      }
      
      setIsSaving(true);
      console.log("Guardando Plantilla:", templateData);

      // Simulación de llamada API PUT/POST para guardar la plantilla
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      setIsSaving(false);
      alert('¡Plantilla de contrato guardada exitosamente!');
  };


  // --- Renderizado del Párrafo ---

  const ParagraphEditor = ({ paragraph, index, total }) => (
    <div className="bg-white border border-border rounded-lg p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground">
          Párrafo {index + 1}
        </h4>
        <div className="flex items-center space-x-2">
          {/* Botones de Mover */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMoveParagraph(paragraph.id, 'up')}
            disabled={index === 0}
            className="h-8 w-8"
          >
            <Icon name="ChevronUp" size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMoveParagraph(paragraph.id, 'down')}
            disabled={index === total - 1}
            className="h-8 w-8"
          >
            <Icon name="ChevronDown" size={14} />
          </Button>

          {/* Botón Eliminar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteParagraph(paragraph.id)}
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Icon name="Trash2" size={14} />
          </Button>
        </div>
      </div>
      
      {/* Editor de Contenido del Párrafo */}
      <Textarea
        value={paragraph.content}
        onChange={(e) => handleUpdateParagraph(paragraph.id, e.target.value)}
        rows={5}
        placeholder="Escribe el contenido del párrafo. Pega las variables copiadas aquí."
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
      />
    </div>
  );


  // -----------------------------------------------------
  // RENDERIZADO PRINCIPAL
  // -----------------------------------------------------

  return (
    <div className="p-6 space-y-6">
    
      {/* 📐 ESTRUCTURA DE LA GRILLA (1/4 y 3/4) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* COLUMNA IZQUIERDA: VARIABLES DISPONIBLES (lg:col-span-1) */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-4 sticky top-6 shadow-brand">
            <h3 className="font-semibold text-foreground mb-4">
              Variables Disponibles
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
                Haz clic para copiar la variable al portapapeles y pegarla en tu párrafo.
            </p>
            <div className="space-y-2">
              {/* ******************************************************** */}
              {/* 💡 CAMBIO: Usar la prop 'availableVariables' aquí */}
              {/* ******************************************************** */}
              {availableVariables.map((variable) => (
                <button
                  key={variable.var} // 💡 Usar 'var' como key, ya que es el campo de la variable en el padre
                  onClick={() => copyVariable(variable.var)} // 💡 Usar 'var' para el valor a copiar
                  // ********************************************************
                  // Nota: Si quieres mantener el color, el objeto variable del padre
                  // debe incluir el campo `color`. Si no lo incluye, `variable.color`
                  // resultará en una clase vacía o `undefined`. Lo he dejado como
                  // estaba en el mock original por si lo añades.
                  // ********************************************************
                  className={`w-full flex flex-col items-start px-3 py-2 rounded-md text-xs transition-brand cursor-pointer text-left font-mono ${variable.color || ''} hover:shadow-md border border-transparent hover:border-primary/50`}
                >
                  <span className="font-semibold text-sm">{variable.name}</span>
                  <span className="text-xs opacity-80">{variable.var}</span> {/* 💡 Usar 'var' para mostrar el tag */}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: EDITOR DE ESTRUCTURA (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* 1. TÍTULO DEL DOCUMENTO */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-brand">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Título del Documento
            </h3>
            <Input
              type="text"
              placeholder="Ej: Contrato de {{EMPLEADO_NOMBRE}}"
              value={templateData.title}
              onChange={(e) => handleUpdateTemplate('title', e.target.value)}
              className="w-full text-xl font-bold"
            />
          </div>

          {/* 2. PÁRRAFOS DINÁMICOS */}
          <h3 className="text-lg font-semibold text-foreground">
            Contenido y Párrafos ({templateData.paragraphs.length})
          </h3>
          <div className="space-y-4">
            {templateData.paragraphs.map((paragraph, index) => (
              <ParagraphEditor
                key={paragraph.id}
                paragraph={paragraph}
                index={index}
                total={templateData.paragraphs.length}
              />
            ))}
          </div>
          
          {/* Clic para añadir el primer párrafo */}
          {templateData.paragraphs.length === 0 && (
             <div className="text-center py-12 bg-card border border-border rounded-lg">
                <Icon name="FileText" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground mb-4">
                    Comienza a crear la plantilla
                </h3>
                <Button
                    onClick={handleAddParagraph}
                    iconName="Plus"
                    iconPosition="left"
                    variant="default"
                >
                    Agregar Primer Párrafo
                </Button>
            </div>
          )}

          {/* Botón de adición rápida de párrafos (después de la lista) */}
          {templateData.paragraphs.length > 0 && (
            <div className="flex justify-end pt-2">
                <Button 
                    onClick={handleAddParagraph} 
                    variant="outline" 
                    iconName="Plus" 
                    iconPosition="left"
                    disabled={isSaving}
                    size="sm"
                >
                    Añadir otro Párrafo
                </Button>
            </div>
          )}

          {/* 3. ZONA DE FIRMA */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-brand">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Zona de Firma (Instrucciones o Mensaje)
            </h3>
            <Textarea
              value={templateData.signatureText}
              onChange={(e) => handleUpdateTemplate('signatureText', e.target.value)}
              rows={3}
              placeholder="Ej: Acepto los términos y condiciones de este documento."
              className="w-full"
            />
             <p className="text-xs text-muted-foreground mt-2">
                Este texto aparecerá antes del bloque de firma digital.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentTemplateEditor;