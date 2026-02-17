import { useState, useCallback, useRef } from "react";

export default function useAsyncDialog() {
   const [open, setOpen] = useState(false);
   const [config, setConfig] = useState({});
   const shouldRunAfterSuccessRef = useRef(false);

   const closeDialog = useCallback(() => {
      setOpen(false);

       const shouldRun = shouldRunAfterSuccessRef.current;

    setConfig((prev) => {
      if (shouldRun && prev?.onAfterSuccess) {
        prev.onAfterSuccess();
      }
      return {};
    });

   shouldRunAfterSuccessRef.current = false;

   }, []);

   /**
    * 🔁 Acción async (confirm → loading → success / error)
    */
   const openAsyncDialog = useCallback(
      (options) => {
         const { onConfirm, onAfterSuccess, ...rest } = options;

         setConfig({
            ...rest,
            initialPhase: "confirm",

            onConfirm: async () => {
               const result = await onConfirm?.();

               // si fue success, guardamos callback
               if (result?.type === "success") {
                  shouldRunAfterSuccessRef.current = true;
               }

               return result;
            },
            onAfterSuccess,
            onClose: closeDialog,
         });

         setOpen(true);
      },
      [closeDialog],
   );

   /**
    * ℹ️ Información (ex-alert)
    */
   const openInfoDialog = useCallback(
      (message, title = "Información", onAfterClose) => {
         setConfig({
            title,
            successText: message,
            confirmText: "Cerrar",
            cancelText: null,
            initialPhase: "success",
            variant: "info",
            onClose: closeDialog,
            onAfterClose,
         });
         setOpen(true);
      },
      [closeDialog],
   );

   /**
    * ❌ Error (ex-alert)
    */
   const openErrorDialog = useCallback(
      (message, title = "Error", onAfterClose) => {
         setConfig({
            title,
            errorText: message,
            confirmText: "Cerrar",
            cancelText: null,
            initialPhase: "error",
            variant: "error",
            onClose: closeDialog,
            onAfterClose,
         });
         setOpen(true);
      },
      [closeDialog],
   );

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
