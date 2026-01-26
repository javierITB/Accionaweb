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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Habilitamos negrita y cursiva
        underline: false,
      }),
      Underline,
      TextStyle,
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
    content: templateData.documentContent || '<p>Comienza a escribir el documento...</p>',
    onUpdate: ({ editor }) => {
      onUpdateTemplateData('documentContent', editor.getHTML());
    },
  });

  const addVariable = (tag) => {
    if (editor) {
      editor.chain().focus().insertContent(`<strong>${tag}</strong>`).run();
    }
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

        <div className="flex gap-1 ml-auto">
          <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold" onClick={() => addVariable('{{NUMERAL}}')}>
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
        <div className="flex-1 bg-muted/30 p-8 overflow-y-auto flex justify-center">
          <div className="w-full max-w-[850px] min-h-[1100px] bg-white shadow-2xl p-[2.5cm] rounded-sm border border-border">
            <style>{`
              .ProseMirror { outline: none; min-height: 100%; font-family: 'Arial', sans-serif; }
              .ProseMirror table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 1em 0; overflow: hidden; }
              .ProseMirror td, .ProseMirror th { min-width: 1em; border: 1px dashed #ccc; padding: 10px; vertical-align: top; box-sizing: border-box; position: relative; }
              .ProseMirror p { margin-bottom: 0.5em; line-height: 1.5; text-align: justify; }
              .ProseMirror .selectedCell:after { z-index: 2; background: rgba(200, 200, 255, 0.4); content: ""; position: absolute; left: 0; right: 0; top: 0; bottom: 0; pointer-events: none; }
            `}</style>
            <EditorContent editor={editor} className="prose prose-sm max-w-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentTemplateEditor;