import React, { useState } from 'react';
import { HelpCircle, X, BookOpen } from 'lucide-react';

export interface SectionHelpModalProps {
  title: string;
  markdownContent: string;
  buttonLabel?: string;
  className?: string;
}

/**
 * Renderizador de Markdown liviano para explicaciones de sección
 */
const renderSimpleMarkdown = (md: string) => {
  const lines = md.split('\n');
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = (key: string | number) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul
          key={`list-${key}`}
          style={{
            paddingLeft: '20px',
            marginBottom: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '13px',
            color: '#334155',
          }}
        >
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Título H3 (###)
    if (trimmed.startsWith('### ')) {
      flushList(index);
      elements.push(
        <h4
          key={index}
          style={{
            fontSize: '14px',
            fontWeight: 800,
            color: '#0f172a',
            marginTop: '16px',
            marginBottom: '6px',
          }}
        >
          {trimmed.replace('### ', '')}
        </h4>
      );
      return;
    }

    // Título H2 (##)
    if (trimmed.startsWith('## ')) {
      flushList(index);
      elements.push(
        <h3
          key={index}
          style={{
            fontSize: '16px',
            fontWeight: 800,
            color: '#0284c7',
            marginTop: '18px',
            marginBottom: '8px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '4px',
          }}
        >
          {trimmed.replace('## ', '')}
        </h3>
      );
      return;
    }

    // Título H1 (#)
    if (trimmed.startsWith('# ')) {
      flushList(index);
      elements.push(
        <h2
          key={index}
          style={{
            fontSize: '18px',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: '12px',
          }}
        >
          {trimmed.replace('# ', '')}
        </h2>
      );
      return;
    }

    // Listas (-) o (*)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      const text = trimmed.substring(2);
      // Procesar negrita básica (**texto**)
      const parts = text.split(/(\*\*.*?\*\*)/g);
      listItems.push(
        <li key={index} style={{ lineHeight: 1.5 }}>
          {parts.map((p, i) =>
            p.startsWith('**') && p.endsWith('**') ? (
              <strong key={i} style={{ color: '#0f172a' }}>
                {p.slice(2, -2)}
              </strong>
            ) : (
              p
            )
          )}
        </li>
      );
      return;
    }

    // Línea divisoria (---)
    if (trimmed === '---') {
      flushList(index);
      elements.push(
        <hr
          key={index}
          style={{
            border: 'none',
            borderTop: '1px solid #e2e8f0',
            margin: '16px 0',
          }}
        />
      );
      return;
    }

    // Párrafo normal
    if (trimmed.length > 0) {
      flushList(index);
      const parts = trimmed.split(/(\*\*.*?\*\*)/g);
      elements.push(
        <p
          key={index}
          style={{
            fontSize: '13px',
            color: '#475569',
            lineHeight: 1.6,
            marginBottom: '10px',
          }}
        >
          {parts.map((p, i) =>
            p.startsWith('**') && p.endsWith('**') ? (
              <strong key={i} style={{ color: '#0f172a' }}>
                {p.slice(2, -2)}
              </strong>
            ) : (
              p
            )
          )}
        </p>
      );
    } else {
      flushList(index);
    }
  });

  flushList('final');
  return elements;
};

/**
 * Botón discreto y minimalista (solo icono circular) con modal en Markdown para ayuda de sección
 */
export const SectionHelpButton: React.FC<SectionHelpModalProps> = ({
  title,
  markdownContent,
  buttonLabel,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`btn-help-trigger ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          color: '#64748b',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          padding: 0,
          flexShrink: 0,
        }}
        title={`Ayuda y flujo: ${title}`}
      >
        <HelpCircle size={15} style={{ color: '#0284c7' }} />
        {buttonLabel && <span style={{ marginLeft: '4px', fontSize: '11px', fontWeight: 700 }}>{buttonLabel}</span>}
      </button>

      {isOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 100,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
          >
            {/* Cabecera */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: '11px', color: '#64748b' }}>
                    Guía de uso y sentido del flujo operacional
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Cuerpo con Markdown */}
            <div
              style={{
                padding: '24px',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {renderSimpleMarkdown(markdownContent)}
            </div>

            {/* Pie */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                backgroundColor: '#f8fafc',
              }}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-primary btn-sm"
                style={{
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '8px',
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
