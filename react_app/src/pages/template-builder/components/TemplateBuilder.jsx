import React, { useState, useEffect, useRef } from 'react';
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
import { ConditionalBlock } from './ConditionalBlock';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { apiFetch, API_BASE_URL } from '../../../utils/api';

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
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          copyVariable(tag);
        }}
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
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
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
  onSave,
  isSaving = false,
  readOnly = false
}) => {
  const [staticVarsExpanded, setStaticVarsExpanded] = useState(true);
  const [dynamicVarsExpanded, setDynamicVarsExpanded] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [, setTick] = useState(0);
  const [focusedField, setFocusedField] = useState({ type: 'editor' });

  // Estado para controlar paneles laterales
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(false); // Same as showSignatureConfig but renamed logically

  // ESTADO DE ZOOM MANUAL
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%

  // Manejadores de zoom
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2)); // Max 200%
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5)); // Min 50%
  const handleZoomReset = () => setZoomLevel(1);

  // EFECTO FORZAR PREVIEW SI ES READ ONLY
  useEffect(() => {
    if (readOnly) {
      setIsPreview(true);
      setShowRightPanel(false);
      setShowLeftPanel(false);
    }
  }, [readOnly]);

  // -- ESTADOS DE REDIMENSIONAMIENTO --
  const [leftPanelWidth, setLeftPanelWidth] = useState(260);
  const [rightPanelWidth, setRightPanelWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(null); // 'left' | 'right' | null

  // Manejadores de redimensionamiento
  const startResizing = React.useCallback((direction) => {
    setIsResizing(direction);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(null);
  }, []);

  const resize = React.useCallback((e) => {
    if (isResizing === 'left') {
      const newWidth = e.clientX - 64; // Aproximadamente 64px del sidebar principal si existe, ajustar según layout
      // Limitamos min 150, max 600
      if (newWidth > 150 && newWidth < 600) {
        setLeftPanelWidth(newWidth);
      }
    } else if (isResizing === 'right') {
      // Para el panel derecho, calculamos desde el borde derecho
      const newWidth = window.innerWidth - e.clientX - 40; // Margen de seguridad
      if (newWidth > 150 && newWidth < 600) {
        setRightPanelWidth(newWidth);
      }
    }
  }, [isResizing]);

  // Efecto global para el drag
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      // Evitar selección de texto mientras se arrastra
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // Logo Configuration State
  const [logoConfig, setLogoConfig] = useState(templateData.logoConfig || { left: true, right: false });

  // Sync logoConfig to templateData
  React.useEffect(() => {
    if (JSON.stringify(templateData.logoConfig) !== JSON.stringify(logoConfig)) {
      onUpdateTemplateData('logoConfig', logoConfig);
    }
  }, [logoConfig]);

  const toggleLogo = (side) => {
    if (readOnly) return;
    setLogoConfig(prev => ({ ...prev, [side]: !prev[side] }));
  };

  // Sincronizar includeSignature con la existencia de firmas
  React.useEffect(() => {
    const hasSignatures = templateData.signatures && templateData.signatures.length > 0;
    if (templateData.includeSignature !== hasSignatures) {
      onUpdateTemplateData('includeSignature', hasSignatures);
    }
  }, [templateData.signatures?.length, templateData.includeSignature]);

  // LOGO FETCHING (Visual Editor)
  const [logoSrc, setLogoSrc] = useState(null);

  React.useEffect(() => {
    const fetchLogo = async () => {
      try {
        const email = sessionStorage.getItem("email");
        if (!email) return;

        // 1. Obtener datos del usuario (Nombre Empresa)
        const userRes = await apiFetch(`${API_BASE_URL}/auth/full/${email}`);
        if (!userRes.ok) return;
        const userData = await userRes.json();
        const empresaName = userData.empresa;

        if (!empresaName) return;

        // 2. Buscar empresa por nombre
        const companiesRes = await apiFetch(`${API_BASE_URL}/auth/empresas/todas`);
        if (!companiesRes.ok) return;
        const companies = await companiesRes.json();

        const normalize = s => s ? s.toString().toLowerCase().trim() : "";
        const targetName = normalize(empresaName);

        const myCompany = companies.find(c => normalize(c.nombre) === targetName);

        if (myCompany && myCompany.logo && myCompany.logo.fileData) {
          setLogoSrc(`data:${myCompany.logo.mimeType};base64,${myCompany.logo.fileData}`);
        }
      } catch (err) {
        console.error("Error cargando logo:", err);
      }
    };

    fetchLogo();
  }, []);

  const handleLogoUpload = (e) => {
    if (readOnly) return;
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // Simple alerta por ahora (o usar toast si hay uno disponible)
        alert("La imagen no debe superar 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoConfig(prev => ({ ...prev, rightLogoData: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

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
      ConditionalBlock,
    ],
    onFocus: () => {
      setFocusedField({ type: 'editor' });
      window.activeConditionCallback = null;
    },
    content: (() => {
      const initialHtml = templateData.documentContent || (templateData.paragraphs && templateData.paragraphs.length > 0
        ? templateData.paragraphs.map(p => {
          let text = p.content;
          if (p.conditionalVar) {
            return `<p>[[IF:${p.conditionalVar}]]${text}[[ENDIF]]</p>`;
          }
          return `<p>${text}</p>`;
        }).join('')
        : '<p>Comienza a escribir el documento...</p>');

      // Función auxiliar para decodificar y limpiar la condición que viene de BBDD
      const cleanCond = (c) => {
        let res = c.replace(/<[^>]*>/g, '').replace(/[{}]/g, '').trim();
        // Las plantillas antiguas podían guardar < como &lt; debido a tags HTML
        res = res.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/&nbsp;/gi, ' ');
        // Asegurarse de que el atributo data-condition no se rompa por tener comillas dobles
        return res.replace(/"/g, '&quot;');
      };

      let parsedHtml = initialHtml;
      const color = '#3b82f6';

      // Este regex busca contenido entre IF y ENDIF, saltándose posibles tags HTML intrusos
      parsedHtml = parsedHtml.replace(/<p(?:[^>]*)>\s*(?:<[^>]*>\s*)*\[\[IF:([^\]]+)\]\](?:\s*<\/[^>]*>)*\s*<\/p>([\s\S]*?)<p(?:[^>]*)>\s*(?:<[^>]*>\s*)*\[\[ENDIF\]\](?:\s*<\/[^>]*>)*\s*<\/p>/gi, (match, condition, content) => {
        return `<div class="conditional-block" data-condition="${cleanCond(condition)}" data-color="${color}">${content}</div>`;
      });

      // Segunda pasada por si el IF y ENDIF no estuvieran envueltos individualmente en <p> (fallback)
      parsedHtml = parsedHtml.replace(/(?:<[^>]*>\s*)*\[\[IF:([^\]]+)\]\](?:\s*<\/[^>]*>)*([\s\S]*?)(?:<[^>]*>\s*)*\[\[ENDIF\]\](?:\s*<\/[^>]*>)*/gi, (match, condition, content) => {
        // Ignorar si accidentalmente capturó parte del div.conditional-block ya procesado
        if (content.includes('conditional-block')) return match;
        return `<div class="conditional-block" data-condition="${cleanCond(condition)}" data-color="${color}">${content}</div>`;
      });

      return parsedHtml;
    })(),
    onUpdate: ({ editor }) => {
      // Obtenemos el HTML del editor que incluye los div.conditional-block
      let html = editor.getHTML();

      // Transformación segura usando el DOM en lugar de Regex para evitar
      // cortes prematuros en </div> si hay tablas o divs anidados (evita mezcla de condicionales).
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const blocks = tempDiv.querySelectorAll('.conditional-block');

        blocks.forEach(block => {
          const condition = block.getAttribute('data-condition') || '';
          const rawCond = condition.replace(/&quot;/g, '"');

          // CRITICO: Escapar < y > para que el navegador no los interprete como etiquetas HTML
          // al inyectarlo en innerHTML. El backend hará 'decodeEntities' luego.
          const safeCond = rawCond.replace(/</g, '&lt;').replace(/>/g, '&gt;');

          // Envolver el interior en etiquetas IF y reemplazar el nodo
          const wrapper = document.createElement('div');
          wrapper.innerHTML = `<p>[[IF:${safeCond}]]</p>${block.innerHTML}<p>[[ENDIF]]</p>`;

          // Tiptap / JS soporta reemplazar con múltiples nodos
          block.replaceWith(...Array.from(wrapper.childNodes));
        });

        html = tempDiv.innerHTML;
      } catch (e) {
        console.error("Error guardando el arbol HTML condicional:", e);
      }

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

  // Prevenir duplicaciones por ghost clicks o eventos duplicados del sidebar
  const lastVariableClickTime = useRef(0);

  const addVariable = (tag) => {
    const now = Date.now();
    // Si la última inserción fue hace menos de 200ms, ignoramos (evita duplicados de eventos hijos/padres)
    if (now - lastVariableClickTime.current < 200) return;
    lastVariableClickTime.current = now;

    // 1. Si estamos editando una condición en el panel flotante
    if (window.activeConditionCallback) {
      // Limpieza agresiva: quitar {{ }}, tags HTML y espacios laterales
      const cleanTag = tag
        .replace(/<[^>]*>/g, '') // Quitar tags HTML
        .replace(/[{}]/g, '')    // Quitar llaves
        .trim();

      window.activeConditionCallback(cleanTag);
      return;
    }

    if (focusedField.type === 'signature') {
      const { index, field } = focusedField;
      const currentText = signatures[index][field] || "";
      // Append variable with a space if not empty
      const spacer = currentText.length > 0 && !currentText.endsWith(' ') ? " " : "";
      updateSignature(index, field, currentText + spacer + tag);
    } else {
      if (editor) {
        // Ejecutamos insertContent ANTES de hacer focus para no perder la posición
        // exacta del cursor si estábamos dentro de un ConditionalBlock (ReactNodeView)
        editor.commands.insertContent(tag);
        editor.commands.focus();
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
      editor.setEditable(!isPreview && !readOnly);
    }
  }, [editor, isPreview, readOnly]);

  // EFECTO ESCAPE PARA SALIR DE PANTALLA COMPLETA
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

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
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Calibri', value: 'Calibri' },
    { label: 'Verdana', value: 'Verdana' },
    { label: 'Trebuchet MS', value: 'Trebuchet MS' },
    { label: 'Garamond', value: 'Garamond' },
    { label: 'Book Antiqua', value: 'Book Antiqua' }
  ];

  const fontSizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'];

  const getActiveFontFamily = () => {
    if (focusedField.type === 'signature') {
      const { index, field } = focusedField;
      if (!field) return '';
      // Propiedad dinámica
      const propName = `${field}FontFamily`;
      return signatures[index][propName] || '';
    }
    return editor ? editor.getAttributes('textStyle').fontFamily : '';
  };

  const getActiveFontSize = () => {
    if (focusedField.type === 'signature') {
      const { index, field } = focusedField;
      if (!field) return '';
      // Propiedad dinámica
      const propName = `${field}FontSize`;
      const val = signatures[index][propName];
      return val ? String(val).replace('pt', '') : '';
    }
    return editor && editor.getAttributes('textStyle').fontSize
      ? String(editor.getAttributes('textStyle').fontSize).replace('pt', '').replace('px', '')
      : '';
  };

  return (
    <div className={`flex flex-col border rounded-xl bg-background shadow-lg overflow-hidden border-border transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-50 h-screen m-0 rounded-none' : 'h-[calc(100vh-140px)]'}`}>

      {/* BARRA DE HERRAMIENTAS - CONDICIONAL: SI es ReadOnly, solo mostrar FullScreen */}
      {!readOnly ? (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-b bg-muted/20 sticky top-0 z-30 shadow-sm">
          {/* GRUPO IZQUIERDO: CONTROLES DE EDICIÓN */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Botones de Control Global */}
            <div className="flex items-center gap-1 border-r pr-2 mr-1">
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
              className="h-8 text-xs border rounded bg-card px-2 outline-none focus:ring-1 focus:ring-primary w-28"
              value={getActiveFontFamily()}
              onChange={(e) => {
                const val = e.target.value;
                if (focusedField.type === 'signature') {
                  const { index, field } = focusedField;
                  if (field) {
                    setFocusedField({ type: 'signature', index, field });
                    updateSignature(index, `${field}FontFamily`, val);
                    setTimeout(() => {
                      const el = document.getElementById(`sig-${field}-${index}`);
                      if (el) el.focus();
                    }, 50);
                  }
                } else {
                  editor.chain().focus().setFontFamily(val).run();
                }
              }}
            >
              <option value="">Fuente</option>
              {fontFamilies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>

            <select
              className="h-8 text-xs border rounded bg-card px-2 outline-none focus:ring-1 focus:ring-primary w-20"
              value={getActiveFontSize()}
              onChange={(e) => {
                const val = e.target.value;
                if (focusedField.type === 'signature') {
                  const { index, field } = focusedField;
                  if (field) {
                    setFocusedField({ type: 'signature', index, field });
                    updateSignature(index, `${field}FontSize`, val);
                    setTimeout(() => {
                      const el = document.getElementById(`sig-${field}-${index}`);
                      if (el) el.focus();
                    }, 50);
                  }
                } else {
                  if (!val) {
                    editor.chain().focus().setMark('textStyle', { fontSize: null }).run();
                  } else {
                    editor.chain().focus().setFontSize(`${val}pt`).run();
                  }
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

            <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

            {/* Botones de Zoom Manual */}
            <div className="hidden sm:flex bg-card border rounded-md p-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} title="Alejar (Zoom Out)">
                <Icon name="ZoomOut" size={14} />
              </Button>
              <span className="text-[10px] font-bold min-w-[36px] text-center place-content-center" title="Restablecer Zoom" onClick={handleZoomReset} style={{ cursor: 'pointer' }}>
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn} title="Acercar (Zoom In)">
                <Icon name="ZoomIn" size={14} />
              </Button>
            </div>


          </div>

          {/* GRUPO DERECHO: VISTA PREVIA Y ACCIONES */}
          <div className="flex gap-2 items-center flex-wrap ml-auto">
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
              if (!editor) return;
              const { from, to, empty } = editor.state.selection;

              if (empty) {
                alert("Selecciona el texto que deseas condicionar.");
                return;
              }

              const randomHue = Math.floor(Math.random() * 360);
              const randomColor = `hsl(${randomHue}, 75%, 45%)`;
              // Intentar envolver los bloques seleccionados directamente respetando el esquema (wrapIn)
              const success = editor.chain()
                .focus()
                .wrapIn('conditionalBlock', {
                  condition: 'VARIABLE',
                  color: randomColor,
                })
                .run();

              if (!success) {
                // Si la selección es puramente inline o inválida para envolver un bloque,
                // forzamos la inserción con un párrafo anidado (schema válido para 'block+')
                const selectedText = editor.state.doc.slice(from, to).textContent;

                editor.chain()
                  .focus()
                  .deleteSelection()
                  .insertContent({
                    type: 'conditionalBlock',
                    attrs: { condition: 'VARIABLE', color: randomColor },
                    content: [
                      {
                        type: 'paragraph',
                        content: selectedText ? [{ type: 'text', text: selectedText }] : undefined
                      }
                    ]
                  })
                  .run();
              }
            }}>
              + CONDICIONAL
            </Button>

            {onSave && (
              <Button
                variant="default"
                size="sm"
                className="h-8 text-[10px] px-3 bg-blue-600 hover:bg-blue-700 text-white ml-2 shadow-sm"
                onClick={onSave}
                loading={isSaving}
                disabled={isSaving}
                title="Guardar Plantilla"
              >
                {!isSaving && <Icon name="Save" size={12} className="mr-1" />}
                {isSaving ? "GUARDANDO..." : "GUARDAR"}
              </Button>
            )}
          </div>
        </div>
      ) : (
        // BARRA DE HERRAMIENTAS - READ ONLY
        <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-muted/20 justify-start">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? "Salir de Pantalla Completa (ESC)" : "Pantalla Completa"}
          >
            <Icon name={isFullScreen ? "Minimize" : "Maximize"} size={16} />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Botones de Zoom Manual (Read Only) */}
          <div className="flex items-center gap-1 bg-card rounded-md border p-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} title="Alejar (Zoom Out)">
              <Icon name="ZoomOut" size={14} />
            </Button>
            <span className="text-[10px] font-bold min-w-[36px] text-center" title="Restablecer Zoom" onClick={handleZoomReset} style={{ cursor: 'pointer' }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn} title="Acercar (Zoom In)">
              <Icon name="ZoomIn" size={14} />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">

        {/* BOTONES FLOTANTES DE APERTURA DE PANELES */}
        {!showLeftPanel && !readOnly && (
          <Button
            variant="default"
            onClick={() => setShowLeftPanel(true)}
            className="absolute top-6 left-0 z-20 shadow-xl bg-blue-600 hover:bg-blue-700 text-white flex gap-2 items-center py-2 px-3 h-auto text-[10px] font-bold transition-all rounded-r-full rounded-l-none border-y border-r border-white/20"
            title="Abrir Variables"
          >
            <Icon name="Database" size={14} /> <span>VARIABLES</span>
          </Button>
        )}

        {!showRightPanel && !isPreview && (
          <Button
            variant="default"
            onClick={() => setShowRightPanel(true)}
            className="absolute top-6 right-0 z-20 shadow-xl bg-blue-600 hover:bg-blue-700 text-white flex gap-2 items-center py-2 px-3 h-auto text-[10px] font-bold transition-all rounded-l-full rounded-r-none border-y border-l border-white/20 mr-2"
            title="Abrir Firmas"
          >
            <span>FIRMAS</span> <Icon name="PenTool" size={14} />
          </Button>
        )}

        {/* PANEL LATERAL DE VARIABLES ALTA PRIORIDAD */}
        <div
          className={`panel-izquierdo border-r bg-card shadow-2xl overflow-y-auto transition-transform duration-300 absolute top-0 left-0 z-30 h-full flex ${!showLeftPanel || readOnly ? '-translate-x-full' : 'translate-x-0'}`}
          style={{ width: leftPanelWidth }}
        >
          {showLeftPanel && !readOnly && (
            <div className="space-y-6 min-w-[180px] p-4 flex-1">
              {/* Controles para cerrar panel */}
              <div className="flex justify-between items-center mb-2 pb-2 border-b">
                <span className="font-bold text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                  <Icon name="Database" size={14} /> Variables
                </span>
                <Button variant="ghost" size="icon" onClick={() => setShowLeftPanel(false)}>
                  <Icon name="X" size={16} />
                </Button>
              </div>
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
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addVariable(tag);
                          }}
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
          )}
        </div>

        {/* DRAG HANDLE IZQUIERDO - Integrado en el panel absoluto */}
        {!readOnly && showLeftPanel && (
          <div
            className="w-1.5 cursor-col-resize absolute left-0 top-0 h-full hover:bg-blue-500/50 transition-colors z-40 hidden md:flex flex-col justify-center items-center group"
            style={{ transform: `translateX(${leftPanelWidth}px)` }}
            onMouseDown={() => startResizing('left')}
          >
            <div className="h-12 w-1 bg-border group-hover:bg-blue-500 rounded-full" />
          </div>
        )}

        {/* AREA DE EDICION (HOJA) */}
        <div className="editor-paper-container flex-1 bg-muted/30 overflow-auto">
          <div className={`w-full max-w-[216mm] mx-auto transition-transform origin-top`} style={{ transform: `scale(${zoomLevel})` }}>
            <style>{`
              /* Contenedor del área de edición */
              .editor-paper-container {
                background-color: #f0f2f5; 
                padding: 2rem 1rem;
                display: block; /* Removed flex center to prevent left crop */
                overflow: auto;
              }

              /* La "Hoja" Visual (Contenedor Padre) */
              .visual-page {
                background: white;
                width: 100%; /* Cambiado a 100% en lugar de fijo */
                min-height: 279mm; /* Alto Carta Mínimo */
                padding: clamp(2rem, 5vw, 4rem) clamp(2rem, 8vw, 6rem); /* Padding responsivo en lugar de 2.5cm fijo */
                margin: 0 auto;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                position: relative;
                font-family: 'Arial', sans-serif;
                display: flex;
                flex-direction: column;
                transition: transform 0.2s ease;
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
              
              /* HEADER CON LOGOS */
               .header-row {
                 display: flex;
                 justify-content: space-between;
                 align-items: flex-start;
                 margin-bottom: 2rem;
                 min-height: 60px; /* Space for logos */
               }
               .logo-box {
                  position: relative;
                  width: 150px;
                  height: 60px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border: 1px dashed #e2e8f0;
                  border-radius: 4px;
                  transition: all 0.2s;
               }
               .logo-box.active {
                  border: none;
                  background: transparent;
               }
               .logo-box:not(.active):hover {
                  border-color: #94a3b8;
                  background: #f8fafc;
               }
               .logo-toggle-btn {
                  position: absolute;
                  top: -8px;
                  right: -8px;
                  z-index: 10;
                  background: white;
                  border: 1px solid #e2e8f0;
                  border-radius: 50%;
                  width: 20px;
                  height: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
               }
            `}</style>

            <div className={`visual-page ${isPreview ? 'scale-[1.02]' : ''}`}>

              {/* HEADER CON LOGOS (Visualización) */}
              <div className="header-row">
                {/* Left Logo */}
                <div className={`logo-box ${logoConfig.left ? 'active' : 'opacity-40 hover:opacity-100'}`}>
                  {logoConfig.left ? (
                    <div className="w-full h-full flex items-center justify-start">
                      {logoSrc ? (
                        <img src={logoSrc} alt="Logo Izquierdo" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="font-bold text-lg text-slate-700">LOGO</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] uppercase font-bold text-slate-300">Logo Izq.</span>
                  )}

                  {!isPreview && (
                    <button
                      onClick={() => toggleLogo('left')}
                      className={`logo-toggle-btn ${logoConfig.left ? 'text-red-500 hover:bg-red-50 border-red-200' : 'text-green-500 hover:bg-green-50 border-green-200'}`}
                      title={logoConfig.left ? "Quitar Logo Izquierdo" : "Agregar Logo Izquierdo"}
                    >
                      <Icon name={logoConfig.left ? "X" : "Plus"} size={12} />
                    </button>
                  )}
                </div>

                {/* Right Logo */}
                <div className={`logo-box group ${logoConfig.right ? 'active' : 'opacity-40 hover:opacity-100'}`}>
                  {logoConfig.right ? (
                    <div className="w-full h-full flex items-center justify-end relative">
                      {logoConfig.rightLogoData ? (
                        <img src={logoConfig.rightLogoData} alt="Logo Derecho Personalizado" className="max-h-full max-w-full object-contain" />
                      ) : logoSrc ? (
                        <img src={logoSrc} alt="Logo Derecho" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="font-bold text-lg text-slate-700">LOGO</span>
                      )}

                      {!isPreview && (
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded backdrop-blur-[1px]">
                          <span className="flex flex-col items-center gap-1">
                            <Icon name="Upload" size={14} />
                            SUBIR
                          </span>
                          <input type="file" className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleLogoUpload} />
                        </label>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] uppercase font-bold text-slate-300">Logo Der.</span>
                  )}

                  {!isPreview && (
                    <button
                      onClick={() => toggleLogo('right')}
                      className={`logo-toggle-btn ${logoConfig.right ? 'text-red-500 hover:bg-red-50 border-red-200' : 'text-green-500 hover:bg-green-50 border-red-200'}`}
                      title={logoConfig.right ? "Quitar Logo Derecho" : "Agregar Logo Derecho"}
                      style={{ zIndex: 20 }}
                    >
                      <Icon name={logoConfig.right ? "X" : "Plus"} size={12} />
                    </button>
                  )}
                </div>
              </div>

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

                    // Lógica para limpiar contenido en vista previa
                    let displayText = sig.text || '';
                    if (isPreview) {
                      // Reemplazo básico de artifactos como [[]] y {{}}
                      displayText = displayText.replace(/\[\[.*?\]\]/g, '');

                      // Reemplazo de variables {{VAR}} por un placeholder visual
                      displayText = displayText.replace(/{{([^}]+)}}/g, (match, varName) => {
                        return varName.replace(/_/g, ' ');
                      });
                    }

                    return (
                      <div
                        className={`signature-col flex flex-col items-center text-center ${isLastAndOdd ? 'col-span-2 place-self-center' : ''}`}
                        key={i}
                      >
                        <div className="signature-line font-bold mb-1">__________________________</div>
                        <div
                          className={`mb-1 ${sig.titleBold ? 'font-bold' : ''} ${sig.titleItalic ? 'italic' : ''} ${sig.titleUnderline ? 'underline' : ''}`}
                          style={{
                            fontFamily: sig.titleFontFamily,
                            fontSize: sig.titleFontSize ? `${sig.titleFontSize}pt` : 'inherit'
                          }}
                        >
                          {sig.title || "Firma"}
                        </div>
                        <div
                          className={`${sig.textBold ? 'font-bold' : ''} ${sig.textItalic ? 'italic' : ''} ${sig.textUnderline ? 'underline' : ''}`}
                          style={{
                            fontFamily: sig.textFontFamily,
                            fontSize: sig.textFontSize ? `${sig.textFontSize}pt` : 'inherit',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {displayText.split('\n').map((line, j) => (
                            <div key={j}>{line}</div>
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

        {/* DRAG HANDLE DERECHO - Integrado en el panel absoluto */}
        {!isPreview && showRightPanel && (
          <div
            className="w-1.5 cursor-col-resize absolute right-0 top-0 h-full hover:bg-blue-500/50 transition-colors z-40 hidden md:flex flex-col justify-center items-center group"
            style={{ transform: `translateX(-${rightPanelWidth}px)` }}
            onMouseDown={() => startResizing('right')}
          >
            <div className="h-12 w-1 bg-border group-hover:bg-blue-500 rounded-full" />
          </div>
        )}

        {/* ZONA DE CONFIGURACIÓN DE FIRMAS */}
        <div
          className={`border-l bg-card shadow-2xl overflow-y-auto transition-transform duration-300 absolute top-0 right-2 z-30 h-[calc(100%-8px)] flex rounded-l-md ${!showRightPanel || isPreview ? 'translate-x-[110%]' : 'translate-x-0'}`}
          style={{ width: rightPanelWidth }}
        >
          {showRightPanel && !isPreview && (
            <div className="min-w-[180px] p-4 flex-1">
              <div className="flex items-center justify-between mb-3 pb-2 border-b">
                <h3 className="text-[10px] font-bold uppercase text-primary tracking-widest flex items-center gap-2">
                  <Icon name="PenTool" size={14} /> Firmas
                </h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowRightPanel(false)}>
                  <Icon name="X" size={14} />
                </Button>
              </div>
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
                        id={`sig-title-${i}`}
                        className={`w-full border rounded px-2 py-1 outline-none bg-background text-foreground placeholder:text-muted-foreground/50 transition-all ${focusedField.type === 'signature' && focusedField.index === i && focusedField.field === 'title'
                          ? 'ring-1 ring-primary border-primary'
                          : 'focus:ring-1 focus:ring-primary'
                          }`}
                        style={{
                          fontFamily: sig.titleFontFamily || 'inherit',
                          fontSize: sig.titleFontSize ? `${sig.titleFontSize}pt` : '12px'
                        }}
                        value={sig.title || ''}
                        onChange={(e) => updateSignature(i, 'title', e.target.value)}
                        onFocus={() => setFocusedField({ type: 'signature', index: i, field: 'title' })}
                        placeholder="Ej: Empleado"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Contenido</label>
                      <textarea
                        id={`sig-text-${i}`}
                        className={`w-full h-24 border rounded-md p-2 resize-none outline-none bg-background text-foreground placeholder:text-muted-foreground/50 transition-all chain-input ${focusedField.type === 'signature' && focusedField.index === i && focusedField.field === 'text'
                          ? 'ring-1 ring-primary border-primary'
                          : 'focus:ring-1 focus:ring-primary'
                          }`}
                        style={{
                          fontFamily: sig.textFontFamily || 'monospace',
                          fontSize: sig.textFontSize ? `${sig.textFontSize}pt` : '12px'
                        }}
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
      </div>
    </div>
  );
};

export default DocumentTemplateEditor;