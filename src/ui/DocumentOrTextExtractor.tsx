import React, { useState, useRef } from 'react';
import { UploadCloudIcon, SparklesIcon } from '../icons/Icons';

export interface DocumentOrTextExtractorProps {
  /** Callback fired when a valid PDF, image or document file is uploaded */
  onFileUpload?: (file: File) => void;
  /** Callback fired when user submits pasted recap / document text */
  onTextSubmit?: (text: string) => void;
  /** Loading state flag to display progress bar */
  loading?: boolean;
  /** Custom section title */
  title?: string;
  /** Custom section subtitle / description */
  subtitle?: string;
  /** File input accept attribute (defaults to .pdf, image/*, .txt) */
  acceptedFormats?: string;
  /** Label for drop area */
  dropAreaTitle?: string;
  /** Description for drop area */
  dropAreaDescription?: string;
  /** Textarea placeholder */
  textPlaceholder?: string;
  /** Text submit button label */
  buttonLabel?: string;
}

export const DocumentOrTextExtractor: React.FC<DocumentOrTextExtractorProps> = ({
  onFileUpload,
  onTextSubmit,
  loading = false,
  title = 'Auto-fill Fields with AI Extractor',
  subtitle = 'Scanning document with AI... Extracting vessel, ports & cargo...',
  acceptedFormats = '.pdf,image/*,.txt',
  dropAreaTitle = 'Drop PDF or Voyage Instructions here',
  dropAreaDescription = 'Supported formats: .pdf, .txt, .png, .jpg',
  textPlaceholder = 'Paste voyage recap, fixture note or email text here...',
  buttonLabel = 'Extract Fields with AI →'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleTextSubmit = () => {
    if (pastedText.trim() && onTextSubmit) {
      onTextSubmit(pastedText);
    }
  };

  return (
    <div
      className="document-or-text-extractor"
      style={{
        background: '#f7f9fb',
        border: '1px solid #e0e3e5',
        borderRadius: '10px',
        padding: '16px 18px',
        marginBottom: '20px',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Title */}
      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#191c1e', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SparklesIcon size={14} color="#7e22ce" />
          <span>{title}</span>
        </span>
      </div>

      {/* Side-by-side Grid: Text Paste on Left (Wider), Drag & Drop on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '16px', alignItems: 'start' }}>
        {/* Left Column: Paste Text Zone (Wider area for typing/pasting) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            placeholder={textPlaceholder}
            value={pastedText}
            onChange={(e) => {
              setPastedText(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.max(110, Math.min(e.target.scrollHeight, 450))}px`;
            }}
            style={{
              width: '100%',
              minHeight: '110px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #c6c6cd',
              fontSize: '13px',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              background: '#ffffff',
              boxSizing: 'border-box',
              lineHeight: '1.45'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#76777d' }}>
              {pastedText.length} chars
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {pastedText && (
                <button
                  type="button"
                  onClick={() => setPastedText('')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    border: 'none',
                    background: 'transparent',
                    color: '#76777d',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                className="btn primary"
                onClick={handleTextSubmit}
                disabled={!pastedText.trim() || loading}
                style={{
                  fontSize: '12px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: '#191c1e',
                  color: '#ffffff',
                  fontWeight: 600,
                  border: 'none',
                  cursor: !pastedText.trim() || loading ? 'not-allowed' : 'pointer',
                  opacity: !pastedText.trim() || loading ? 0.6 : 1
                }}
              >
                {buttonLabel}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Drag & Drop PDF Zone */}
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 16px',
            border: isDragging ? '2px dashed #004395' : '1.5px dashed #004395',
            borderRadius: '8px',
            background: isDragging ? 'rgba(0,67,149,0.04)' : '#ffffff',
            cursor: 'pointer',
            textAlign: 'center',
            minHeight: '140px',
            boxSizing: 'border-box',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ marginBottom: '8px' }}>
            <UploadCloudIcon size={32} color="#004395" />
          </div>
          <strong style={{ fontSize: '13px', color: '#004395', fontWeight: 700 }}>
            {dropAreaTitle}
          </strong>
          <span style={{ fontSize: '12px', color: '#76777d', marginTop: '4px' }}>
            {dropAreaDescription}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Loading Progress State */}
      {loading && (
        <div style={{ marginTop: '14px' }}>
          <div style={{ height: '4px', background: '#e0e3e5', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: '75%',
                background: '#004395',
                borderRadius: '2px',
                animation: 'pulse 1.5s infinite'
              }}
            />
          </div>
          <small style={{ color: '#45464d', fontSize: '12px', display: 'block', marginTop: '6px' }}>
            {subtitle}
          </small>
        </div>
      )}
    </div>
  );
};
