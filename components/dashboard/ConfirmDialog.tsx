'use client';

import React, { useEffect, useId, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Native modal `<dialog>` confirmation prompt compliant with `modern-web-guidance: dialog`:
 * - Uses `showModal()`, zero manual `role="dialog"` / `aria-modal` / focus traps / Esc listeners
 * - Places `autoFocus` on the safe Cancel action for destructive confirmations
 * - Reads & resets `dialog.returnValue` on close
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const val = dialog.returnValue;
        dialog.returnValue = '';
        if (val === 'confirm') {
          onConfirm();
        } else {
          onCancel();
        }
      }}
      className="m-auto w-full max-w-md rounded-2xl bg-[#14151a] text-[#f2efe8] border border-white/15 p-6 shadow-2xl"
    >
      <h2 id={titleId} className="text-lg font-bold text-white mb-2">
        {title}
      </h2>
      <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">{description}</p>

      <form method="dialog" className="flex items-center justify-end gap-3">
        <button
          value="cancel"
          autoFocus
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono text-white cursor-pointer"
        >
          Cancel
        </button>
        <button
          value="confirm"
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold cursor-pointer ${
            danger
              ? 'bg-red-500 hover:bg-red-400 text-white'
              : 'bg-[#d7ff3f] hover:brightness-110 text-black'
          }`}
        >
          {confirmLabel}
        </button>
      </form>
    </dialog>
  );
}
