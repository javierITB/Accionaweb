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
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: false,
      }),
      Underline,
      Underline,
      // TextStyle ya incluido en FontSize
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

  const addVariable = (tag) => {
    if (editor) {
      editor.chain().focus().insertContent(`<strong>${tag}</strong>`).run();
    }
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

  const fontSizes = ['10px', '11px', '12px', '14px', '16px', '18px', '22px', '28px', '36px'];

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
          className="h-8 text-xs border rounded bg-card px-2 outline-none focus:ring-1 focus:ring-primary"
          onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
        >
          <option value="">Tamaño</option>
          {fontSizes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Estilos basicos */}
        <div className="flex bg-card border rounded-md p-0.5">
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive('bold') ? 'bg-primary/20' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Icon name="Bold" size={14} />
          </Button>
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive('italic') ? 'bg-primary/20' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Icon name="Italic" size={14} />
          </Button>
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive('underline') ? 'bg-primary/20' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <Icon name="Underline" size={14} />
          </Button>
        </div>

        {/* Alineacion */}
        <div className="flex bg-card border rounded-md p-0.5">
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive({ textAlign: 'left' }) ? 'bg-primary/20' : ''}`} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <Icon name="AlignLeft" size={14} />
          </Button>
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive({ textAlign: 'center' }) ? 'bg-primary/20' : ''}`} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <Icon name="AlignCenter" size={14} />
          </Button>
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-primary/20' : ''}`} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
            <Icon name="AlignJustify" size={14} />
          </Button>
        </div>

        {/* Tablas y Firmas */}
        <div className="flex bg-card border rounded-md p-0.5 gap-1 px-1 items-center">
          <Button variant="ghost" size="sm" className="h-7 text-[10px] flex items-center gap-1 border-r pr-2" onClick={() => editor.chain().focus().insertTable({ rows: 1, cols: 2, withHeaderRow: false }).run()}>
            <Icon name="Columns" size={14} /> Zona Firmas
          </Button>

          {editor.isActive('table') && (
            <div className="flex gap-1 pl-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => editor.chain().focus().deleteTable().run()} title="Eliminar Tabla">
                <Icon name="Trash2" size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().addColumnAfter().run()} title="Añadir Columna">
                <Icon name="ArrowRight" size={14} />
              </Button>
            </div>
          )}
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
              <h3 className="text-[10px] font-bold uppercase text-primary mb-3 tracking-widest flex items-center gap-2">
                <Icon name="Database" size={12} /> Variables Formulario
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {dynamicVariables.map(v => {
                  const tag = `{{${v.title.toUpperCase().replace(/\s+/g, '_')}}}`;
                  return (
                    <button
                      key={v.id || v.title}
                      onClick={() => addVariable(tag)}
                      className="text-left px-3 py-2 text-[11px] bg-card border rounded shadow-sm hover:border-primary hover:bg-primary/5 transition-all truncate group"
                      title={tag}
                    >
                      <span className="font-mono text-primary group-hover:text-primary-foreground">{tag}</span>
                    </button>
                  );
                })}
              </div>
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
                background-color: #f0f2f5; /* Fondo gris para resaltar la "hoja" */
                padding: 40px 0;
                display: flex;
                justify-content: center;
              }

              /* La "Hoja" de papel */
              .ProseMirror {
                outline: none;
                background: white;
                width: 216mm; /* Ancho Carta */
                min-height: 279mm; /* Alto Carta Mínimo */
                padding: 2.5cm; /* Márgenes físicos del documento */
                margin: 0 auto;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                position: relative;
                font-family: 'Arial', sans-serif;
              }

              /* Ajustes para tablas y párrafos */
              .ProseMirror p { margin-bottom: 0.5em; line-height: 1.5; text-align: justify; }
              .ProseMirror table { margin: 1em 0; border-collapse: collapse; table-layout: fixed; width: 100%; overflow: hidden; }
              .ProseMirror td, .ProseMirror th { min-width: 1em; border: 1px dashed ${isPreview ? 'transparent' : '#ccc'}; padding: 10px; vertical-align: top; box-sizing: border-box; position: relative; }
              .ProseMirror .selectedCell:after { z-index: 2; background: rgba(200, 200, 255, 0.4); content: ""; position: absolute; left: 0; right: 0; top: 0; bottom: 0; pointer-events: none; }

              /* Adaptación para Vista Previa */
              .preview-page {
                outline: none;
                background: white;
                width: 216mm;
                min-height: 279mm;
                padding: 2.5cm;
                margin: 0 auto;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                position: relative;
                font-family: 'Arial', sans-serif;
              }
            `}</style>

            {!isPreview ? (
              <EditorContent editor={editor} className="prose prose-sm max-w-none" />
            ) : (
              <div
                className="prose prose-sm max-w-none preview-page"
                dangerouslySetInnerHTML={{ __html: generatePreviewHtml(editor.getHTML()) }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentTemplateEditor;