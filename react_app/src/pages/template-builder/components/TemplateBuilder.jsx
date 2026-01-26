import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

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
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: templateData.documentContent || templateData.paragraphs?.map(p => p.content).join('<br>') || '',
    onUpdate: ({ editor }) => {
      onUpdateTemplateData('documentContent', editor.getHTML());
    },
  });

  const addVariable = (tag) => {
    editor.chain().focus().insertContent(`<strong>${tag}</strong>`).run();
  };

  const addConditional = () => {
    const condition = prompt("Nombre de la variable para condicionar este bloque (ej: TIENE_HIJOS):");
    if (condition) {
      editor.chain().focus()
        .insertContent(`[[IF:${condition}]]`)
        .insertContent(`<p>Escribe aquí el contenido condicional...</p>`)
        .insertContent(`[[ENDIF]]`)
        .run();
    }
  };

  const addImage = () => {
    const url = prompt('Introduce la URL de la imagen (o logo variable):');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] border rounded-xl bg-background shadow-xl overflow-hidden">
      {/* BARRA DE HERRAMIENTAS SUPERIOR */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        <div className="flex bg-card border rounded-md p-1 mr-2">
          <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-primary/20' : ''}>
            <Icon name="Bold" size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-primary/20' : ''}>
            <Icon name="Italic" size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'bg-primary/20' : ''}>
            <Icon name="Underline" size={16} />
          </Button>
        </div>

        <div className="flex bg-card border rounded-md p-1 mr-2">
          <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'bg-primary/20' : ''}>
            <Icon name="AlignLeft" size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'bg-primary/20' : ''}>
            <Icon name="AlignJustify" size={16} />
          </Button>
        </div>

        <div className="flex bg-card border rounded-md p-1 gap-1">
          <Button variant="outline" size="sm" onClick={() => addVariable('{{NUMERAL}}')} className="text-[10px] font-bold">
            + NUMERAL
          </Button>
          <Button variant="outline" size="sm" onClick={addConditional} className="text-[10px] font-bold border-blue-400 text-blue-600">
            + CONDICIONAL
          </Button>
          <Button variant="outline" size="sm" onClick={addImage}>
            <Icon name="Image" size={16} />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* PANEL IZQUIERDO: VARIABLES */}
        <div className="w-64 border-r bg-muted/10 p-4 overflow-y-auto">
          <h3 className="text-xs font-bold uppercase text-muted-foreground mb-4">Variables del Formulario</h3>
          <div className="space-y-2">
            {dynamicVariables.map(v => (
              <button
                key={v.id}
                onClick={() => addVariable(`{{${v.title.toUpperCase().replace(/\s+/g, '_')}}}`)}
                className="w-full text-left p-2 text-xs bg-card border rounded hover:border-primary transition-colors"
              >
                {v.title}
              </button>
            ))}
          </div>
        </div>

        {/* LIENZO DE ESCRITURA */}
        <div className="flex-1 bg-gray-100 p-8 overflow-y-auto flex justify-center">
          <div className="w-[800px] min-h-[1056px] bg-white shadow-2xl p-[2cm] outline-none">
            <EditorContent editor={editor} className="prose prose-blue max-w-none focus:outline-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentTemplateEditor;