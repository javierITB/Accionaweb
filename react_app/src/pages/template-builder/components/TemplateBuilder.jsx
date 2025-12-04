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
      className={`w-full flex flex-col items-start px-3 py-2 rounded-md text-xs transition-brand cursor-pointer text-left font-mono border border-transparent bg-white-50 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white dark:text-foreground ${isChild
        ? 'bg-white-50 hover:bg-gray-100 dark:hover:bg-secondary dark:text-foreground'
        : 'hover:bg-primary'
        }`}
      title={`Copiar variable ${generateVarTag(v.title || v.text)}`}
    >
      <span className={`font-semibold ${isChild ? 'text-xs' : 'text-sm'}`}>
        {generateVarTag(v.title || v.text)}
      </span>
      <span className={`text-xs opacity-80 ${isChild ? 'ml-1' : ''}`}>
        {v.title || v.text} {v.type && (" (" + v.type + ")")}
      </span>
    </button>
  );

  if (!hasSubVariables) {
    return renderSimpleVariable(variable);
  }

  if (variable.subformQuestions?.length === 1 && !variable.subformQuestions[0].options.length > 0) {
    return renderSimpleVariable(variable.subformQuestions[0]);
  }

  if (variable.options?.length === 1 && !variable.options[0].hasSubVariables && variable.options[0].options.length === 0) {
    return renderSimpleVariable(variable.options[0]);
  }

  if (variable.options && variable.options.length > 0) {

    let areOptionsFlat = true;

    for (const option of variable.options) {
      const optionHasSubVars = (option.hasSubform && option.subformQuestions.length > 0);

      if (optionHasSubVars) {
        areOptionsFlat = false;
        break;
      }
    }

    if (areOptionsFlat) {
      return renderSimpleVariable(variable);
    }
  }

  return (
    <div className={`w-full border border-border rounded-lg ${isOpen ? 'bg-primary/5 dark:bg-primary/10' : 'bg-card dark:bg-card'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 cursor-pointer text-left font-semibold text-sm hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
        title = {isOpen ? "Cerrar detalles de la variable" : "Abrir detalles de la variable"}
      >
        <div className="flex flex-col items-start">
          <span className="font-semibold text-sm">{variable.title || variable.text}</span>
          <span className="text-xs opacity-80 text-primary">{variable.title || variable.text} {variable.type && (" (" + variable.type + ")")}</span>
        </div>
        <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={14} className="text-primary" />
      </button>

      {isOpen && (
        <div className="p-2 space-y-1 border-t border-border dark:border-slate-700 ">
          {renderSimpleVariable(variable)}
          {variable.options && (variable.options)?.map((subVar) => (
            <VariableItem
              key={subVar.title}
              variable={subVar}
              copyVariable={copyVariable}
              isChild={true}
            />
          ))}
          {variable.subformQuestions && (variable.subformQuestions)?.map((subVar) => (
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
    onUpdate(paragraph.id, 'content', e.target.value);
  }, [paragraph.id, onUpdate]);

  const handleConditionalVarChange = useCallback((e) => {
    onUpdate(paragraph.id, 'conditionalVar', e.target.value);
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

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Variable Condicional (Opcional)
        </label>
        <Input
          type="text"
          placeholder="Ej: {{CAMPOS_OCUPACION}} (El párrafo se renderiza solo si esta variable tiene valor)"
          value={paragraph.conditionalVar || ''}
          onChange={handleConditionalVarChange}
        />
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

const DocumentTemplateEditor = ({
  dynamicVariables = [],
  staticVariables = [],
  templateData,
  onUpdateTemplateData,
  onAddParagraph,
  onUpdateParagraph,
  onDeleteParagraph,
  onMoveParagraph
}) => {

  const copyVariable = useCallback((tag) => {
    navigator.clipboard.writeText(tag).catch(() => {
      const tempInput = document.createElement('textarea');
      tempInput.value = tag;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
    });
  }, []);

  const [staticVarsExpanded, setStaticVarsExpanded] = useState(true);

  const paragraphEditors = useMemo(() =>
    templateData.paragraphs.map((paragraph, index) => (
      <ParagraphEditor
        key={paragraph.id}
        paragraph={paragraph}
        index={index}
        total={templateData.paragraphs.length}
        onUpdate={onUpdateParagraph}
        onDelete={onDeleteParagraph}
        onMove={onMoveParagraph}
      />
    )),
    [
      templateData.paragraphs,
      onUpdateParagraph,
      onDeleteParagraph,
      onMoveParagraph
    ]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-4 sticky top-6 shadow-brand dark:bg-gray max-h-[calc(90vh-10rem)] overflow-y-auto">
            <h3 className="font-semibold text-foreground mb-4">
              Variables Disponibles
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Haz clic para copiar la variable al portapapeles y pegarla en tu párrafo.
            </p>

            {dynamicVariables.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Variables del Formulario ({dynamicVariables.length})
                </h4>
                <div className="space-y-2">
                  {dynamicVariables.map((variable) => (
                    <VariableItem
                      variable={variable}
                      key={variable.title || variable.id}
                      copyVariable={copyVariable}
                    />
                  ))}
                </div>
              </div>
            )}

            {dynamicVariables.length > 0 && staticVariables.length > 0 && (
              <div className="border-t border-border my-4"></div>
            )}

            {staticVariables.length > 0 && (
              <div>
                <button
                  onClick={() => setStaticVarsExpanded(!staticVarsExpanded)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-foreground mb-2 hover:text-primary transition-colors p-2 rounded-md hover:bg-primary/5"
                  title = {staticVarsExpanded ? "Cerrar detalles de la variable" : "Abrir detalles de la variable"}
                >
                  <span>Variables Generales ({staticVariables.length})</span>
                  <Icon
                    name={staticVarsExpanded ? "ChevronUp" : "ChevronDown"}
                    size={14}
                    className="text-muted-foreground"
                  />
                </button>

                {staticVarsExpanded && (
                  <div className="space-y-2 bg-primary/5 rounded-lg p-2 dark:bg-primary/10">
                    {staticVariables.map((variable) => (
                      <button
                        key={variable.title}
                        onClick={() => copyVariable(generateVarTag(variable.title))}
                        className="w-full flex flex-col items-start px-3 py-2 rounded-md text-xs transition-brand cursor-pointer text-left font-mono border border-transparent bg-white-50 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white dark:text-foreground"
                        title = {`Copiar variable ${generateVarTag(variable.title)}`}
                      >
                        <span className="font-semibold text-sm">
                          {generateVarTag(variable.title)}
                        </span>
                        <span className="text-xs opacity-80">
                          {variable.title} {variable.type && `(${variable.type})`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  Disponibles en todas las plantillas
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6 max-h-[calc(90vh-10rem)] overflow-y-auto">
          <div className="bg-card border border-border rounded-lg p-6 shadow-brand">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Título del Documento
            </h3>
            <Input
              type="text"
              placeholder="Ej: Contrato de {{EMPLEADO_NOMBRE}}"
              value={templateData.documentTitle}
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
                onClick={onAddParagraph}
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
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Zona de Firmas
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Define el texto (ej. Nombre/Cargo) para cada una de las dos secciones de firma.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-sm mb-2">Firma 1 (Emisor/Empresa)</h4>
                <Textarea
                  value={templateData.signature1Text}
                  onChange={(e) => onUpdateTemplateData('signature1Text', e.target.value)}
                  rows={3}
                  placeholder="Ej: Nombre del Representante Legal.&#10;Rut: {{RUT_EMPRESA}}"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Este texto aparecerá bajo la línea de firma izquierda.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Firma 2 (Receptor/Empleado)</h4>
                <Textarea
                  value={templateData.signature2Text}
                  onChange={(e) => onUpdateTemplateData('signature2Text', e.target.value)}
                  rows={3}
                  placeholder="Ej: Nombre Completo del Empleado.&#10;Rut: {{RUT_DEL_EMPLEADO}}"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Este texto aparecerá bajo la línea de firma derecha.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DocumentTemplateEditor;