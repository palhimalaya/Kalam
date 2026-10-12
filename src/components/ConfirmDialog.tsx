"use client";

import { useEffect, useRef } from "react";
import { dangerButtonClass, quietButtonClass } from "@/components/styles";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="w-[min(32rem,calc(100%-2rem))] rounded-xl border border-line bg-elev p-0 text-ink backdrop:bg-black/40"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <form
        className="grid gap-4 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        <h2 className="font-serif text-2xl">{title}</h2>
        <p className="text-sm leading-6 text-muted">{body}</p>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className={quietButtonClass} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className={danger ? dangerButtonClass : quietButtonClass}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
