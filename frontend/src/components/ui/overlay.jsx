import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, Field, IconButton, Textarea } from "./primitives";

function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-surface shadow-pop sm:rounded-3xl",
          size === "sm" && "sm:max-w-sm",
          size === "md" && "sm:max-w-lg",
          size === "lg" && "sm:max-w-3xl",
        )}
      >
        {/* grabber, like the app's bottom sheets */}
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line sm:hidden" />
        {title && (
          <header className="flex items-start justify-between gap-4 px-6 pb-2 pt-5">
            <div>
              <h2 className="font-display text-xl font-semibold">{title}</h2>
              {subtitle && (
                <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>
              )}
            </div>
            <IconButton label="Close" onClick={onClose} className="-me-2">
              <X className="size-5" />
            </IconButton>
          </header>
        )}
        <div className="overflow-y-auto px-6 py-4 scrollbar-thin">
          {children}
        </div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-line/70 px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, children, footer }) {
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 end-0 flex w-full max-w-xl flex-col bg-bg shadow-pop">
        <header className="flex items-center justify-between gap-4 border-b border-line/70 bg-surface px-6 py-4">
          <h2 className="truncate font-display text-xl font-semibold">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose}>
            <X className="size-5" />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-line/70 bg-surface px-6 py-4">
            {footer}
          </footer>
        )}
      </aside>
    </div>,
    document.body,
  );
}

/** Confirmation in the style of the app's "Delete account?" / "Log Out?" dialogs. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Yes",
  tone = "danger",
  loading,
  withReason,
  reasonLabel = "Reason",
}) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (open) setReason("");
  }, [open]);
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center pt-2 text-center">
        <span
          className={cn(
            "mb-3 flex size-12 items-center justify-center rounded-full",
            tone === "danger"
              ? "bg-danger-soft text-danger"
              : "bg-accent-soft text-primary",
          )}
        >
          <AlertTriangle className="size-6" />
        </span>
        <h2 className="text-lg font-bold">{title}</h2>
        {message && (
          <p className="mt-1 text-[13px] text-ink-muted">{message}</p>
        )}
      </div>
      {withReason && (
        <Field label={reasonLabel} className="mt-4">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Write here…"
          />
        </Field>
      )}
      <div className="mt-5 grid grid-cols-2 gap-2 pb-2">
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          loading={loading}
          disabled={withReason && !reason.trim()}
          onClick={() => onConfirm(reason.trim())}
        >
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

// ---------- Toasts ----------

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((text, tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-[13px] font-medium text-white shadow-pop"
          >
            {t.tone === "success" ? (
              <CheckCircle2 className="size-4 text-[#7FD8AE]" />
            ) : (
              <XCircle className="size-4 text-[#FF9C9C]" />
            )}
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
