import React, { useState, useEffect, useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';

const ConditionalBlockComponent = ({ node, updateAttributes, selected }) => {
  const color = node.attrs.color || '#3b82f6';
  const rawCondition = node.attrs.condition || '';

  const stripHtml = (html) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const [activeField, setActiveField] = useState(null);
  const textAreaRef = useRef(null);
  const containerRef = useRef(null);

  // Mantenemos una referencia al estado para la callback del sidebar sin problemas de dependencias
  const stateRef = useRef({ rawCondition, activeField, updateAttributes });
  useEffect(() => {
    stateRef.current = { rawCondition, activeField, updateAttributes };
  }, [rawCondition, activeField, updateAttributes]);

  // Manejar el cierre global cuando otro condicional se abre o se hace clic fuera
  useEffect(() => {
    const handleGlobalClose = (e) => {
      if (e.detail?.id !== node.attrs.id) {
        setActiveField(null);
      }
    };

    const handleClickOutside = (e) => {
      // Si el clic viene del panel de variables (sidebar izquierdo), NO cerramos
      if (e.target.closest('.panel-izquierdo')) return;

      // Si el clic es fuera de nuestro contenedor flotante, cerramos
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveField(null);
      }
    };

    window.addEventListener('closeOtherConditions', handleGlobalClose);
    if (activeField) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.removeEventListener('closeOtherConditions', handleGlobalClose);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [node.attrs.id, activeField]);

  useEffect(() => {
    if (activeField) {
      window.activeConditionCallback = (rawTag) => {
        const { rawCondition: currentCond, updateAttributes: currentUpdater } = stateRef.current;
        const cleanTag = stripHtml(rawTag);

        let newCond = '';
        if (textAreaRef.current) {
          // Insert at cursor position if we have focus/selection
          const cursorPosition = textAreaRef.current.selectionStart;
          const textBeforeCursor = currentCond.substring(0, cursorPosition);
          const textAfterCursor = currentCond.substring(cursorPosition, currentCond.length);

          const spaceBefore = textBeforeCursor.length > 0 && !textBeforeCursor.endsWith(' ') ? ' ' : '';
          const spaceAfter = textAfterCursor.length > 0 && !textAfterCursor.startsWith(' ') ? ' ' : '';

          newCond = textBeforeCursor + spaceBefore + cleanTag + spaceAfter + textAfterCursor;

          // Re-focus and set cursor position after React re-renders
          setTimeout(() => {
            if (textAreaRef.current) {
              const newCursorPos = cursorPosition + spaceBefore.length + cleanTag.length + spaceAfter.length;
              textAreaRef.current.focus();
              textAreaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
          }, 0);
        } else {
          // Fallback to append if no textarea ref
          const separator = currentCond.length > 0 && !currentCond.endsWith(' ') ? ' ' : '';
          newCond = currentCond + separator + cleanTag;
        }

        currentUpdater({ condition: newCond });
      };
    }
    return () => { };
  }, [activeField]);

  const handleFocus = (fieldObj) => {
    setActiveField(fieldObj);
    // Disparar evento para cerrar otros bloques abiertos
    const event = new CustomEvent('closeOtherConditions', { detail: { id: node.attrs.id } });
    window.dispatchEvent(event);
  };

  const handleBlur = () => { };

  // Helper para convertir la lógica cruda en lenguaje natural leíble
  const formatNaturalLanguage = (cond) => {
    if (!cond || cond === '') return '';

    // Dividir por lógica AND/OR para procesar por partes
    const parts = cond.split(/(\&\&|\|\|)/).map(p => p.trim());

    const formattedParts = parts.map(part => {
      if (part === '&&') return `<span style="color:#64748b; font-weight:normal; margin: 0 4px">y</span>`;
      if (part === '||') return `<span style="color:#64748b; font-weight:normal; margin: 0 4px">o</span>`;

      let readable = part;
      // Reemplazo de operadores por texto
      if (part.includes(' != ')) {
        const [vr, vl] = part.split(' != ');
        readable = `<strong style="color:${color}">${vr}</strong> no es igual a <strong style="color:#1d4ed8">${vl}</strong>`;
      } else if (part.includes(' == ')) {
        const [vr, vl] = part.split(' == ');
        readable = `<strong style="color:${color}">${vr}</strong> es igual a <strong style="color:#1d4ed8">${vl}</strong>`;
      } else if (part.includes(' < ')) {
        const [vr, vl] = part.split(' < ');
        readable = `<strong style="color:${color}">${vr}</strong> contiene <strong style="color:#1d4ed8">${vl}</strong>`;
      } else if (part.includes(' > ')) {
        const [vr, vl] = part.split(' > ');
        readable = `<strong style="color:${color}">${vr}</strong> es mayor a <strong style="color:#1d4ed8">${vl}</strong>`;
      } else if (part.trim() !== '') {
        // Variable sola significa "existe"
        readable = `<strong style="color:${color}">${part}</strong> existe`;
      }
      return readable;
    });

    return formattedParts.join('');
  };

  return (
    <NodeViewWrapper
      className={`conditional-section-wrapper ${selected ? 'ProseMirror-selectednode' : ''}`}
      // Important: Use activeField instead of selected for zIndex to ensure dropdown tops overlaps following siblings
      style={{ margin: '1.5rem 0', position: 'relative', display: 'block', zIndex: activeField ? 50 : (selected ? 20 : 1) }}
    >
      {/* Etiqueta flotante fuera del flujo de texto */}
      <div
        ref={containerRef}
        contentEditable={false}
        onClick={(e) => {
          e.stopPropagation();
          if (!activeField) {
            handleFocus('manual');
          }
        }}
        style={{
          position: 'absolute',
          right: '100%',
          top: '0',
          marginRight: '8px',
          width: 'max-content',
          minWidth: activeField ? '280px' : 'auto', // Responsivity Fix
          maxWidth: activeField ? '320px' : '450px', // Responsivity Fix
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          backgroundColor: activeField ? '#ffffff' : '#f8fafc',
          border: `1px solid ${color}${activeField ? '' : '80'}`,
          borderRadius: activeField ? '8px' : '16px',
          padding: activeField ? '10px' : '4px 12px',
          boxShadow: activeField ? '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' : '0 2px 4px -1px rgba(0,0,0,0.05)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: activeField ? 'default' : 'pointer',
          userSelect: 'none'
        }}
        onMouseOver={(e) => {
          if (!activeField) Object.assign(e.currentTarget.style, { backgroundColor: '#e2e8f0', borderColor: color, transform: 'translateY(-1px)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' });
        }}
        onMouseOut={(e) => {
          if (!activeField) Object.assign(e.currentTarget.style, { backgroundColor: '#f8fafc', borderColor: `${color}80`, transform: 'none', boxShadow: '0 2px 4px -1px rgba(0,0,0,0.05)' });
        }}
      >
        {!activeField ? (
          // VISTA CONTRAIDA (PASTILLA LEÍBLE)
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>👁️</span>
            <span style={{ fontSize: '11px', color: '#334155', fontWeight: '500', maxWidth: '450px', lineHeight: '1.4' }}>
              {rawCondition.trim() === '' || rawCondition === 'VARIABLE' ?
                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Configurar visibilidad...</span> :
                <span style={{ fontFamily: 'sans-serif' }}>
                  Si <span dangerouslySetInnerHTML={{ __html: formatNaturalLanguage(rawCondition) }} />:
                </span>
              }
            </span>
          </div>
        ) : (
          // VISTA EXPANDIDA (BUSCADOR GOOGLE)
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: color, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                Campo Condicional
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveField(null); }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 4px', fontSize: '14px', lineHeight: '1' }}
                title="Cerrar buscador"
              >×</button>
            </div>

            <div style={{ position: 'relative' }}>
              <textarea
                ref={textAreaRef}
                value={rawCondition}
                placeholder="Ej: PLAN_ANUAL == 'SI'"
                onChange={(e) => {
                  const clean = stripHtml(e.target.value);
                  updateAttributes({ condition: clean });
                }}
                onFocus={() => handleFocus('manual')}
                className="nodrag nopan"
                rows={2}
                spellCheck={false}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  width: '100%',
                  outline: 'none',
                  fontFamily: 'monospace',
                  resize: 'none',
                  color: '#0f172a',
                  lineHeight: '1.4',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setActiveField(null);
                  }
                }}
              />

              {/* DROPDOWN DE SUGERENCIAS*/}
              <div style={{
                marginTop: '4px',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', padding: '4px 8px' }}>
                  Sugerencias Rápidas
                </span>

                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateAttributes({ condition: (rawCondition + ' == ').trimStart() })}
                  style={{ textAlign: 'left', padding: '6px 8px', fontSize: '11px', background: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ color: color, fontWeight: 'bold', width: '16px' }}>==</span>
                  <span>Es igual a...</span>
                </button>

                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateAttributes({ condition: (rawCondition + ' != ').trimStart() })}
                  style={{ textAlign: 'left', padding: '6px 8px', fontSize: '11px', background: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ color: color, fontWeight: 'bold', width: '16px' }}>!=</span>
                  <span>Es distinto de...</span>
                </button>

                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateAttributes({ condition: (rawCondition + ' < ').trimStart() })}
                  style={{ textAlign: 'left', padding: '6px 8px', fontSize: '11px', background: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ color: color, fontWeight: 'bold', width: '16px', fontSize: '14px', lineHeight: '10px' }}>&lt;</span>
                  <span>Contiene (Variable contiene texto)...</span>
                </button>

                <div style={{ margin: '4px 0', borderTop: '1px dashed #e2e8f0' }}></div>

                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateAttributes({ condition: (rawCondition + ' && ').trimStart() })}
                  style={{ textAlign: 'left', padding: '6px 8px', fontSize: '11px', background: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ backgroundColor: '#e2e8f0', color: '#475569', fontSize: '9px', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold' }}>Y</span>
                  <span>( && ) Exigir otra condición obligatoria</span>
                </button>

                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateAttributes({ condition: (rawCondition + ' || ').trimStart() })}
                  style={{ textAlign: 'left', padding: '6px 8px', fontSize: '11px', background: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ backgroundColor: '#e2e8f0', color: '#475569', fontSize: '9px', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold' }}>O</span>
                  <span>( || ) Permitir otra alternativa válida</span>
                </button>

              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', fontStyle: 'italic' }}>
                Tip: Haz clic en una variable del menú izquierdo para insertarla.
              </span>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => { e.stopPropagation(); setActiveField(null); }}
                style={{ backgroundColor: color, color: 'white', border: 'none', borderRadius: '4px', padding: '4px 12px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
              >
                Listo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contenedor visual del contenido condicionado */}
      <div style={{
        backgroundColor: `${color}0A`, // Opacidad baja
        borderLeft: `3px solid ${color}`,
        borderTop: `1px solid ${color}40`,
        borderRight: `1px solid ${color}40`,
        borderBottom: `1px solid ${color}40`,
        padding: '16px 20px',
        borderRadius: '0 8px 8px 0',
        minHeight: '50px',
        position: 'relative',
        zIndex: selected ? 20 : 1, // Fix: Selected items go above siblings to prevent UI clipping
        outline: selected ? `2px solid ${color}` : 'none'
      }}>
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
};

export const ConditionalBlock = Node.create({
  name: 'conditionalBlock',
  group: 'block',
  content: 'block+',
  defining: true,
  draggable: false,

  addAttributes() {
    return {
      condition: { default: 'VARIABLE' },
      color: { default: '#3b82f6' },
      id: { default: () => Math.random().toString(36).substr(2, 9) },
      isManual: { default: false }
    };
  },

  parseHTML() {
    return [{
      tag: 'div.conditional-block',
      getAttrs: dom => ({
        condition: dom.getAttribute('data-condition'),
        color: dom.getAttribute('data-color'),
        isManual: dom.getAttribute('data-is-manual') === 'true',
      }),
    }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'class': 'conditional-block',
      'data-condition': node.attrs.condition,
      'data-color': node.attrs.color,
      'data-id': node.attrs.id,
      'data-is-manual': node.attrs.isManual ? 'true' : 'false',
    }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ConditionalBlockComponent);
  },
});
