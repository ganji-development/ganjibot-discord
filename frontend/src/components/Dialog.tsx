/**
 * Dialog Component
 * Custom modal dialog to replace browser confirm/alert dialogs
 */

import { useEffect, useRef } from 'react';
import './Dialog.css';

export interface DialogProps {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'confirm' | 'alert' | 'danger';
}

export function Dialog({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'OK',
    cancelText = 'Cancel',
    variant = 'confirm',
}: DialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);

    // Focus trap and keyboard handling
    useEffect(() => {
        if (!open) return;

        // Focus the confirm button when dialog opens
        confirmButtonRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onCancel) {
                onCancel();
            } else if (e.key === 'Enter') {
                onConfirm();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onConfirm, onCancel]);

    // Prevent body scroll when dialog is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="dialog-overlay" onClick={onCancel}>
            <div
                ref={dialogRef}
                className={`dialog ${variant}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
            >
                <h2 id="dialog-title" className="dialog-title">{title}</h2>
                <p className="dialog-message">{message}</p>
                <div className="dialog-actions">
                    {onCancel && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onCancel}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        ref={confirmButtonRef}
                        type="button"
                        className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
