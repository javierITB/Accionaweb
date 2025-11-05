import React, { useState, useCallback, useRef, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const Input = React.forwardRef((props, ref) => (
  <input
    ref={ref}
    {...props}
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  />
));

const Textarea = React.forwardRef(({ className = '', ...props }, ref) => (
  <textarea
    ref={ref}
    {...props}
    className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y ${className}`}
  />
));

const generateVarTag = (title) => {
  if (!title) return '';

  let tag = title.toUpperCase();
  tag = tag.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  tag = tag.replace(/[^A-Z0-9]+/g, '_');
  tag = tag.replace(/^_+|_+$/g, '').replace(/__+/g, '_');
  return `{{${tag}}}`;
};

const VariableItem = React.memo(({ variable, copyVariable, isChild = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubVariables = (variable.options && variable.options.length > 0) || (variable.subformQuestions && variable.subformQuestions.length > 0);

  const renderSimpleVariable = (v) => v.type && (
    <button
      key={generateVarTag(v.title || v.text)}
      onClick={() => copyVariable(generateVarTag(v.title || v.text))}
      className={`w-full flex flex-col items-start px-3 py-2 rounded-md text-xs transition-brand cursor-pointer text-left font-mono hover:shadow-md border border-transparent bg-white-50 hover:bg-gray-100 dark:hover:bg-slate-600 dark:text-foreground ${v.color || ''} 
                  ${isChild
          ? 'bg-white-50 hover:bg-gray-100 dark:hover:bg-slate-600 dark:text-foreground'
          : ''}
                `}
    >
      <span className={`font-semibold ${isChild ? 'text-xs' : 'text-sm'}`}>{generateVarTag(v.title || v.text)} </span>
      <span className={`text-xs opacity-80 ${isChild ? 'ml-1' : ''}`}>{v.title || v.text} {v.type && (" (" + v.type + ")")}</span>
    </button>
  );

  if (!hasSubVariables) {
    return renderSimpleVariable(variable);
  }

  if (variable.subformQuestions?.length === 1) {
    return renderSimpleVariable(variable.subformQuestions[0]);
  }

  if (variable.options?.length === 1) {
    return renderSimpleVariable(variable.options[0]);
  }

  return (
    <div className={`w-full border border-border rounded-lg ${isOpen ? 'bg-primary/5 dark:bg-primary/10' : 'bg-card dark:bg-card'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 cursor-pointer text-left font-semibold text-sm hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
      >
        <div className="flex flex-col items-start">
          <span className="font-semibold text-sm">{variable.title || variable.text}</span>
          <span className="text-xs opacity-80 text-primary">{variable.title || variable.text} {variable.type && (" (" + variable.type + ")")}</span>
        </div>
        <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={14} className="text-primary" />
      </button>

      {isOpen && (
        <div className="p-2 space-y-1 border-t border-border dark:border-slate-700">
          {renderSimpleVariable(variable)}
          {variable.options && (variable.options)?.map((subVar) => (
            <VariableItem
              key={subVar.title}
              variable={subVar}
              copyVariable={copyVariable}
              isChild={true}
            />
          ))}
          {!variable.options && (variable.subformQuestions)?.map((subVar) => (
            <VariableItem
              key={subVar.title}
              variable={subVar}
              copyVariable={copyVariable}
              isChild={true}
            />
          ))}
        </div>
      )}
    </div>
  );
});

const ParagraphEditor = React.memo(({ paragraph, index, total, onUpdate, onDelete, onMove }) => {
  const textareaRef = useRef(null);

  const handleContentChange = useCallback((e) => {
    onUpdate(paragraph.id, e.target.value);
  }, [paragraph.id, onUpdate]);

  const handleMoveUp = useCallback(() => {
    onMove(paragraph.id, 'up');
  }, [paragraph.id, onMove]);

  const handleMoveDown = useCallback(() => {
    onMove(paragraph.id, 'down');
  }, [paragraph.id, onMove]);

  const handleDelete = useCallback(() => {
    onDelete(paragraph.id);
  }, [paragraph.id, onDelete]);

  return (
    <div className="bg-gray border border-border rounded-lg p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground">
          Párrafo {index + 1}
        </h4>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMoveUp}
            disabled={index === 0}
            className="h-8 w-8"
            type="button"
          >
            <Icon name="ChevronUp" size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMoveDown}
            disabled={index === total - 1}
            className="h-8 w-8"
            type="button"
          >
            <Icon name="ChevronDown" size={14} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            type="button"
          >
            <Icon name="Trash2" size={14} />
          </Button>
        </div>
      </div>

      <Textarea
        ref={textareaRef}
        value={paragraph.content}
        onChange={handleContentChange}
        rows={5}
        placeholder="Escribe el contenido del párrafo. Pega las variables copiadas aquí."
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
      />
    </div>
  );
});

// Ahora (usando todas las props relevantes):
const DocumentTemplateEditor = ({
  availableVariables = [],
  templateData, // <-- Recibe los datos del padre
  onUpdateTemplateData, // <-- Recibe el callback de actualización
  onAddParagraph, // <-- Usado en el editor
  onUpdateParagraph, // <-- Usado en el editor
  onDeleteParagraph, // <-- Usado en el editor
  onMoveParagraph // <-- Usado en el editor
}) => {

  
  const [isSaving, setIsSaving] = useState(false);

  // Callbacks estables usando useCallback
  const handleUpdateTemplate = useCallback((field, value) => {
    onUpdateTemplateData(field, value);
  }, [onUpdateTemplateData]);



  const copyVariable = useCallback((tag) => {
    navigator.clipboard.writeText(tag).catch(() => {
      // Fallback para navegadores antiguos
      const tempInput = document.createElement('textarea');
      tempInput.value = tag;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
    });
  }, []);


  // Memoizar la lista de ParagraphEditors
  const paragraphEditors = useMemo(() =>
    templateData.paragraphs.map((paragraph, index) => (
      <ParagraphEditor
        key={paragraph.id}
        paragraph={paragraph}
        index={index}
        total={templateData.paragraphs.length}
        // CRÍTICO: Usar las props del padre
        onUpdate={onUpdateParagraph}  // <--- ¡CORREGIDO! Usar la prop
        onDelete={onDeleteParagraph}  // <--- ¡CORREGIDO! Usar la prop
        onMove={onMoveParagraph}      // <--- ¡CORREGIDO! Usar la prop
      />
    )),
    // CRÍTICO: Las dependencias deben ser las props, no las funciones locales eliminadas
    [
      templateData.paragraphs, 
      onUpdateParagraph, 
      onDeleteParagraph, 
      onMoveParagraph // <- Dependencias limpias
    ]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-4 sticky top-6 shadow-brand dark:bg-gray">
            <h3 className="font-semibold text-foreground mb-4">
              Variables Disponibles
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Haz clic para copiar la variable al portapapeles y pegarla en tu párrafo.
            </p>
            <div className="space-y-2">
              {availableVariables.map((variable) => (
                <VariableItem
                  variable={variable}
                  key={variable.title}
                  copyVariable={copyVariable}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 shadow-brand">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Título del Documento
            </h3>
            <Input
              type="text"
              placeholder="Ej: Contrato de {{EMPLEADO_NOMBRE}}"
              value={templateData.title}
              onChange={(e) => onUpdateTemplateData('documentTitle', e.target.value)}
              className="w-full text-xl font-bold"
            />
          </div>

          <h3 className="text-lg font-semibold text-foreground">
            Contenido y Párrafos ({templateData.paragraphs?.length || 0})
          </h3>
          <div className="space-y-4">
            {paragraphEditors}
          </div>

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
                type="button"
              >
                Agregar Primer Párrafo
              </Button>
            </div>
          )}

          {templateData.paragraphs.length > 0 && (
            <div className="flex justify-center pt-2">
              <Button
                onClick={onAddParagraph}
                variant="outline"
                iconName="Plus"
                iconPosition="left"
                size="sm"
                type="button"
              >
                Añadir otro Párrafo
              </Button>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg p-6 shadow-brand">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Zona de Firma (Instrucciones o Mensaje)
            </h3>
            <Textarea
              value={templateData.signatureText}
              onChange={(e) => onUpdateTemplateData('signatureText', e.target.value)}
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