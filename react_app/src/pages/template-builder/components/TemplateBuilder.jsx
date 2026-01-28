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
  const [, setTick] = useState(0); // Force re-render for toolbars

  // --- Lógica de Firmas Dinámicas ---
  const getEffectiveSignatures = () => {
    if (templateData.signatures && Array.isArray(templateData.signatures)) return templateData.signatures;
    const sigs = [];
    // Migración Legacy: Si existen campos antiguos, úsalos
    if (templateData.signature1Text !== undefined || templateData.signature2Text !== undefined) {
      sigs.push({ title: templateData.signature1Title || "Empleador / Representante Legal", text: templateData.signature1Text || "" });
      sigs.push({ title: templateData.signature2Title || "Empleado", text: templateData.signature2Text || "" });
    } else {
      // Default Inicial (2 columnas vacías)
      sigs.push({ title: "Empleador / Representante Legal", text: "" });
      sigs.push({ title: "Empleado", text: "" });
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
    if (editor) {
      editor.chain().focus().insertContent(tag.toLowerCase()).run();
    }
  };

  const changeCase = (mode) => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) return;

    const text = editor.state.doc.textBetween(from, to);
    let newText = text;

    if (mode === 'upper') {
      newText = text.toUpperCase();
    } else if (mode === 'lower') {
      newText = text.toLowerCase();
    } else if (mode === 'default') {
      // Solo modificar si parece una variable (empieza con {{ y termina con }})
      if (/^{{.+}}$/.test(text)) {
        // Title Case para variables: Capitaliza primera letra de cada palabra
        newText = text.toLowerCase().replace(/(?:^|[\s_])\w/g, m => m.toUpperCase());
      }
    }

    editor.chain().focus().insertContent(newText).run();
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
            onClick={() => changeCase('upper')}
            title="Mayúsculas"
          >
            M ↑
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-8 text-[10px] font-bold ${getCasingClass('lower')}`}
            onClick={() => changeCase('lower')}
            title="Minúsculas"
          >
            m ↓
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-8 text-[10px] font-bold ${getCasingClass('default')}`}
            onClick={() => changeCase('default')}
            title="Default (Como se ingresó)"
          >
            d
          </Button>
        </div>

        {/* Estilos basicos */}
        <div className="flex bg-card border rounded-md p-0.5">
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive('bold') ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Icon name="Bold" size={14} />
          </Button>
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive('italic') ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Icon name="Italic" size={14} />
          </Button>
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive('underline') ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()}>
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

          <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold" onClick={() => addVariable('{{NUMERAL}}')} disabled={isPreview}>
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
            variant={templateData.includeSignature ? "default" : "outline"}
            size="sm"
            className={`h-8 text-[10px] font-bold ${templateData.includeSignature ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
            onClick={() => onUpdateTemplateData('includeSignature', !templateData.includeSignature)}
            disabled={isPreview}
            title={templateData.includeSignature ? "Quitar Zona de Firma" : "Agregar Zona de Firma"}
          >
            <Icon name="PenTool" size={12} className="mr-1" /> {templateData.includeSignature ? "FIRMA" : "+ FIRMA"}
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
                  {dynamicVariables.map((v) => {
                    const tag = `{{${v.title.toUpperCase().replace(/\s+/g, '_')}}}`;
                    const isSelectable = v.type?.toLowerCase().includes('select') ||
                      v.type?.toLowerCase().includes('drop') ||
                      v.type?.toLowerCase().includes('check') ||
                      v.type?.toLowerCase().includes('radio');

                    return (
                      <div key={v.id || v.title} className="mb-1">
                        <button
                          onClick={() => addVariable(tag)}
                          className={`w-full text-left px-3 py-2 text-[11px] border rounded shadow-sm transition-all truncate flex items-center gap-2 ${isSelectable
                            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800'
                            : 'bg-card hover:border-primary hover:bg-primary/5'
                            }`}
                          title={`${tag} (${v.type || 'Texto'})`}
                        >
                          <Icon
                            name={isSelectable ? "List" : "Type"}
                            size={12}
                            className={isSelectable ? "text-blue-500" : "text-muted-foreground group-hover:text-primary"}
                          />
                          <span className={`font-mono truncate ${isSelectable ? 'text-blue-700 dark:text-blue-300' : 'text-primary group-hover:text-primary-foreground'}`}>
                            {tag}
                          </span>
                        </button>

                        {isSelectable && v.options && v.options.length > 0 && (
                          <div className="ml-4 mt-1 border-l-2 border-blue-100 pl-2 space-y-1">
                            {v.options.map((opt, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const val = typeof opt === 'string' ? opt : opt.value || opt.label;
                                  // Insertar bloque condicional pre-armado
                                  const condBlock = `[[IF:${tag.replace(/[{}]/g, '')} == "${val}"]]`;
                                  const endBlock = `[[ENDIF]]`;
                                  editor.chain().focus().insertContent(`<p>${condBlock}</p><p>...</p><p>${endBlock}</p>`).run();
                                }}
                                className="w-full text-left text-[10px] text-muted-foreground hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded truncate flex items-center gap-1"
                                title={`Insertar condición: Si es "${typeof opt === 'string' ? opt : opt.val}"`}
                              >
                                <Icon name="GitBranch" size={10} />
                                <span className="truncate">{typeof opt === 'string' ? opt : opt.label || opt.value}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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

              {/* VISUALIZACIÓN DE FIRMAS (Solo si está activo) */}
              {templateData.includeSignature && (
                <div className="signature-area grid grid-cols-2 gap-x-8 gap-y-8 mt-8">
                  {signatures.map((sig, i) => {
                    const isLastAndOdd = (i === signatures.length - 1) && (signatures.length % 2 !== 0);
                    return (
                      <div
                        className={`signature-col flex flex-col items-center text-center ${isLastAndOdd ? 'col-span-2 place-self-center' : ''}`}
                        key={i}
                      >
                        <div className="signature-line font-bold mb-1">__________________________</div>
                        <div className="font-bold text-sm mb-1">{sig.title || "Firma"}</div>
                        {sig.text?.split('\n').map((line, j) => (
                          <div key={j} className="text-sm">{line}</div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ZONA DE CONFIGURACIÓN DE FIRMAS (Fuera del editor Tiptap) */}
        {/* ZONA DE CONFIGURACIÓN DE FIRMAS (Fuera del editor Tiptap) */}
        {!isPreview && templateData.includeSignature && (
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