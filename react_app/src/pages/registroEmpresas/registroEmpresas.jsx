import React, { useState, useEffect, useMemo } from "react";
import { apiFetch, API_BASE_URL } from "../../utils/api";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import LoadingCard from "clientPages/components/LoadingCard";
import { Navigate } from "react-router-dom";

const RegistroEmpresas = ({ userPermissions = [] }) => {
   // --- ESTADOS DE PESTAÑAS Y SELECCIÓN ---
   const [activeTab, setActiveTab] = useState("registro"); 
   const [selectedCompany, setSelectedCompany] = useState("");
   const [empresasOptions, setEmpresasOptions] = useState([]);

   // --- PERMISOS ---
   const canAccess = useMemo(() => userPermissions.includes("view_gestor_empresas"), [userPermissions]);
   const permisosDetalle = useMemo(() => ({
      ver: userPermissions.includes("view_registro_cambios_details"),
   }), [userPermissions]);

   // --- ESTADOS DE DATOS ---
   const [registros, setRegistros] = useState([]);
   const [modalOpen, setModalOpen] = useState(false);
   const [selectedRegistro, setSelectedRegistro] = useState(null);
   const [page, setPage] = useState(1);
   const [limit] = useState(10);
   const [pagination, setPagination] = useState(null);
   const [loading, setLoading] = useState(false);

   // --- SIDEBAR LOGIC ---
   const [isDesktopOpen, setIsDesktopOpen] = useState(true);
   const [isMobileOpen, setIsMobileOpen] = useState(false);
   const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

   useEffect(() => {
      const handleResize = () => {
         const isMobile = window.innerWidth < 768;
         setIsMobileScreen(isMobile);
         if (isMobile) setIsMobileOpen(false);
      };
      window.addEventListener("resize", handleResize);
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
   }, []);

   const toggleSidebar = () => isMobileScreen ? setIsMobileOpen(!isMobileOpen) : setIsDesktopOpen(!isDesktopOpen);
   const handleNavigation = () => isMobileScreen && setIsMobileOpen(false);

   const closeModal = () => { setSelectedRegistro(null); setModalOpen(false); };

   // --- CARGAR EMPRESAS ---
   useEffect(() => {
      const loadOptions = async () => {
         try {
            const response = await apiFetch(`${API_BASE_URL}/sas/companies`);
            if (response.ok) {
               const result = await response.json();
               setEmpresasOptions(Array.isArray(result) ? result : result.data || []);
            }
         } catch (error) {
            console.error("Error cargando empresas:", error);
         }
      };
      loadOptions();
   }, []);

   // --- FETCH DINÁMICO CON ALERTA DE DIAGNÓSTICO ---
   const fetchDatos = async (currentPage = page) => {
      if (!selectedCompany) return;
      try {
         setLoading(true);
         
         // Ajustamos ambos para que usen las rutas quirúrgicas que creamos
         const endpoint = activeTab === "registro" 
            ? "registro/todos/registroempresa"    // <--- Nueva ruta para cambios
            : "auth/logins/registroempresas";      // <--- Ruta para logins que ya funciona
   
         const baseUrl = API_BASE_URL.replace(/\/api$/, "");
         
         const segment = (selectedCompany === "formsdb" || selectedCompany === "api") ? "api" : selectedCompany;
         const url = `${baseUrl}/${segment}/${endpoint}?page=${currentPage}&limit=${limit}`;
   
         console.log("Invocando URL dinámica:", url);
   
         const response = await apiFetch(url);

         // --- BLOQUE DE DIAGNÓSTICO PARA VER POR QUÉ TE SACA ---
         if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
               window.alert(
                  `¡Diagnóstico de Seguridad!\n\n` +
                  `Código de error: ${response.status}\n` +
                  `Segmento: ${segment}\n` +
                  `Endpoint: ${endpoint}\n\n` +
                  `Si después de aceptar esta alerta te saca de la página, confirma que el Backend permite tu Token en la base de datos "${segment}".`
               );
               setRegistros([]);
               setLoading(false);
               return; 
            }
         }

         if (response.ok) {
            const result = await response.json();
            const dataFinal = result.data || result;
            setRegistros(Array.isArray(dataFinal) ? dataFinal : []);
            setPagination(result.pagination || null);
         }
      } catch (error) {
         console.error("Error cargando datos:", error);
         window.alert("Error de red o conexión: " + error.message);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchDatos();
   }, [page, activeTab, selectedCompany]);

   // --- FORMATTERS ---
   const formatDateSplit = (dateString) => {
      if (!dateString) return "—";
      const date = new Date(dateString);
      return (
         <div className="flex flex-col items-center text-sm">
            <span>{date.toLocaleDateString("es-CL")}</span>
            <span className="text-muted-foreground text-xs">{date.toLocaleTimeString("es-CL")}</span>
         </div>
      );
   };

   function formatText(text) {
      if (!text) return "—";
      return text.replace(/_/g, " ").charAt(0).toUpperCase() + text.slice(1).replace(/_/g, " ");
   }

   const renderMetadata = (data, level = 0) => {
      return Object.entries(data).map(([key, value]) => {
         const isObject = typeof value === "object" && value !== null && !Array.isArray(value);
         return (
            <div key={key} className={level > 0 ? "ml-4" : ""}>
               <p className="mb-1 text-foreground">
                  <span className="font-semibold">{formatText(key)}:</span>{" "}
                  {!isObject && `"${formatText(String(value))}"`}
               </p>
               {isObject && renderMetadata(value, level + 1)}
            </div>
         );
      });
   };

   const getTabContent = () => {
      return (
         <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div className="flex gap-1 items-center">
                  <h3 className="text-lg font-semibold text-foreground">
                     {activeTab === "registro" ? "Eventos registrados" : "Logins registrados"}
                  </h3>
                  {pagination && <span className="text-sm text-muted-foreground">({pagination.total || registros.length})</span>}
               </div>

               {pagination?.totalPages > 1 && (
                  <div className="flex items-center space-x-4">
                     <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrevPage || loading}>
                        <Icon name="ChevronLeft" size={16} className="mr-2" /> Anterior
                     </Button>
                     <div className="flex items-center gap-0 bg-muted px-4 py-1.5 rounded-full text-muted-foreground">
                        <span className="font-medium">{pagination.page} / {pagination.totalPages}</span>
                     </div>
                     <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage || loading}>
                        Siguiente <Icon name="ChevronRight" size={16} className="ml-2" />
                     </Button>
                  </div>
               )}
            </div>

            {loading ? <LoadingCard text="Consultando base de datos..." /> : (
               <div className="overflow-x-auto w-full">
                  <table className="min-w-full border border-border rounded-lg">
                     {activeTab === "registro" ? (
                        <>
                           <thead className="bg-muted text-sm text-muted-foreground">
                              <tr>
                                 <th className="px-4 py-2 text-center">Código</th>
                                 <th className="px-4 py-2 text-center">Rol</th>
                                 <th className="px-4 py-2 text-left min-w-[200px]">Descripción</th>
                                 <th className="px-4 py-2 text-center">Afectado</th>
                                 <th className="px-4 py-2 text-center">Fecha</th>
                                 <th className="px-4 py-2 text-center">Detalles</th>
                              </tr>
                           </thead>
                           <tbody>
                              {registros.map((reg, i) => (
                                 <tr key={i} className="border-t hover:bg-muted/30 transition">
                                    <td className="px-4 py-2 text-[11px] text-center">{reg.code}</td>
                                    <td className="px-4 py-2 text-sm text-center">{reg.actor?.role}</td>
                                    <td className="px-4 py-2 text-sm">{reg.description}</td>
                                    <td className="px-4 py-2 text-sm text-center">{reg.target?.type}</td>
                                    <td className="px-4 py-2 text-sm">{formatDateSplit(reg.createdAt)}</td>
                                    <td className="px-4 py-2 text-center">
                                       <Button variant="outlineTeal" size="sm" onClick={() => { setSelectedRegistro(reg); setModalOpen(true); }}>Ver más</Button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </>
                     ) : (
                        <>
                           <thead className="bg-muted text-sm text-muted-foreground">
                              <tr>
                                 <th className="px-4 py-2 text-left">Nombre</th>
                                 <th className="px-4 py-2 text-left">Email</th>
                                 <th className="px-4 py-2 text-left">Cargo</th>
                                 <th className="px-4 py-2 text-left">IP</th>
                                 <th className="px-4 py-2 text-left">Navegador</th>
                                 <th className="px-4 py-2 text-left">S.O.</th>
                                 <th className="px-4 py-2 text-left">Fecha Ingreso</th>
                              </tr>
                           </thead>
                           <tbody>
                              {registros.map((login, i) => (
                                 <tr key={i} className="border-t hover:bg-muted/30 transition">
                                    <td className="px-4 py-2 font-medium text-sm">{login.usr?.name}</td>
                                    <td className="px-4 py-2 text-sm">{login.usr?.email}</td>
                                    <td className="px-4 py-2 text-sm">{login.usr?.cargo || '—'}</td>
                                    <td className="px-4 py-2 text-sm">{login.ipAddress || '—'}</td>
                                    <td className="px-4 py-2 text-sm">{login.browser || '—'}</td>
                                    <td className="px-4 py-2 text-sm">{login.os || '—'}</td>
                                    <td className="px-4 py-2 text-sm">{login.now ? login.now.replace("T", " ").split(".")[0] : '—'}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </>
                     )}
                  </table>
               </div>
            )}
         </div>
      );
   };

   if (!loading && !canAccess) return <Navigate to="/panel" replace />;

   const mainMarginClass = isMobileScreen ? "ml-0" : isDesktopOpen ? "ml-64" : "ml-16";

   return (
      <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
         <Header />
         <Sidebar isCollapsed={!isDesktopOpen} onToggleCollapse={toggleSidebar} isMobileOpen={isMobileOpen} onNavigate={handleNavigation} />
         
         <main className={`transition-all duration-300 ${mainMarginClass} pt-20 md:pt-16 flex-1 flex flex-col`}>
            <div className="p-6 space-y-6 container-main">
               
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                     <h1 className="text-2xl md:text-3xl font-bold text-foreground">Registro de Empresas</h1>
                     <p className="text-muted-foreground text-sm"></p>
                  </div>

                  <div className="relative min-w-[260px] w-full md:w-auto">
                     <select
                        value={selectedCompany}
                        onChange={(e) => { setSelectedCompany(e.target.value); setPage(1); }}
                        className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm outline-none appearance-none hover:border-indigo-400 cursor-pointer transition-all"
                     >
                        <option value="">Seleccionar Empresa...</option>
                        {empresasOptions.map((emp) => (
                           <option key={emp._id} value={emp.dbName}>{emp.nombre || emp.name}</option>
                        ))}
                     </select>
                     <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Icon name="Building2" size={16} /></div>
                  </div>
               </div>

               <div className="flex space-x-1 rounded-lg bg-muted/50 p-1 w-fit">
                  <button onClick={() => { setActiveTab("registro"); setPage(1); }} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "registro" ? "bg-indigo-600 text-white shadow-md" : "text-muted-foreground hover:bg-muted"}`}>Registro de Cambios</button>
                  <button onClick={() => { setActiveTab("ingresos"); setPage(1); }} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "ingresos" ? "bg-indigo-600 text-white shadow-md" : "text-muted-foreground hover:bg-muted"}`}>Registro de Ingresos</button>
               </div>

               <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                  {getTabContent()}
               </div>
            </div>
         </main>

         {modalOpen && selectedRegistro && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={closeModal}>
               <div className="bg-background rounded-lg shadow-2xl w-full max-w-lg p-6 relative overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                  <button className="absolute top-3 right-3 text-muted-foreground text-2xl font-bold" onClick={closeModal}>×</button>
                  <div className="flex items-center gap-3 border-b border-border pb-2">
                     <Icon name="CheckCircle" size={28} className="text-success" />
                     <h2 className="text-xl md:text-2xl font-bold">Detalles del Evento</h2>
                  </div>
                  <div className="flex flex-col gap-4 divide-y divide-border text-sm mt-4">
                     <div><p><span className="font-semibold">Código:</span> {selectedRegistro.code}</p></div>
                     <div><p><span className="font-semibold">Descripción:</span> {selectedRegistro.description}</p></div>
                     <div className="pt-4">
                        <p className="font-semibold pb-1">Actor:</p>
                        <p><span className="pl-2 font-semibold">Nombre:</span> {`${selectedRegistro.actor?.name || ""} ${selectedRegistro.actor?.last_name || ""}`}</p>
                        <p><span className="pl-2 font-semibold">Email:</span> {selectedRegistro.actor?.email}</p>
                     </div>
                     {selectedRegistro.metadata && <div className="pt-4">{renderMetadata(selectedRegistro.metadata)}</div>}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default RegistroEmpresas;