import { useState } from "react";
import LoadingCard from "../clientPages/components/LoadingCard.jsx";
import Icon from "./AppIcon.jsx";

export default function AsyncActionDialog({
  open,
  title = "¿Está seguro?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loadingText = "Procesando...",
  successText = "Acción realizada correctamente",
  errorText = "Ocurrió un error",
  onConfirm,
  onClose,
}) {
  const [phase, setPhase] = useState("confirm"); 
  // confirm | loading | success | error

  if (!open) return null;

  const handleConfirm = async () => {
    try {
      setPhase("loading");
      await onConfirm();
      setPhase("success");
    } catch {
      setPhase("error");
    }
  };

  const handleClose = () => {
    setPhase("confirm");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm">

        {phase === "confirm" && (
          <div className="bg-card rounded-lg border border-border shadow-subtle p-6 text-center">
            <p className="text-sm text-muted-foreground mb-6">
              {title}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 border rounded-md"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                {confirmText}
              </button>
            </div>
          </div>
        )}

        {phase === "loading" && (
          <LoadingCard text={loadingText} />
        )}

        {phase === "success" && (
          <div className="bg-card rounded-lg border border-border shadow-subtle p-6 text-center">
            <Icon name="CheckCircle" size={36} className="mx-auto mb-3 text-success" />
            <p className="text-sm text-muted-foreground mb-4">
              {successText}
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Cerrar
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="bg-card rounded-lg border border-border shadow-subtle p-6 text-center">
            <Icon name="XCircle" size={36} className="mx-auto mb-3 text-destructive" />
            <p className="text-sm text-muted-foreground mb-4">
              {errorText}
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-2 border rounded-md"
            >
              Cerrar
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
