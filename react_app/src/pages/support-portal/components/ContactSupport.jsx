import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const ContactSupport = () => {
   const [selectedMethod, setSelectedMethod] = useState(null);

   const contactMethods = [
      {
         id: "phone",
         title: "Teléfono",
         description: "Habla directamente con nuestro equipo",
         icon: "Phone",
         availability: "Lun - Vie, 8:30 AM - 17:15 PM",
         responseTime: "Inmediata",
         contact: "2 4367 2044",
         color: "bg-success",
      },
      {
         id: "email",
         title: "Email",
         description: "Envía tu consulta por correo electrónico",
         icon: "Mail",
         availability: "24/7",
         responseTime: "24 horas",
         contact: "infoclientes@accionacn.cl",
         color: "bg-primary",
      },
      {
         id: "whatsapp",
         title: "WhatsApp",
         description: "Chatea con nosotros por WhatsApp",
         icon: "MessageCircle",
         availability: "Lun - Vie, 8:30 AM - 17:15 PM",
         responseTime: "Inmediata",
         contact: "+56 9 5348 1173",
         color: "bg-accent",
      },
   ];

   const handleContactMethod = (method) => {
      setSelectedMethod(method);
      switch (method?.id) {
         case "phone": {
            navigator.clipboard
               .writeText(method?.contact)
               .then(() => {
                  alert(`¡Número ${method?.contact} copiado al portapapeles!`);
               })
               .catch((err) => {
                  console.error("Error al copiar: ", err);
               });

            break;
         }
         case "email": {
            const correo = "infoclientes@accionacn.cl";
            const asunto = "Consulta";
            const cuerpo = "Hola, quisiera información sobre...";

            const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
               correo
            )}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

            window.open(url, "_blank", "noopener,noreferrer");
            break;
         }
         case "whatsapp":
            window.open(`https://wa.me/${method?.contact.replace(/\D/g, "")}`, "_blank");
            break;
         default:
            break;
      }
   };

   return (
      <div className="mb-8">
         <h2 className="text-2xl font-bold text-foreground mb-6">Contactar Soporte</h2>
         {/* Contact Methods */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {contactMethods?.map((method) => (
               <div
                  key={method?.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-brand-hover transition-brand cursor-pointer group"
                  onClick={() => handleContactMethod(method)}
               >
                  <div
                     className={`w-12 h-12 ${method?.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                     <Icon name={method?.icon} size={24} color="white" />
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-2">{method?.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{method?.description}</p>

                  <div className="space-y-2 text-xs">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Disponibilidad:</span>
                        <span className="font-medium text-foreground">{method?.availability}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Respuesta:</span>
                        <span className="font-medium text-foreground">{method?.responseTime}</span>
                     </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                     <p className="font-medium text-foreground text-sm">{method?.contact}</p>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};

export default ContactSupport;
