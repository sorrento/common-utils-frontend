import React, { useState } from 'react';

interface JsonViewerProps {
  data: any;
  title?: string;
  defaultExpanded?: boolean;
  maxHeight?: string;
  initialDepth?: number;
}

interface JsonNodeProps {
  name?: string | number;
  value: any;
  isLast?: boolean;
  depth: number;
  maxAutoExpandDepth: number;
}

const JsonNode: React.FC<JsonNodeProps> = ({
  name,
  value,
  isLast = true,
  depth,
  maxAutoExpandDepth
}) => {
  const isObject = typeof value === 'object' && value !== null;
  const isArray = Array.isArray(value);
  const [isOpen, setIsOpen] = useState(depth <= maxAutoExpandDepth);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const renderKey = () => {
    if (name === undefined) return null;
    return (
      <span style={{ color: '#38bdf8', fontWeight: 600, marginRight: '4px' }}>
        {typeof name === 'string' ? `"${name}"` : name}:
      </span>
    );
  };

  if (!isObject) {
    let valColor = '#a78bfa'; // numbers/booleans
    let formattedVal = String(value);

    if (typeof value === 'string') {
      valColor = '#34d399'; // green for strings
      formattedVal = `"${value}"`;
    } else if (typeof value === 'number') {
      valColor = '#fbbf24'; // amber for numbers
      formattedVal = String(value);
    } else if (typeof value === 'boolean') {
      valColor = '#f472b6'; // pink for booleans
      formattedVal = value ? 'true' : 'false';
    } else if (value === null) {
      valColor = '#94a3b8'; // slate for null
      formattedVal = 'null';
    } else if (value === undefined) {
      valColor = '#94a3b8';
      formattedVal = 'undefined';
    }

    return (
      <div style={{ paddingLeft: `${depth * 18}px`, lineHeight: '1.6', whiteSpace: 'nowrap' }}>
        {renderKey()}
        <span style={{ color: valColor }}>{formattedVal}</span>
        {!isLast && <span style={{ color: '#64748b' }}>,</span>}
      </div>
    );
  }

  const keys = Object.keys(value);
  const itemCount = keys.length;
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';

  if (itemCount === 0) {
    return (
      <div style={{ paddingLeft: `${depth * 18}px`, lineHeight: '1.6', color: '#94a3b8' }}>
        {renderKey()}
        <span>{openBracket}{closeBracket}</span>
        {!isLast && <span>,</span>}
      </div>
    );
  }

  return (
    <div style={{ lineHeight: '1.6' }}>
      {/* Node Header */}
      <div
        onClick={toggle}
        style={{
          paddingLeft: `${depth * 18}px`,
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          borderRadius: '4px',
          transition: 'background 0.15s ease'
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '14px',
            height: '14px',
            fontSize: '9px',
            color: '#94a3b8',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            flexShrink: 0
          }}
        >
          ▶
        </span>

        {renderKey()}

        <span style={{ color: '#e2e8f0' }}>{openBracket}</span>

        {!isOpen && (
          <span
            style={{
              color: '#64748b',
              fontSize: '11px',
              background: 'rgba(100, 116, 139, 0.2)',
              padding: '0 6px',
              borderRadius: '4px',
              marginLeft: '4px'
            }}
          >
            {itemCount} {isArray ? (itemCount === 1 ? 'item' : 'items') : (itemCount === 1 ? 'key' : 'keys')} ... {closeBracket}
            {!isLast && ','}
          </span>
        )}
      </div>

      {/* Expanded Children */}
      {isOpen && (
        <>
          <div>
            {keys.map((key, idx) => (
              <JsonNode
                key={key}
                name={isArray ? undefined : key}
                value={value[key]}
                isLast={idx === keys.length - 1}
                depth={depth + 1}
                maxAutoExpandDepth={maxAutoExpandDepth}
              />
            ))}
          </div>

          <div style={{ paddingLeft: `${depth * 18}px`, color: '#e2e8f0' }}>
            {closeBracket}
            {!isLast && <span style={{ color: '#64748b' }}>,</span>}
          </div>
        </>
      )}
    </div>
  );
};

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  title = 'API Response JSON',
  defaultExpanded = true,
  maxHeight = '650px',
  initialDepth = 2
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const [expandDepth, setExpandDepth] = useState(initialDepth);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy json:', e);
    }
  };

  if (!data) return null;

  return (
    <div
      style={{
        marginTop: '16px',
        border: '1px solid #334155',
        borderRadius: '8px',
        background: '#090d16',
        color: '#f8fafc',
        fontFamily: 'var(--mono, "Fira Code", monospace)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        ...(isFullscreen
          ? {
              position: 'fixed',
              top: '20px',
              left: '20px',
              right: '20px',
              bottom: '20px',
              zIndex: 9999,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
            }
          : {})
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          background: '#1e293b',
          borderBottom: isExpanded ? '1px solid #334155' : 'none',
          userSelect: 'none',
          flexShrink: 0
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600, color: '#38bdf8', cursor: 'pointer' }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span style={{ fontSize: '10px' }}>{isExpanded ? '▼' : '►'}</span>
          <span>{title}</span>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>
            ({typeof data === 'object' && data !== null ? (Array.isArray(data) ? `${data.length} items` : `${Object.keys(data).length} root keys`) : typeof data})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isExpanded && (
            <>
              <button
                type="button"
                onClick={() => setExpandDepth(0)}
                title="Collapse all levels"
                style={{
                  background: '#334155',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#cbd5e1',
                  padding: '3px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Collapse All
              </button>
              <button
                type="button"
                onClick={() => setExpandDepth(6)}
                title="Expand all levels"
                style={{
                  background: '#334155',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#cbd5e1',
                  padding: '3px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Expand All
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: copied ? '#059669' : '#334155',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              padding: '3px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
          >
            {copied ? '✓ Copied' : 'Copy JSON'}
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
            style={{
              background: isFullscreen ? '#0284c7' : '#334155',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              padding: '3px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {isFullscreen ? '✕ Exit' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* Interactive Collapsible Tree Content */}
      {isExpanded && (
        <div
          key={expandDepth}
          style={{
            padding: '14px 18px',
            maxHeight: isFullscreen ? 'calc(100vh - 120px)' : maxHeight,
            height: isFullscreen ? '100%' : 'auto',
            overflowY: 'auto',
            overflowX: 'auto',
            fontSize: '12px',
            lineHeight: 1.6,
            color: '#cbd5e1',
            backgroundColor: '#090d16'
          }}
        >
          <JsonNode value={data} depth={0} maxAutoExpandDepth={expandDepth} isLast={true} />
        </div>
      )}
    </div>
  );
};
