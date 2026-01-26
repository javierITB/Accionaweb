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
  onUpdateTemplateData
}) => {
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: false,
        bold: false,
        italic: false,
      }),
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    // Migración: Si venimos de párrafos, los unimos. Si ya es HTML, lo usamos.
    content: templateData.documentContent || 
             (templateData.paragraphs?.length > 0 
              ? templateData.paragraphs.map(p => `<p>${p.content}</p>`).join('') 
              : ''),
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
    <div className="flex flex-col h-[calc(100vh-250px)] border rounded-xl bg-background shadow-lg overflow-hidden border-border">
      
      {/* TOOLBAR PROFESIONAL */}
      <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-muted/20">
        
        {/* Selector de Fuente */}
        <select 
          className="h-8 text-xs border rounded bg-card px-2 outline-none focus:ring-1 focus:ring-primary"
          onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        >
          <option value="">Fuente</option>
          {fontFamilies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        {/* Selector de Tamaño */}
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
            if(cond) editor.chain().focus().insertContent(`<p>[[IF:${cond.toUpperCase()}]]</p><p>Escribir contenido condicional aqui...</p><p>[[ENDIF]]</p>`).run();
          }}>
            + CONDICIONAL
          </Button>
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
              <h3 className="text-[10px] font-bold uppercase text-orange-500 mb-3 tracking-widest">Generales</h3>
              <div className="grid grid-cols-1 gap-1.5">
                {staticVariables.map(v => {
                  const tag = `{{${v.title.toUpperCase().replace(/\s+/g, '_')}}}`;
                  return (
                    <button
                      key={v.title}
                      onClick={() => addVariable(tag)}
                      className="text-left px-3 py-2 text-[11px] bg-orange-50 border border-orange-100 rounded shadow-sm hover:bg-orange-500 hover:text-white transition-all truncate"
                    >
                      <span className="font-mono">{tag}</span>
                    </button>
                  );
                })}
              </div>
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