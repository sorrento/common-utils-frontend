import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Icons } from '../icons/Icons';
import { notify } from '../ui/Toast';

export interface EmailAttachment {
  name: string;
  sizeBytes?: number;
  type?: string;
}

export interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  attachments?: EmailAttachment[];
  onSend?: (emailData: { to: string; cc: string; bcc: string; subject: string; body: string }) => void;
  serviceConnected?: boolean;
}

export const EmailComposerModal: React.FC<EmailComposerModalProps> = ({
  isOpen,
  onClose,
  to: initialTo = '',
  cc: initialCc = '',
  bcc: initialBcc = '',
  subject: initialSubject = '',
  body: initialBody = '',
  attachments = [],
  onSend,
  serviceConnected = false,
}) => {
  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState(initialCc);
  const [bcc, setBcc] = useState(initialBcc);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [showCcBcc, setShowCcBcc] = useState(Boolean(initialCc || initialBcc));

  useEffect(() => {
    if (isOpen) {
      setTo(initialTo);
      setCc(initialCc);
      setBcc(initialBcc);
      setSubject(initialSubject);
      setBody(initialBody);
      setShowCcBcc(Boolean(initialCc || initialBcc));
    }
  }, [isOpen, initialTo, initialCc, initialBcc, initialSubject, initialBody]);

  const handleSend = () => {
    if (!to.trim()) {
      notify.error('Please enter at least one recipient email address.', 'Missing Recipient');
      return;
    }

    if (onSend) {
      onSend({ to, cc, bcc, subject, body });
    }

    if (!serviceConnected) {
      notify.info(
        'Email prepared and queued. The direct SMTP / mail server integration is currently simulated.',
        'Simulated Dispatch'
      );
    } else {
      notify.success(`Email dispatched to ${to}`, 'Email Sent');
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compose Email" maxWidth="640px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
        {/* Connection Notice Banner */}
        {!serviceConnected && (
          <div
            style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              color: '#166534',
              padding: '10px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              lineHeight: 1.4,
            }}
          >
            <span style={{ fontSize: '15px' }}>ℹ️</span>
            <div>
              <strong>Email Dispatch Preview:</strong> Direct SMTP/Exchange email server is not yet connected. You can review, adjust details, or copy content before sending.
            </div>
          </div>
        )}

        {/* Recipients */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ width: '60px', fontWeight: 600, color: '#475569', fontSize: '12px' }}>To:</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. operations@agency.com, accounts@client.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{
                flex: 1,
                padding: '7px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12.5px',
                outline: 'none',
              }}
            />
            {!showCcBcc && (
              <button
                type="button"
                onClick={() => setShowCcBcc(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 6px',
                }}
              >
                Cc / Bcc
              </button>
            )}
          </div>

          {showCcBcc && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ width: '60px', fontWeight: 600, color: '#475569', fontSize: '12px' }}>Cc:</label>
                <input
                  type="text"
                  placeholder="e.g. hub@newmaritime.com"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ width: '60px', fontWeight: 600, color: '#475569', fontSize: '12px' }}>Bcc:</label>
                <input
                  type="text"
                  placeholder="e.g. archive@newmaritime.com"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>
            </>
          )}

          {/* Subject */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ width: '60px', fontWeight: 600, color: '#475569', fontSize: '12px' }}>Subject:</label>
            <input
              type="text"
              placeholder="Email subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                flex: 1,
                padding: '7px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 600,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Attachments Section */}
        {attachments.length > 0 && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '6px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Attachments ({attachments.length}):
            </span>
            {attachments.map((att, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '11.5px',
                  color: '#1e293b',
                  fontWeight: 500,
                }}
              >
                📎 {att.name}
              </span>
            ))}
          </div>
        )}

        {/* Email Body Editor */}
        <div>
          <textarea
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your email message here..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '13px',
              lineHeight: 1.5,
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>

        {/* Modal Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={onClose}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12.5px',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handleSend}
            style={{
              padding: '7px 16px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--navy, #16324F)',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12.5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {Icons.mail} Send Email
          </button>
        </div>
      </div>
    </Modal>
  );
};
