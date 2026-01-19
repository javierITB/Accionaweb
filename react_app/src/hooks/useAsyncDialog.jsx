import { useState, useCallback } from "react";

export default function useAsyncDialog() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState({});

  const closeDialog = useCallback(() => {
    setOpen(false);
    setConfig({});
  }, []);

  /**
   * 🔁 Acción async (confirm → loading → success / error)
   */
  const openAsyncDialog = useCallback((options) => {
    setConfig({
      ...options,
      initialPhase: "confirm",
      onClose: closeDialog,
    });
    setOpen(true);
  }, [closeDialog]);

  /**
   * ℹ️ Información (ex-alert)
   */
const openInfoDialog = useCallback((message, title = "Información") => {
  setConfig({
    title,
    successText: message,
    confirmText: "Cerrar",
    cancelText: null,
    initialPhase: "success",
    variant: "info",
    onClose: closeDialog,
  });
  setOpen(true);
}, [closeDialog]);

  /**
   * ❌ Error (ex-alert)
   */
  const openErrorDialog = useCallback((message, title = "Error") => {
    setConfig({
      title,
      errorText: message,
      confirmText: "Cerrar",
      cancelText: null,
      initialPhase: "error",
      variant: "error",
      onClose: closeDialog,
    });
    setOpen(true);
  }, [closeDialog]);

  return {
    dialogProps: {
      open,
      ...config,
    },
    openAsyncDialog,
    openInfoDialog,
    openErrorDialog,
  };
}
