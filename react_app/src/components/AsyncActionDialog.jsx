import { useState, useEffect } from "react";
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
  initialPhase = "confirm", // confirm | loading | success | error
  variant = "success", // success | error | info
  onConfirm,
  onClose,
}) {
  const [phase, setPhase] = useState(initialPhase);

  // 🔁 sincroniza la fase cada vez que se abre
  useEffect(() => {
    if (open) {
      setPhase(initialPhase);
    }
  }, [open, initialPhase]);

  if (!open) return null;

  const handleConfirm = async () => {
    // Dialogs informativos
    if (!onConfirm) {
      handleClose();
      return;
    }

    try {
      setPhase("loading");
      await onConfirm();
      setPhase("success");
    } catch {
      setPhase("error");
    }
  };

  const handleClose = () => {
    setPhase(initialPhase);
    onClose();
  };

  const renderIcon = () => {
    if (phase === "success") {
      if (variant === "info") {
        return (
          <Icon
            name="AlertCircle"
            size={48}
            className="mx-auto mb-3 text-accent"
          />
        );
      }

      return (
        <Icon
          name="CheckCircle"
          size={48}
          className="mx-auto mb-3 text-success"
        />
      );
    }

    if (phase === "error") {
      return (
        <Icon
          name="XCircle"
          size={48}
          className="mx-auto mb-3 text-destructive"
        />
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm">

        {/* CONFIRM */}
        {phase === "confirm" && (
          <div className="bg-card rounded-lg border border-border shadow-subtle p-6 text-center">
            <p className="text-sm text-muted-foreground mb-6">
              {title}
            </p>

            <div className="flex justify-center gap-3">
              {cancelText && (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border rounded-md"
                >
                  {cancelText}
                </button>
              )}

              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                {confirmText}
              </button>
            </div>
          </div>
        )}

        {/* LOADING */}
        {phase === "loading" && (
          <LoadingCard text={loadingText} />
        )}

        {/* RESULT (SUCCESS / INFO / ERROR) */}
        {(phase === "success" || phase === "error") && (
          <div className="bg-card rounded-lg border border-border shadow-subtle p-6 text-center">
            {renderIcon()}

            <p className="text-sm text-muted-foreground mb-4">
              {phase === "error" ? errorText : successText}
            </p>

            <button
              onClick={handleClose}
              className={`px-4 py-2 rounded-md ${
                phase === "error"
                  ? "border"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              Cerrar
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
