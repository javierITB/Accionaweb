import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Image } from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

// Extension personalizada para tamaño de fuente
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize,
        renderHTML: attributes => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },
  addCommands() {
    return {
      ...this.parent?.(),
      setFontSize: size => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: size }).run();
      },
    };
  },
});



const generateVarTag = (str) => {
  if (!str) return "";
  return `{{${str.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')}}}`;
};

const VariableItem = React.memo(({ variable, copyVariable, isChild = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubVariables = (variable.options && variable.options.length > 0) || (variable.subformQuestions && variable.subformQuestions.length > 0);

  const renderSimpleVariable = (v) => {
    const rawLabel = v.title || v.text || v.value || v.label || (typeof v === 'string' ? v : "");
    const tag = generateVarTag(rawLabel);

    if (!tag) return null;

    return (
      <button
        key={tag}
        onClick={() => copyVariable(tag)}
        className={`w-full group text-left px-3 py-2 border rounded-md transition-all truncate
          ${isChild
            ? 'bg-muted/10 border-border/50 hover:bg-muted/20 text-[10px] ml-2 w-[calc(100%-8px)]'
            : 'bg-card dark:bg-[#1e293b] border-border dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-accent dark:hover:bg-slate-800 text-[11px]'
          }
        `}
        title={`Insertar ${tag} \n(${rawLabel})`}
      >
        <span className="font-mono font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
          {tag}
        </span>
      </button>
    );
  };

  if (!hasSubVariables) {
    return renderSimpleVariable(variable);
  }

  // Flatten logic
  if (variable.subformQuestions?.length === 1 && !variable.subformQuestions[0].options?.length) {
    return renderSimpleVariable(variable.subformQuestions[0]);
  }

  return (
    <div className={`w-full rounded-lg overflow-hidden transition-all mb-1 ${isOpen ? 'bg-accent/50 dark:bg-slate-900/50' : ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 cursor-pointer text-left transition-colors group border rounded-md
            ${isOpen ? 'bg-accent dark:bg-slate-800 border-transparent shadow-inner' : 'bg-card dark:bg-[#1e293b] border-border dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'}
        `}
      >
        <span className="font-mono font-medium text-[11px] truncate text-foreground/80 group-hover:text-foreground">
          {generateVarTag(variable.title || variable.text)}
        </span>
        <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={12} className="text-muted-foreground group-hover:text-foreground shrink-0 opacity-70" />
      </button>

      {isOpen && (
        <div className="p-1 space-y-1 mt-1 border-l border-border dark:border-slate-700 ml-3 pl-2">
          {renderSimpleVariable(variable)}

          {variable.options?.map((subVar, idx) => (
            <VariableItem
              key={subVar.id || idx}
              variable={subVar}
              copyVariable={copyVariable}
              isChild={true}
            />
          ))}
          {variable.subformQuestions?.map((subVar, idx) => (
            <VariableItem
              key={subVar.id || idx}
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

const DocumentTemplateEditor = ({
  dynamicVariables = [],
  staticVariables = [],
  templateData,
  onUpdateTemplateData,
  onSave
}) => {
  const [staticVarsExpanded, setStaticVarsExpanded] = useState(true);
  const [dynamicVarsExpanded, setDynamicVarsExpanded] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [, setTick] = useState(0);
  const [focusedField, setFocusedField] = useState({ type: 'editor' });

  // Estado para controlar la visibilidad del panel de configuración de firmas
  const [showSignatureConfig, setShowSignatureConfig] = useState(false);

  // Sincronizar includeSignature con la existencia de firmas
  React.useEffect(() => {
    const hasSignatures = templateData.signatures && templateData.signatures.length > 0;
    if (templateData.includeSignature !== hasSignatures) {
      onUpdateTemplateData('includeSignature', hasSignatures);
    }
  }, [templateData.signatures?.length, templateData.includeSignature]);

  // --- Lógica de Firmas Dinámicas ---
  const getEffectiveSignatures = () => {
    if (templateData.signatures && Array.isArray(templateData.signatures)) return templateData.signatures;
    const sigs = [];
    // Migración Legacy:
    if (templateData.signature1Text !== undefined || templateData.signature2Text !== undefined) {
      sigs.push({ title: templateData.signature1Title || "Empleador / Representante Legal", text: templateData.signature1Text || "", titleBold: true });
      sigs.push({ title: templateData.signature2Title || "Empleado", text: templateData.signature2Text || "", titleBold: true });
    } else {
      // Default Inicial (2 columnas vacías)
      sigs.push({ title: "Empleador / Representante Legal", text: "", titleBold: true });
      sigs.push({ title: "Empleado", text: "", titleBold: true });
    }
    return sigs;
  };

  const signatures = getEffectiveSignatures();

  const updateSignature = (index, field, value) => {
    const newSigs = [...signatures];
    newSigs[index] = { ...newSigs[index], [field]: value };
    onUpdateTemplateData('signatures', newSigs);
  };

  const addSignature = () => {
    const newSigs = [...signatures, { title: "Firma Adicional", text: "" }];
    onUpdateTemplateData('signatures', newSigs);
  };

  const removeSignature = (index) => {
    const newSigs = signatures.filter((_, i) => i !== index);
    onUpdateTemplateData('signatures', newSigs);
  };
  // ----------------------------------

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: false,
      }),
      Underline,
      FontFamily,
      FontSize,
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'tableCell', 'tableHeader']
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    onFocus: () => setFocusedField({ type: 'editor' }),
    content: templateData.documentContent || (templateData.paragraphs && templateData.paragraphs.length > 0
      ? templateData.paragraphs.map(p => {
        let text = p.content;
        if (p.conditionalVar) {
          return `<p>[[IF:${p.conditionalVar}]]${text}[[ENDIF]]</p>`;
        }
        return `<p>${text}</p>`;
      }).join('')
      : '<p>Comienza a escribir el documento...</p>'),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdateTemplateData('documentContent', html);

      // Extraer primera línea como título
      const titleText = editor.state.doc.firstChild?.textContent?.trim();
      if (titleText && titleText !== 'Comienza a escribir el documento...') {
        onUpdateTemplateData('documentTitle', titleText.substring(0, 50));
      }
    },
  });

  // Force re-render on selection change or transaction to update toolbar state
  React.useEffect(() => {
    if (!editor) return;
    const forceUpdate = () => setTick(t => t + 1);

    // Bind all relevant events
    editor.on('selectionUpdate', forceUpdate);
    editor.on('transaction', forceUpdate);
    editor.on('focus', forceUpdate);
    editor.on('blur', forceUpdate);

    return () => {
      editor.off('selectionUpdate', forceUpdate);
      editor.off('transaction', forceUpdate);
      editor.off('focus', forceUpdate);
      editor.off('blur', forceUpdate);
    };
  }, [editor]);

  const getCasingClass = (mode) => {
    if (!editor || editor.state.selection.empty) return '';
    const text = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);
    if (!text) return '';

    const hasUpper = /[A-ZÁÉÍÓÚÑ]/.test(text);
    const hasLower = /[a-záéíóúñ]/.test(text);

    if (mode === 'upper') return (hasUpper && !hasLower) ? 'bg-blue-600 text-white' : '';
    if (mode === 'lower') return (hasLower && !hasUpper) ? 'bg-blue-600 text-white' : '';
    if (mode === 'default') return (hasUpper && hasLower) ? 'bg-blue-600 text-white' : '';
    return '';
  };

  const addVariable = (tag) => {
    if (focusedField.type === 'signature') {
      const { index, field } = focusedField;
      const currentText = signatures[index][field] || "";
      // Append variable with a space if not empty
      const spacer = currentText.length > 0 && !currentText.endsWith(' ') ? " " : "";
      updateSignature(index, field, currentText + spacer + tag);
    } else {
      if (editor) {
        editor.chain().focus().insertContent(tag).run();
      }
    }
  };

  const changeCase = (mode) => {
    // 1. Manejo para Firmas (Inputs nativos)
    if (focusedField.type === 'signature') {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        const { selectionStart, selectionEnd, value } = activeEl;

        if (selectionStart === selectionEnd) return;

        const before = value.substring(0, selectionStart);
        const selected = value.substring(selectionStart, selectionEnd);
        const after = value.substring(selectionEnd);
        const { index, field } = focusedField;

        let newSelected = selected;
        if (mode === 'upper') {
          newSelected = selected.toUpperCase();
        } else if (mode === 'lower') {
          newSelected = selected.toLowerCase();
        } else if (mode === 'default') {
          newSelected = selected.toLowerCase().replace(/(?:^|[\s_])\w/g, m => m.toUpperCase());
        }

        if (newSelected !== selected) {
          const newValue = before + newSelected + after;
          updateSignature(index, field, newValue);

          setTimeout(() => {
            if (activeEl) {
              activeEl.value = newValue;
              activeEl.setSelectionRange(selectionStart, selectionEnd);
            }
          }, 0);
        }
      }
      return;
    }

    // 2. Manejo para Editor
    if (!editor) return;
    const { state, view } = editor;
    const { from, to, empty } = state.selection;
    if (empty) return;

    const tr = state.tr;

    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.isText) {
        const start = Math.max(from, pos);
        const end = Math.min(to, pos + node.nodeSize);

        if (start < end) {
          const content = node.text.substring(start - pos, end - pos);
          let newContent = content;

          if (mode === 'upper') {
            newContent = content.toUpperCase();
          } else if (mode === 'lower') {
            newContent = content.toLowerCase();
          } else if (mode === 'default') {
            if (content.trim().startsWith('{{') || /^{{.+}}$/.test(content)) {
              newContent = content.toLowerCase().replace(/(?:^|[\s_])\w/g, m => m.toUpperCase());
            } else {
              newContent = content.toLowerCase().replace(/(?:^|[\s])\w/g, m => m.toUpperCase());
            }
          }

          if (newContent !== content) {
            tr.replaceWith(start, end, state.schema.text(newContent, node.marks));
          }
        }
      }
      return true;
    });

    if (tr.docChanged) {
      view.dispatch(tr);
    }
  };

  const toggleStyle = (style) => {
    if (focusedField.type === 'signature') {
      const { index, field } = focusedField;
      if (!field) return;

      const propName = `${field}${style.charAt(0).toUpperCase() + style.slice(1)}`;
      const currentVal = signatures[index][propName];
      updateSignature(index, propName, !currentVal);
    } else {
      if (!editor) return;
      if (style === 'bold') editor.chain().focus().toggleBold().run();
      if (style === 'italic') editor.chain().focus().toggleItalic().run();
      if (style === 'underline') editor.chain().focus().toggleUnderline().run();
    }
  };

  const isStyleActive = (style) => {
    if (focusedField.type === 'signature') {
      const { index, field } = focusedField;
      if (!field) return false;
      const propName = `${field}${style.charAt(0).toUpperCase() + style.slice(1)}`;
      return !!signatures[index]?.[propName];
    }
    if (!editor) return false;
    return editor.isActive(style);
  };

  // Efecto para controlar modo solo lectura (Vista Previa)
  React.useEffect(() => {
    if (editor) {
      editor.setEditable(!isPreview);
    }
  }, [editor, isPreview]);

  const generatePreviewHtml = (html) => {
    let content = html;

    // 1. Eliminar etiquetas de condicionales
    content = content.replace(/<p>\[\[IF:.*?\]\]<\/p>/g, '');
    content = content.replace(/<p>\[\[ENDIF\]\]<\/p>/g, '');
    content = content.replace(/\[\[IF:.*?\]\]/g, '');
    content = content.replace(/\[\[ENDIF\]\]/g, '');

    const ORDINALES = [
      "", "PRIMERO", "SEGUNDO", "TERCERO", "CUARTO", "QUINTO",
      "SEXTO", "SÉPTIMO", "OCTAVO", "NOVENO", "DÉCIMO",
      "UNDÉCIMO", "DUODÉCIMO", "DÉCIMO TERCERO", "DÉCIMO CUARTO",
      "DÉCIMO QUINTO", "DÉCIMO SEXTO", "DÉCIMO SÉPTIMO",
      "DÉCIMO OCTAVO", "DÉCIMO NOVENO", "VIGÉSIMO"
    ];
    let contadorNumeral = 1;

    // 2. Reemplazar variables
    content = content.replace(/{{([^}]+)}}/g, (match, varName) => {
      if (varName === 'NUMERAL') {
        const ordinal = ORDINALES[contadorNumeral] || `${contadorNumeral}°`;
        contadorNumeral++;
        return `<span class="font-bold text-black">${ordinal}</span>`;
      }
      return `<span class="text-gray-800 bg-gray-100 px-1 rounded" title="Variable: ${varName}">${varName.replace(/_/g, ' ')}</span>`;
    });

    return content;
  };

  if (!editor) return null;

  const fontFamilies = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Georgia', value: 'Georgia' }
  ];

  const fontSizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'];

  return (
    <div className={`flex flex-col border rounded-xl bg-background shadow-lg overflow-hidden border-border transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-50 h-screen m-0 rounded-none' : 'h-[calc(100vh-140px)]'}`}>

      {/* BARRA DE HERRAMIENTAS */}
      <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-muted/20">

        {/* Botones de Control Global */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
          >
            <Icon name={isFullScreen ? "Minimize" : "Maximize"} size={16} />
          </Button>

        </div>
        <select
          className="h-8 text-xs border rounded bg-card px-2 outline-none focus:ring-1 focus:ring-primary"
          onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        >
          <option value="">Fuente</option>
          {fontFamilies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        <select
          className="h-8 text-xs border rounded bg-card px-2 outline-none focus:ring-1 focus:ring-primary w-20"
          value={editor.getAttributes('textStyle').fontSize ? String(editor.getAttributes('textStyle').fontSize).replace('pt', '').replace('px', '') : ''}
          onChange={(e) => {
            const val = e.target.value;
            // Si selecciona "Tamaño", no hace nada o borra
            if (!val) {
              editor.chain().focus().setMark('textStyle', { fontSize: null }).run();
            } else {
              editor.chain().focus().setFontSize(`${val}pt`).run();
            }
          }}
        >
          <option value="">Tam.</option>
          {fontSizes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Mayúsculas / Minúsculas / Default */}
        <div className="flex bg-card border rounded-md p-0.5 gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-8 text-[10px] font-bold ${getCasingClass('upper')}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => changeCase('upper')}
            title="Mayúsculas"
          >
            M ↑
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-8 text-[10px] font-bold ${getCasingClass('lower')}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => changeCase('lower')}
            title="Minúsculas"
          >
            m ↓
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-8 text-[10px] font-bold ${getCasingClass('default')}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => changeCase('default')}
            title="Default (Como se ingresó)"
          >
            d
          </Button>
        </div>

        {/* Estilos basicos */}
        <div className="flex bg-card border rounded-md p-0.5">
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${isStyleActive('bold') ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`} onClick={() => toggleStyle('bold')}>
            <Icon name="Bold" size={14} />
          </Button>
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${isStyleActive('italic') ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`} onClick={() => toggleStyle('italic')}>
            <Icon name="Italic" size={14} />
          </Button>
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${isStyleActive('underline') ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`} onClick={() => toggleStyle('underline')}>
            <Icon name="Underline" size={14} />
          </Button>
        </div>

        {/* Alineacion */}
        <div className="flex bg-card border rounded-md p-0.5">
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <Icon name="AlignLeft" size={14} />
          </Button>
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <Icon name="AlignCenter" size={14} />
          </Button>
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
            <Icon name="AlignJustify" size={14} />
          </Button>
        </div>





        <div className="flex gap-1 ml-auto items-center">
          <div className="flex items-center gap-2 mr-3 border-r pr-3">
            <span className={`text-[10px] font-bold ${!isPreview ? 'text-primary' : 'text-muted-foreground'}`}>EDICIÓN</span>
            <button
              className={`w-9 h-5 rounded-full px-0.5 transition-colors duration-200 flex items-center ${isPreview ? 'bg-primary' : 'bg-slate-300'}`}
              onClick={() => setIsPreview(!isPreview)}
              title="Alternar Vista Previa"
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${isPreview ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
            <span className={`text-[10px] font-bold ${isPreview ? 'text-primary' : 'text-muted-foreground'}`}>VISTA PREVIA</span>
          </div>

          <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold" onClick={() => {
            if (focusedField.type === 'signature') {
              addVariable('{{NUMERAL}}');
            } else {
              editor.chain().focus().setMark('bold').insertContent('{{NUMERAL}}').unsetMark('bold').run();
            }
          }} disabled={isPreview}>
            + NUMERAL
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold border-blue-200 text-blue-600" onClick={() => {
            const cond = prompt("Variable para condicionar (IF):");
            if (cond) {
              const tagStart = `[[IF:${cond.toUpperCase()}]]`;
              const tagEnd = `[[ENDIF]]`;

              if (editor.state.selection.empty) {
                editor.chain().focus().insertContent(`<p>${tagStart}</p><p>Contenido...</p><p>${tagEnd}</p>`).run();
              } else {
                const { from, to } = editor.state.selection;
                editor.chain().focus()
                  .insertContentAt(to, `<p>${tagEnd}</p>`)
                  .insertContentAt(from, `<p>${tagStart}</p>`)
                  .run();
              }
            }
          }}>
            + CONDICIONAL
          </Button>
          <Button
            variant={showSignatureConfig ? "default" : "outline"}
            size="sm"
            className={`h-8 text-[10px] font-bold ${showSignatureConfig ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
            onClick={() => setShowSignatureConfig(!showSignatureConfig)}
            disabled={isPreview}
            title={showSignatureConfig ? "Ocultar Configuración de Firmas" : "Configurar Firmas"}
          >
            <Icon name="PenTool" size={12} className="mr-1" /> {showSignatureConfig ? "FIRMA" : "+ FIRMA"}
          </Button>

          {isFullScreen && onSave && (
            <Button
              variant="default"
              size="sm"
              className="h-8 text-[10px] px-3 gap-1 bg-blue-600 hover:bg-blue-700 text-white ml-2 shadow-sm"
              onClick={onSave}
              title="Guardar Plantilla"
            >
              <Icon name="Save" size={12} /> GUARDAR
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* PANEL LATERAL DE VARIABLES */}
        <div className="w-72 border-r bg-muted/5 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Variables del Formulario */}
            <div>
              <button
                onClick={() => setDynamicVarsExpanded(!dynamicVarsExpanded)}
                className="w-full flex items-center justify-between text-[10px] font-bold uppercase text-primary mb-3 tracking-widest hover:bg-primary/10 p-1 rounded transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Icon name="Database" size={12} /> Variables Formulario
                </span>
                <Icon name={dynamicVarsExpanded ? "ChevronUp" : "ChevronDown"} size={12} />
              </button>

              {dynamicVarsExpanded && (
                <div className="grid grid-cols-1 gap-1.5 animate-in slide-in-from-top-1 fade-in duration-200">
                  {dynamicVariables.map((v) => (
                    <VariableItem
                      key={v.id || v.title}
                      variable={v}
                      copyVariable={addVariable}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Variables Generales Reintegradas */}
            <div>
              <button
                onClick={() => setStaticVarsExpanded(!staticVarsExpanded)}
                className="w-full flex items-center justify-between text-[10px] font-bold uppercase text-orange-600 mb-3 tracking-widest hover:bg-orange-50 p-1 rounded transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Icon name="Globe" size={12} /> Variables Generales
                </span>
                <Icon name={staticVarsExpanded ? "ChevronUp" : "ChevronDown"} size={12} />
              </button>

              {staticVarsExpanded && (
                <div className="grid grid-cols-1 gap-1.5 animate-in fade-in slide-in-from-top-1">
                  {staticVariables.map(v => {
                    const tag = `{{${v.title.toUpperCase().replace(/\s+/g, '_')}}}`;
                    return (
                      <button
                        key={v.title}
                        onClick={() => addVariable(tag)}
                        className="text-left px-3 py-2 text-[11px] bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded shadow-sm hover:bg-orange-500 hover:text-white dark:hover:bg-orange-600 transition-all truncate"
                        title={tag}
                      >
                        <span className="font-mono text-orange-700 dark:text-orange-300">{tag}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AREA DE EDICION (HOJA) */}
        <div className="editor-paper-container flex-1 bg-muted/30 overflow-y-auto">
          <div className={`w-full max-w-[216mm] transition-all ${isPreview ? 'scale-[1.02]' : ''}`}>
            <style>{`
              /* Contenedor del área de edición */
              .editor-paper-container {
                background-color: #f0f2f5; 
                padding: 40px 0;
                display: flex;
                justify-content: center;
              }

              /* La "Hoja" Visual (Contenedor Padre) */
              .visual-page {
                background: white;
                width: 216mm; /* Ancho Carta */
                min-height: 279mm; /* Alto Carta Mínimo */
                padding: 2.5cm; /* Márgenes físicos del documento */
                margin: 0 auto;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                position: relative;
                font-family: 'Arial', sans-serif;
                display: flex;
                flex-direction: column;
              }

              /* El Editor Tiptap (Contenido) */
              .ProseMirror {
                outline: none;
                flex: 1; /* Ocupa el espacio disponible */
              }
              
              /* Vista Previa (Contenido) */
              .preview-page {
                outline: none;
                flex: 1;
              }

              /* Ajustes para tablas y párrafos */
              .ProseMirror p { margin-bottom: 0.5em; line-height: 1.5; text-align: justify; }
              .ProseMirror table { margin: 1em 0; border-collapse: collapse; table-layout: fixed; width: 100%; overflow: hidden; }
              .ProseMirror td, .ProseMirror th { min-width: 1em; border: 1px dashed ${isPreview ? 'transparent' : '#ccc'}; padding: 10px; vertical-align: top; box-sizing: border-box; position: relative; }
              .ProseMirror .selectedCell:after { z-index: 2; background: rgba(200, 200, 255, 0.4); content: ""; position: absolute; left: 0; right: 0; top: 0; bottom: 0; pointer-events: none; }

              /* Área Visual de Firmas */
              .signature-area {
                margin-top: 50px;
                padding-top: 20px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                page-break-inside: avoid;
                color: black; /* FORZAR CONTRASTE */
                border-top: 1px dashed #eee; /* Guía visual sutil */
              }
              .signature-col {
                text-align: center;
                font-size: 12px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
              }
              .signature-line {
                font-weight: bold;
                margin-bottom: 8px;
              }
            `}</style>

            <div className={`visual-page ${isPreview ? 'scale-[1.02]' : ''}`}>
              {!isPreview ? (
                <EditorContent editor={editor} className="prose prose-sm max-w-none flex-1" />
              ) : (
                <div
                  className="prose prose-sm max-w-none preview-page"
                  dangerouslySetInnerHTML={{ __html: generatePreviewHtml(editor.getHTML()) }}
                />
              )}

              {/* VISUALIZACIÓN DE FIRMAS (Si hay firmas definidas) */}
              {signatures.length > 0 && (
                <div className="signature-area grid grid-cols-2 gap-x-8 gap-y-8 mt-8">
                  {signatures.map((sig, i) => {
                    const isLastAndOdd = (i === signatures.length - 1) && (signatures.length % 2 !== 0);
                    return (
                      <div
                        className={`signature-col flex flex-col items-center text-center ${isLastAndOdd ? 'col-span-2 place-self-center' : ''}`}
                        key={i}
                      >
                        <div className="signature-line font-bold mb-1">__________________________</div>
                        <div className={`text-sm mb-1 ${sig.titleBold ? 'font-bold' : ''} ${sig.titleItalic ? 'italic' : ''} ${sig.titleUnderline ? 'underline' : ''}`}>
                          {sig.title || "Firma"}
                        </div>
                        <div className={`${sig.textBold ? 'font-bold' : ''} ${sig.textItalic ? 'italic' : ''} ${sig.textUnderline ? 'underline' : ''}`}>
                          {sig.text?.split('\n').map((line, j) => (
                            <div key={j} className="text-sm">{line}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ZONA DE CONFIGURACIÓN DE FIRMAS (Fuera del editor Tiptap) */}
        {!isPreview && showSignatureConfig && (
          <div className="w-72 border-l bg-muted/5 p-4 overflow-y-auto animate-in slide-in-from-right-2 duration-300">
            <h3 className="text-[10px] font-bold uppercase text-primary mb-3 tracking-widest flex items-center gap-2">
              <Icon name="PenTool" size={12} /> Configuración de Firmas
            </h3>
            <div className="space-y-4">
              {signatures.map((sig, i) => (
                <div key={i} className="relative p-3 border rounded-md bg-card shadow-sm group hover:border-primary/50 transition-colors">
                  <button
                    onClick={() => removeSignature(i)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Eliminar esta firma"
                  >
                    <Icon name="Trash" size={12} />
                  </button>

                  <div className="mb-3">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Título</label>
                    <input
                      className="w-full text-xs border rounded px-2 py-1 focus:ring-1 focus:ring-primary outline-none bg-background text-foreground placeholder:text-muted-foreground/50"
                      value={sig.title || ''}
                      onChange={(e) => updateSignature(i, 'title', e.target.value)}
                      onFocus={() => setFocusedField({ type: 'signature', index: i, field: 'title' })}
                      placeholder="Ej: Empleado"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Contenido</label>
                    <textarea
                      className="w-full h-24 text-xs border rounded-md p-2 resize-none focus:ring-1 focus:ring-primary outline-none bg-background text-foreground placeholder:text-muted-foreground/50 font-mono"
                      placeholder="Variables, RUT, etc..."
                      value={sig.text || ''}
                      onChange={(e) => updateSignature(i, 'text', e.target.value)}
                      onFocus={() => setFocusedField({ type: 'signature', index: i, field: 'text' })}
                    />
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed text-primary hover:bg-primary/5 h-8 text-[10px]"
                onClick={addSignature}
              >
                + Agregar Firma
              </Button>
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default DocumentTemplateEditor;