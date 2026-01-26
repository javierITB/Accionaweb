import React, { useCallback } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Underline } from '@tiptap/extension-underline';
import { Image } from '@tiptap/extension-image';
import { StarterKit } from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';

import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

// --- EXTENSIÓN PERSONALIZADA PARA TAMAÑO DE FUENTE ---
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
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).run();
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
      StarterKit,
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
    editor.chain().focus().insertContent(`<strong>${tag}</strong>`).run();
  };

  const addConditional = () => {
    const condition = prompt("Nombre de la variable para condicionar (ej: ES_CASADO):");
    if (condition) {
      editor.chain().focus()
        .insertContent(`<p>[[IF:${condition.toUpperCase()}]]</p>`)
        .insertContent(`<p>Escribe el texto condicional aquí...</p>`)
        .insertContent(`<p>[[ENDIF]]</p>`)
        .run();
    }
  };

  if (!editor) return null;

  const fontFamilies = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Georgia', value: 'Georgia' }
  ];

  const fontSizes = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '32px'];

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

        <div className="flex bg-card border rounded-md p-0.5">
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive({ textAlign: 'left' }) ? 'bg-primary/20' : ''}`} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <Icon name="AlignLeft" size={14} />
          </Button>
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-primary/20' : ''}`} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
            <Icon name="AlignJustify" size={14} />
          </Button>
        </div>

        <div className="flex gap-1 ml-auto">
          <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold" onClick={() => addVariable('{{NUMERAL}}')}>
            + NUMERAL
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold border-blue-200 text-blue-600" onClick={addConditional}>
            + CONDICIONAL
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => {
            const url = prompt('URL de la imagen:');
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}>
            <Icon name="Image" size={14} />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* PANEL DE VARIABLES INTEGRADO */}
        <div className="w-72 border-r bg-muted/5 p-4 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-[10px] font-bold uppercase text-primary mb-3 tracking-widest">Variables Formulario</h3>
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

            <div>
              <h3 className="text-[10px] font-bold uppercase text-orange-500 mb-3 tracking-widest">Generales</h3>
              <div className="grid grid-cols-1 gap-1.5">
                {staticVariables.map(v => {
                  const tag = `{{${v.title.toUpperCase().replace(/\s+/g, '_')}}}`;
                  return (
                    <button
                      key={v.title}
                      onClick={() => addVariable(tag)}
                      className="text-left px-3 py-2 text-[11px] bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded shadow-sm hover:bg-orange-500 hover:text-white dark:hover:bg-orange-600 transition-all truncate group"
                    >
                      <span className="font-mono text-orange-700 dark:text-orange-300 group-hover:text-white">{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* HOJA DE TRABAJO */}
        <div className="flex-1 bg-muted/30 p-8 overflow-y-auto flex justify-center">
          <div className="w-full max-w-[850px] min-h-[1100px] bg-white shadow-2xl p-[2.5cm] rounded-sm border border-border">
            <style>{`
              .ProseMirror { outline: none; min-height: 100%; }
              .ProseMirror p { margin-bottom: 0.5em; line-height: 1.5; }
              .ProseMirror strong { font-weight: bold; }
            `}</style>
            <EditorContent editor={editor} className="prose prose-sm max-w-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentTemplateEditor;