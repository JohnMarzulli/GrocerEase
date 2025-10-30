import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastOptions = {
  durationMs?: number;
  style?: React.CSSProperties;
};

type ToastContextType = {
  show: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode; }) {
  const [message, setMessage] = useState<string | null>(null);
  const [toastStyle, setToastStyle] = useState<React.CSSProperties | undefined>(undefined);

  const show = useCallback((msg: string, options: ToastOptions = {}) => {
    const { durationMs = 2500, style } = options;
    setMessage(msg);
    setToastStyle(style);
    if (durationMs > 0) {
      window.setTimeout(() => setMessage((m) => (m === msg ? null : m)), durationMs);
    }
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message && (
        <div className="toast" role="status" aria-live="polite" style={toastStyle}>
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
