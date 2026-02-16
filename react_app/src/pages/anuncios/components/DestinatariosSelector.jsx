import React, { useState, useEffect, useMemo } from "react";
import { apiFetch, API_BASE_URL } from "../../../utils/api";

const DestinatariosSelector = ({ formData, setFormData, permisos = {} }) => {
   const [searchTerm, setSearchTerm] = useState("");
   const [usuarios, setUsuarios] = useState([]);
   const [empresas, setEmpresas] = useState([]);
   const [cargosAPI, setCargosAPI] = useState([]); // Cargos desde colección roles
   const [loading, setLoading] = useState(true);

   // Estados para controlar los dropdowns
   const [showEmpresas, setShowEmpresas] = useState(false);
   const [showCargos, setShowCargos] = useState(false);

   // Estados para los buscadores INTERNOS de los dropdowns
   const [empresaSubSearch, setEmpresaSubSearch] = useState("");
   const [cargoSubSearch, setCargoSubSearch] = useState("");

   // Cargar usuarios, empresas y cargos (roles) desde el endpoint unificado
   useEffect(() => {
      const controller = new AbortController();

      const cargarDatos = async () => {
         try {
            setLoading(true);

            const filtrosRes = await apiFetch(
               `${API_BASE_URL}/auth/empresas/anuncios`, 
               { signal: controller.signal }
            );

            const filtrosData = await filtrosRes.json();
            
            if (filtrosData.success) {
               setUsuarios(filtrosData.usuarios || []);
               setEmpresas(filtrosData.empresas || []);
               setCargosAPI(filtrosData.cargos || []);
            }
         } catch (error) {
            if (error.name !== "AbortError") {
               console.error("Error cargando datos:", error);
            }
         } finally {
            console.log("FIN FETCH");
            setLoading(false);
         }
      };

      cargarDatos();

      return () => controller.abort();
   }, []);

   const cargosDisponibles = useMemo(() => {
      return cargosAPI; 
   }, [cargosAPI]);

   const handleTipoChange = (tipo) => {
     if(tipo === 'todos' && !permisos.create_anuncios_for_all) return alert('No tienes permisos para crear anuncios para todos los usuarios');
     if(tipo === 'filtro' && !permisos.create_anuncios_filter) return alert('No tienes permisos para crear anuncios para usuarios filtrados');
     if(tipo === 'manual' && !permisos.create_anuncios_manual) return alert('No tienes permisos para crear anuncios enviados manualmente');

      setFormData({
         ...formData,
         destinatarios: { ...formData.destinatarios, tipo },
      });
   };

   // Selección múltiple por CLIC (Sin CTRL) - Mínimo cambio UI
   const toggleFiltroOption = (campo, valor) => {
      const actuales = [...(formData.destinatarios?.filtro?.[campo] || [])];
      const index = actuales.indexOf(valor);

      if (index === -1) {
         actuales.push(valor);
      } else {
         actuales.splice(index, 1);
      }

      setFormData({
         ...formData,
         destinatarios: {
            ...formData.destinatarios,
            filtro: { ...formData.destinatarios?.filtro, [campo]: actuales },
         },
      });
   };

   // Reintegrado del código old: Limpiar campos de filtro específicos
   const handleFiltroChange = (campo, valores) => {
      setFormData({
         ...formData,
         destinatarios: {
            ...formData.destinatarios,
            filtro: { ...formData.destinatarios?.filtro, [campo]: valores },
         },
      });
   };

   const toggleUsuario = (userId) => {
      const current = [...(formData.destinatarios?.usuariosManuales || [])];
      const index = current.indexOf(userId);

      if (index === -1) {
         current.push(userId);
      } else {
         current.splice(index, 1);
      }

      setFormData({
         ...formData,
         destinatarios: { ...formData.destinatarios, usuariosManuales: current },
      });
   };

   // Reintegrado del código old: Filtrado completo para búsqueda manual
   const usuariosFiltrados = usuarios.filter((user) => {
      if (!searchTerm) return true;

      const term = searchTerm.toLowerCase();
      return (
         (user.nombre && user.nombre.toLowerCase().includes(term)) ||
         (user.apellido && user.apellido.toLowerCase().includes(term)) ||
         (user.mail && user.mail.toLowerCase().includes(term)) ||
         (user.empresa && user.empresa.toLowerCase().includes(term)) ||
         (user.cargo && user.cargo.toLowerCase().includes(term))
      );
   });

   // Reintegrado del código old: Conteo con normalización de texto
   const contarDestinatarios = () => {
      const tipo = formData.destinatarios?.tipo;
      
      if (tipo === "todos") {
         return usuarios.length;
      } else if (tipo === "manual") {
         return (formData.destinatarios?.usuariosManuales || []).length;
      } else if (tipo === "filtro") {
         const filtro = formData.destinatarios?.filtro || {};
         const empresasSel = filtro.empresas || [];
         const cargosSel = filtro.cargos || [];

         if (empresasSel.length === 0 && cargosSel.length === 0) {
            return usuarios.length;
         }

         const usuariosFinales = usuarios.filter((user) => {
            const uEmpresa = (user.empresa || "").trim().toLowerCase();
            const uCargo = (user.cargo || "").trim().toLowerCase();

            const cumpleEmpresa = empresasSel.length > 0 
               ? empresasSel.some(e => e.trim().toLowerCase() === uEmpresa) 
               : true;
            
            const cumpleCargo = cargosSel.length > 0 
               ? cargosSel.some(c => c.trim().toLowerCase() === uCargo) 
               : true;

            return cumpleEmpresa && cumpleCargo;
         });

         return usuariosFinales.length;
      }
      return 0;
   };

   if (loading) {
      return (
         <div className="space-y-6">
            <h3 className="text-lg font-medium text-card-foreground">Seleccionar Destinatarios</h3>
            <div className="text-center p-8">
               <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
               <p className="text-muted-foreground">Cargando datos de usuarios...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-6">
         <h3 className="text-lg font-medium text-card-foreground">Seleccionar Destinatarios</h3>

         <div className="grid grid-cols-3 gap-3">
            {permisos.create_anuncios_for_all && (
               <button
                  type="button"
                  onClick={() => handleTipoChange("todos")}
                  className={`p-4 rounded-lg border text-center transition-colors ${
                     formData.destinatarios?.tipo === "todos"
                        ? "border-primary bg-primary/10 text-card-foreground"
                        : "border-border hover:border-primary/50 bg-card text-card-foreground"
                  }`}
               >
                  <div className="font-medium">Todos los usuarios</div>
                  <div className="text-sm mt-1 text-muted-foreground">
                     {usuarios.length} usuarios activos
                  </div>
               </button>
            )}

            {permisos.create_anuncios_filter && (
               <button
                  type="button"
                  onClick={() => handleTipoChange("filtro")}
                  className={`p-4 rounded-lg border text-center transition-colors ${
                     formData.destinatarios?.tipo === "filtro"
                        ? "border-primary bg-primary/10 text-card-foreground"
                        : "border-border hover:border-primary/50 bg-card text-card-foreground"
                  }`}
               >
                  <div className="font-medium">Por filtros</div>
                  <div className="text-sm mt-1 text-muted-foreground">
                     Empresa, cargo
                  </div>
               </button>
            )}

            {permisos.create_anuncios_manual && (
               <button
                  type="button"
                  onClick={() => handleTipoChange("manual")}
                  className={`p-4 rounded-lg border text-center transition-colors ${
                     formData.destinatarios?.tipo === "manual"
                        ? "border-primary bg-primary/10 text-card-foreground"
                        : "border-border hover:border-primary/50 bg-card text-card-foreground"
                  }`}
               >
                  <div className="font-medium">Selección manual</div>
                  <div className="text-sm mt-1 text-muted-foreground">
                     Usuarios específicos
                  </div>
               </button>
            )}
         </div>

         {/* Contenido según tipo: FILTRO con buscadores internos */}
         {formData.destinatarios?.tipo === "filtro" && (
            <div className="space-y-6 p-4 bg-muted rounded-lg border border-border">
               <h4 className="font-medium text-card-foreground">Configurar filtros</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Dropdown Empresas */}
                  <div className="relative">
                     <label className="block text-sm font-medium mb-2 text-card-foreground">Empresas</label>
                     <button
                        type="button"
                        onClick={() => { setShowEmpresas(!showEmpresas); setShowCargos(false); }}
                        className="w-full border border-border rounded-lg p-2 bg-input text-left flex justify-between items-center"
                     >
                        <span className="truncate">
                           {(formData.destinatarios?.filtro?.empresas || []).length > 0 
                              ? `${(formData.destinatarios.filtro.empresas).length} seleccionadas` 
                              : "Seleccionar empresas..."}
                        </span>
                        <span>{showEmpresas ? "▲" : "▼"}</span>
                     </button>
                     
                     {showEmpresas && (
                        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                           <div className="p-2 border-b border-border sticky top-0 bg-card z-20">
                              <input 
                                 type="text"
                                 className="w-full p-2 text-xs border border-border rounded bg-muted"
                                 placeholder="Buscar empresa..."
                                 value={empresaSubSearch}
                                 onChange={(e) => setEmpresaSubSearch(e.target.value)}
                              />
                              <div className="flex justify-between mt-2">
                                 <button type="button" onClick={() => handleFiltroChange('empresas', [])} className="text-[10px] text-error font-medium uppercase">Limpiar</button>
                                 <button type="button" onClick={() => setShowEmpresas(false)} className="text-[10px] text-primary font-medium uppercase">Cerrar</button>
                              </div>
                           </div>
                           <div className="overflow-y-auto flex-1">
                              {empresas.filter(e => e.nombre.toLowerCase().includes(empresaSubSearch.toLowerCase())).map((empresa) => (
                                 <label key={empresa._id} className="flex items-center p-2 hover:bg-muted cursor-pointer transition-colors">
                                    <input
                                       type="checkbox"
                                       className="mr-2 h-4 w-4 rounded border-gray-300 text-primary"
                                       checked={(formData.destinatarios?.filtro?.empresas || []).includes(empresa.nombre)}
                                       onChange={() => toggleFiltroOption('empresas', empresa.nombre)}
                                    />
                                    <span className="text-sm text-card-foreground">{empresa.nombre}</span>
                                 </label>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Dropdown Cargos */}
                  <div className="relative">
                     <label className="block text-sm font-medium mb-2 text-card-foreground">Cargos</label>
                     <button
                        type="button"
                        onClick={() => { setShowCargos(!showCargos); setShowEmpresas(false); }}
                        className="w-full border border-border rounded-lg p-2 bg-input text-left flex justify-between items-center"
                     >
                        <span className="truncate">
                           {(formData.destinatarios?.filtro?.cargos || []).length > 0 
                              ? `${(formData.destinatarios.filtro.cargos).length} seleccionados` 
                              : "Seleccionar cargos..."}
                        </span>
                        <span>{showCargos ? "▲" : "▼"}</span>
                     </button>
                     
                     {showCargos && (
                        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                           <div className="p-2 border-b border-border sticky top-0 bg-card z-20">
                              <input 
                                 type="text"
                                 className="w-full p-2 text-xs border border-border rounded bg-muted"
                                 placeholder="Buscar cargo..."
                                 value={cargoSubSearch}
                                 onChange={(e) => setCargoSubSearch(e.target.value)}
                              />
                              <div className="flex justify-between mt-2">
                                 <button type="button" onClick={() => handleFiltroChange('cargos', [])} className="text-[10px] text-error font-medium uppercase">Limpiar</button>
                                 <button type="button" onClick={() => setShowCargos(false)} className="text-[10px] text-primary font-medium uppercase">Cerrar</button>
                              </div>
                           </div>
                           <div className="overflow-y-auto flex-1">
                              {cargosDisponibles.filter(c => c.toLowerCase().includes(cargoSubSearch.toLowerCase())).map((cargo, index) => (
                                 <label key={index} className="flex items-center p-2 hover:bg-muted cursor-pointer transition-colors">
                                    <input
                                       type="checkbox"
                                       className="mr-2 h-4 w-4 rounded border-gray-300 text-primary"
                                       checked={(formData.destinatarios?.filtro?.cargos || []).includes(cargo)}
                                       onChange={() => toggleFiltroOption('cargos', cargo)}
                                    />
                                    <span className="text-sm text-card-foreground">{cargo}</span>
                                 </label>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               </div>
               {/* Reintegrado: Nota informativa del old */}
               <div className="p-3 bg-primary/10 rounded text-sm text-primary border border-primary/20">
                  <strong>Nota:</strong> El anuncio se enviará a usuarios que cumplan con todos los filtros.
               </div>
            </div>
         )}

         {/* Contenido según tipo: MANUAL */}
         {formData.destinatarios?.tipo === "manual" && (
            <div className="space-y-4">
               <div>
                  <input
                     type="text"
                     placeholder="Buscar usuarios por nombre, email, empresa..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground"
                  />
                  {/* Reintegrado: Contador detallado de búsqueda del old */}
                  <p className="text-sm text-muted-foreground mt-1">
                     {usuariosFiltrados.length} de {usuarios.length} usuarios encontrados
                  </p>
               </div>

               <div className="max-h-64 overflow-y-auto border border-border rounded-lg bg-card">
                  {usuariosFiltrados.map((user) => (
                     <div
                        key={user._id}
                        className={`p-3 border-b border-border hover:bg-muted cursor-pointer transition-colors ${
                           (formData.destinatarios?.usuariosManuales || []).includes(user._id) ? "bg-primary/10" : "bg-card"
                        }`}
                        onClick={() => toggleUsuario(user._id)}
                     >
                        <div className="flex justify-between items-center">
                           <div>
                              <div className="font-medium text-card-foreground">{user.nombre} {user.apellido}</div>
                              <div className="text-sm text-muted-foreground">
                                 {user.cargo} • {user.empresa} • {user.mail}
                              </div>
                           </div>
                           {(formData.destinatarios?.usuariosManuales || []).includes(user._id) && (
                              <span className="text-primary font-bold">✓</span>
                           )}
                        </div>
                     </div>
                  ))}
               </div>

               {/* Reintegrado: Botones Seleccionar todos y Limpiar del old */}
               <div className="flex justify-between items-center">
                  <div className="text-sm text-card-foreground">
                     <span className="font-medium">{(formData.destinatarios?.usuariosManuales || []).length}</span> usuario(s) seleccionado(s)
                  </div>
                  <div className="space-x-2">
                     <button
                        type="button"
                        onClick={() => {
                           const allIds = usuariosFiltrados.map((u) => u._id);
                           setFormData({
                              ...formData,
                              destinatarios: { ...formData.destinatarios, usuariosManuales: allIds },
                           });
                        }}
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                     >
                        Seleccionar todos
                     </button>
                     <button
                        type="button"
                        onClick={() => {
                           setFormData({
                              ...formData,
                              destinatarios: { ...formData.destinatarios, usuariosManuales: [] },
                           });
                        }}
                        className="text-sm text-error hover:text-error/80 transition-colors"
                     >
                        Limpiar
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Resumen Final: Estructura del old */}
         <div className="p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center">
               <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center mr-3">
                  <span className="text-success">📢</span>
               </div>
               <div>
                  <div className="font-medium text-success">
                     {formData.destinatarios?.tipo === "todos" && `Se enviará a todos los usuarios (${usuarios.length})`}
                     {formData.destinatarios?.tipo === "filtro" && `Se enviará por filtros (${contarDestinatarios()})`}
                     {formData.destinatarios?.tipo === "manual" &&
                        `Se enviará a ${(formData.destinatarios?.usuariosManuales || []).length} usuario(s) seleccionado(s)`}
                  </div>
                  <div className="text-sm text-success/80 mt-1">
                     La notificación se enviará inmediatamente con todos los parámetros configurados
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default DestinatariosSelector;