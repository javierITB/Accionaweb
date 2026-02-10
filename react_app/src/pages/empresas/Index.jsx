import React, { useState, useEffect, useMemo } from "react";
import { apiFetch, API_BASE_URL } from "../../utils/api";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import RegisterForm from "./components/RegisterForm";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import { Navigate } from "react-router-dom";
// Función para procesar logos (Recuperada al 100%)
const createDataURL = (logoObj) => {
   if (logoObj && logoObj.fileData && logoObj.mimeType) {
      return `data:${logoObj.mimeType};base64,${logoObj.fileData}`;
   }
   return null;
};

/**
 * CompanyReg - Gestión de Empresas
 * Recupera lógica de ordenamiento completa y aplica permisos del ProtectedRoute
 */
const CompanyReg = ({ userPermissions = [] }) => {
   // --- LÓGICA DE PERMISOS ---
   const permisos = useMemo(
      () => ({
         crear: userPermissions.includes("create_empresas"),
         editar: userPermissions.includes("edit_empresas"),
         eliminar: userPermissions.includes("delete_empresas"),
      }),
      [userPermissions],
   );

   const [empresas, setEmpresas] = useState([]);
   const [editingEmpresa, setEditingEmpresa] = useState(null);
   const [formData, setFormData] = useState({
      nombre: "",
      rut: "",
      direccion: "",
      encargado: "",
      rut_encargado: "",
      logo: null,
      logoUrl: null,
   });
   const [isLoading, setIsLoading] = useState(false);
   const [activeTab, setActiveTab] = useState("list");

   const [searchTerm, setSearchTerm] = useState("");
   const [sortConfig, setSortConfig] = useState({ key: "nombre", direction: "asc" });

   // Manejo de Sidebar y Responsividad (Recuperado al 100%)
   const [isDesktopOpen, setIsDesktopOpen] = useState(true);
   const [isMobileOpen, setIsMobileOpen] = useState(false);
   const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

   // Efecto de seguridad para pestañas
   useEffect(() => {
      if (!permisos.crear && activeTab === "register" && !editingEmpresa) {
         setActiveTab("list");
      }
   }, [permisos.crear, activeTab, editingEmpresa]);

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

   const toggleSidebar = () => {
      if (isMobileScreen) setIsMobileOpen(!isMobileOpen);
      else setIsDesktopOpen(!isDesktopOpen);
   };

   const handleNavigation = () => {
      if (isMobileScreen) setIsMobileOpen(false);
   };

   const fetchEmpresas = async () => {
      try {
         const response = await apiFetch(`${API_BASE_URL}/auth/empresas/todas`);
         if (response.ok) {
            const empresasData = await response.json();
            const transformedData = empresasData.map((empresa) => ({
               ...empresa,
               logo: empresa.logo && typeof empresa.logo === "object" ? createDataURL(empresa.logo) : empresa.logo,
            }));
            setEmpresas(transformedData);
         }
      } catch (error) {
         console.error("Error cargando empresas:", error);
      }
   };

   useEffect(() => {
      fetchEmpresas();
   }, []);

   const requestSort = (key) => {
      let direction = "asc";
      if (sortConfig.key === key && sortConfig.direction === "asc") {
         direction = "desc";
      }
      setSortConfig({ key, direction });
   };

   // Lógica de filtrado y ordenamiento (Recuperada del código viejo con hover effects)
   const sortedEmpresas = useMemo(() => {
      let processData = [...empresas].filter((e) => e.nombre !== "Todas");

      if (searchTerm.trim() !== "") {
         const term = searchTerm.toLowerCase();
         processData = processData.filter(
            (e) =>
               String(e.nombre).toLowerCase().includes(term) ||
               String(e.rut).toLowerCase().includes(term) ||
               String(e.direccion).toLowerCase().includes(term) ||
               String(e.encargado).toLowerCase().includes(term),
         );
      }

      if (sortConfig.key !== null) {
         processData.sort((a, b) => {
            const aValue = a[sortConfig.key] ? String(a[sortConfig.key]).toLowerCase() : "";
            const bValue = b[sortConfig.key] ? String(b[sortConfig.key]).toLowerCase() : "";
            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
         });
      }
      return processData;
   }, [empresas, sortConfig, searchTerm]);

   const canAccess = userPermissions.includes("view_empresas");
   if (!canAccess) return <Navigate to="/panel" replace />;

   const clearForm = () => {
      setFormData({ nombre: "", rut: "", direccion: "", encargado: "", rut_encargado: "", logo: null, logoUrl: null });
      setEditingEmpresa(null);
      setActiveTab(permisos.crear ? "register" : "list");
   };

   const handleEditEmpresa = async (empresaId) => {
      if (!permisos.editar) return;
      setIsLoading(true);
      setActiveTab("register");

      try {
         const response = await apiFetch(`${API_BASE_URL}/auth/empresas/${empresaId}`);
         if (!response.ok) throw new Error("Error al cargar la empresa");
         const empresa = await response.json();
         const logoDataURL = createDataURL(empresa.logo);

         setEditingEmpresa(empresa);
         setFormData({
            nombre: empresa.nombre || "",
            rut: empresa.rut || "",
            direccion: empresa.direccion || "",
            encargado: empresa.encargado || "",
            rut_encargado: empresa.rut_encargado || "",
            logo: null,
            logoUrl: logoDataURL,
         });

         window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
         alert("Error al cargar datos para edición: " + error.message);
         setActiveTab("list");
      } finally {
         setIsLoading(false);
      }
   };

   const handleRemoveEmpresa = async (empresaId) => {
      if (!permisos.eliminar) return;
      if (!window.confirm("¿Seguro que deseas eliminar esta empresa?")) return;
      setIsLoading(true);
      try {
         const response = await apiFetch(`${API_BASE_URL}/auth/empresas/${empresaId}`, { method: "DELETE" });
         if (response.ok) {
            alert("Empresa eliminada");
            fetchEmpresas();
         }
      } catch (error) {
         alert(error.message);
      } finally {
         setIsLoading(false);
      }
   };

   const handleRegisterEmpresa = async () => {
      const isUpdating = !!editingEmpresa;
      if (isUpdating && !permisos.editar) return;
      if (!isUpdating && !permisos.crear) return;

      if (!formData.nombre || !formData.rut) {
         alert("Completa los campos obligatorios");
         return;
      }
      setIsLoading(true);
      try {
         const submitData = new FormData();
         Object.keys(formData).forEach((key) => {
            if (key === "logo" && formData[key] instanceof File) {
               submitData.append("logo", formData[key]);
            } else if (key !== "logo" && key !== "logoUrl") {
               submitData.append(key, formData[key] || "");
            }
         });

         const url = isUpdating
            ? `${API_BASE_URL}/auth/empresas/${editingEmpresa._id}`
            : `${API_BASE_URL}/auth/empresas/register`;
         const response = await apiFetch(url, { method: isUpdating ? "PUT" : "POST", body: submitData });

         if (response.ok) {
            alert(`Empresa ${isUpdating ? "actualizada" : "registrada"} exitosamente`);
            clearForm();
            fetchEmpresas();
            setActiveTab("list");
         } else {
            const errData = await response.json();
            throw new Error(errData.message || "Error en el servidor");
         }
      } catch (error) {
         alert("Error al guardar: " + error.message);
      } finally {
         setIsLoading(false);
      }
   };

   const renderSortIcon = (key) => {
      if (sortConfig.key !== key) return <Icon name="ChevronsUpDown" size={14} className="ml-1 inline opacity-30" />;
      return sortConfig.direction === "asc" ? (
         <Icon name="ChevronUp" size={14} className="ml-1 inline text-primary" />
      ) : (
         <Icon name="ChevronDown" size={14} className="ml-1 inline text-primary" />
      );
   };

   const getTabContent = () => {
      if (activeTab === "register") {
         if (!permisos.crear && !editingEmpresa)
            return (
               <div className="p-10 text-center italic text-muted-foreground">
                  No tienes permisos para realizar registros.
               </div>
            );
         return (
            <RegisterForm
               formData={formData}
               onUpdateFormData={(f, v) => setFormData((p) => ({ ...p, [f]: v }))}
               onRegister={handleRegisterEmpresa}
               isLoading={isLoading}
               isEditing={!!editingEmpresa}
               onCancelEdit={clearForm}
            />
         );
      }

      return (
         <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
               <h3 className="text-lg font-semibold text-foreground">Empresas Registradas</h3>
               <div className="relative w-full md:w-80">
                  <Icon
                     name="Search"
                     size={16}
                     className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500"
                  />
                  <input
                     type="text"
                     placeholder="Buscar por nombre, RUT o dirección..."
                     className="w-full pl-10 pr-10 py-2.5 bg-card text-foreground border border-border placeholder:text-muted-foreground rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                     <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground"
                     >
                        <Icon name="X" size={14} />
                     </button>
                  )}
               </div>
            </div>

            {empresas.length < 1 ? (
               <p className="text-muted-foreground">No hay empresas registradas.</p>
            ) : (
               <div className="overflow-x-auto border border-border rounded-lg shadow-sm">
                  <table className="min-w-full">
                     <thead className="bg-muted text-sm text-muted-foreground">
                        <tr>
                           <th className="px-4 py-3 text-left font-medium">Logo</th>
                           {/* Recuperados los HOVER EFFECTS del código viejo en las cabeceras */}
                           <th
                              className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted-foreground/10"
                              onClick={() => requestSort("nombre")}
                           >
                              Nombre {renderSortIcon("nombre")}
                           </th>
                           <th
                              className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted-foreground/10"
                              onClick={() => requestSort("rut")}
                           >
                              RUT {renderSortIcon("rut")}
                           </th>
                           <th
                              className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted-foreground/10"
                              onClick={() => requestSort("direccion")}
                           >
                              Dirección {renderSortIcon("direccion")}
                           </th>
                           <th
                              className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted-foreground/10"
                              onClick={() => requestSort("encargado")}
                           >
                              Encargado {renderSortIcon("encargado")}
                           </th>
                           <th className="px-4 py-3 text-center font-medium">Acciones</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-border bg-card">
                        {sortedEmpresas.map((empresa) => (
                           <tr key={empresa._id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3">
                                 {empresa.logo ? (
                                    <img src={empresa.logo} alt="" className="w-10 h-10 object-contain rounded p-0.5" />
                                 ) : (
                                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                       <Icon name="Building2" size={16} className="text-muted-foreground" />
                                    </div>
                                 )}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold">{empresa.nombre}</td>
                              <td className="px-4 py-3 text-sm">{empresa.rut}</td>
                              <td className="px-4 py-3 text-sm max-w-xs truncate">{empresa.direccion || "—"}</td>
                              <td className="px-4 py-3 text-sm">{empresa.encargado || "—"}</td>
                              <td className="px-4 py-3">
                                 <div className="flex justify-center items-center gap-2">
                                    {permisos.editar && (
                                       <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEditEmpresa(empresa._id)}
                                          iconName="Edit"
                                          className="h-8"
                                       >
                                          Editar
                                       </Button>
                                    )}
                                    {permisos.eliminar && (
                                       <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleRemoveEmpresa(empresa._id)}
                                          className="h-8 w-8 text-red-600"
                                       >
                                          <Icon name="Trash2" size={14} />
                                       </Button>
                                    )}
                                    {!permisos.editar && !permisos.eliminar && (
                                       <span className="text-xs italic text-muted-foreground">Lectura</span>
                                    )}
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
         </div>
      );
   };

   const mainMarginClass = isMobileScreen ? "ml-0" : isDesktopOpen ? "ml-64" : "ml-16";

   return (
      <div className="min-h-screen bg-background">
         <Header />
         {(isMobileOpen || !isMobileScreen) && (
            <>
               <Sidebar
                  isCollapsed={!isDesktopOpen}
                  onToggleCollapse={toggleSidebar}
                  isMobileOpen={isMobileOpen}
                  onNavigate={handleNavigation}
               />
               {isMobileScreen && isMobileOpen && (
                  <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileOpen(false)}></div>
               )}
            </>
         )}

         <main className={`transition-all duration-300 ${mainMarginClass} pt-20`}>
            <div className="p-6 space-y-6 container-main">
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                  <div>
                     <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestión de Empresas</h1>
                     <p className="text-muted-foreground mt-1 text-sm">
                        Administra la información de las empresas registradas.
                     </p>
                  </div>
                  <div className="flex items-center space-x-3 mt-4 md:mt-0">
                     <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex">
                        <Icon name={isDesktopOpen ? "PanelLeftClose" : "PanelLeftOpen"} />
                     </Button>
                     {editingEmpresa && permisos.crear && (
                        <Button variant="ghost" onClick={clearForm} iconName="Plus">
                           Nueva Empresa
                        </Button>
                     )}
                  </div>
               </div>

               <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                  <div className="flex gap-2 p-4 bg-muted/20 border-b border-border">
                     {(permisos.crear || editingEmpresa) && (
                        <button
                           onClick={() => setActiveTab("register")}
                           className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "register" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                        >
                           <Icon name="Plus" size={16} className="inline mr-2" />
                           {editingEmpresa ? "Modificar Empresa" : "Registrar Empresa"}
                        </button>
                     )}
                     <button
                        onClick={() => setActiveTab("list")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                     >
                        <Icon name="List" size={16} className="inline mr-2" />
                        Lista de Empresas ({empresas.length})
                     </button>
                  </div>
                  <div className="p-6">{getTabContent()}</div>
               </div>
            </div>
         </main>

         {!isMobileOpen && isMobileScreen && (
            <div className="fixed bottom-4 left-4 z-50">
               <Button
                  variant="default"
                  size="icon"
                  onClick={toggleSidebar}
                  iconName="Menu"
                  className="w-12 h-12 rounded-full shadow-lg"
               />
            </div>
         )}
      </div>
   );
};

export default CompanyReg;
