import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextType = {
  addToast: (type: ToastType, message: string) => void;
};

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const colors = {
    success: "border-green-500/30 bg-green-500/10 text-green-400",
    error: "border-red-500/30 bg-red-500/10 text-red-400",
    info: "border-brand-500/30 bg-brand-500/10 text-brand-400",
    warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  };

  return (
    <div
      className={`px-4 py-3 rounded-xl border backdrop-blur-xl text-sm font-medium shadow-lg animate-slide-in ${colors[toast.type]}`}
      onClick={onDismiss}
      role="alert"
    >
      {toast.message}
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
