import React, { useState, useEffect, useMemo } from "react";
import { apiFetch, API_BASE_URL } from "../../utils/api";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import RegisterForm from "./components/RegisterForm";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";

const FormReg = ({ userPermissions = [] }) => {
   // --- LÓGICA DE PERMISOS BASADA EN PROPS ---
   const permisos = useMemo(
      () => ({
         editar: userPermissions.includes("edit_usuarios"),
         eliminar: userPermissions.includes("delete_usuarios"),
         crear: userPermissions.includes("create_usuarios"),
      }),
      [userPermissions],
   );

   const [users, setUsers] = useState([]);
   const [isLoading, setIsLoading] = useState(false);
   const [empresas, setEmpresas] = useState([]);
   const [loadingEmpresas, setLoadingEmpresas] = useState(true);
   const [fetchedRoles, setFetchedRoles] = useState([]);
   const [formData, setFormData] = useState({
      nombre: "",
      apellido: "",
      mail: "",
      empresa: "",
      cargo: "",
      rol: "user",
   });

   // Mantenemos 'register' como inicial si tiene permiso, sino 'list'
   const [activeTab, setActiveTab] = useState(permisos.crear ? "register" : "list");

   const [filters, setFilters] = useState({ field: null, value: null });
   const [searchTerm, setSearchTerm] = useState("");
   const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

   const [isDesktopOpen, setIsDesktopOpen] = useState(true);
   const [isMobileOpen, setIsMobileOpen] = useState(false);
   const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

   const [editingUser, setEditingUser] = useState(null);

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
      if (isMobileScreen) {
         setIsMobileOpen(!isMobileOpen);
      } else {
         setIsDesktopOpen(!isDesktopOpen);
      }
   };

   const handleNavigation = () => {
      if (isMobileScreen) setIsMobileOpen(false);
   };

   useEffect(() => {
      const fetchEmpresas = async () => {
         try {
            setLoadingEmpresas(true);
            const response = await apiFetch(`${API_BASE_URL}/auth/empresas/todas`);
            if (!response.ok) throw new Error("Error al cargar empresas");
            const empresasData = await response.json();
            setEmpresas(empresasData.map((e) => ({ value: e.nombre, label: e.nombre })));
         } catch (error) {
            console.error("Error cargando empresas:", error);
         } finally {
            setLoadingEmpresas(false);
         }
      };

      const fetchRoles = async () => {
         try {
            const response = await apiFetch(`${API_BASE_URL}/roles`);
            if (!response.ok) throw new Error("Error al cargar roles");
            const rolesData = await response.json();
            setFetchedRoles(rolesData.map((r) => ({ value: r.name, label: r.name })));
         } catch (error) {
            console.error("Error cargando roles:", error);
         }
      };

      fetchEmpresas();
      fetchRoles();
      fetchUsers();
   }, []);

   const fetchUsers = async () => {
      try {
         const res = await apiFetch(`${API_BASE_URL}/auth/`);
         if (!res.ok) throw new Error("Usuarios no encontrados");
         const data = await res.json();
         setUsers(data);
      } catch (err) {
         console.error("Error cargando los usuarios:", err);
      }
   };

   const handleSave = async () => {
      const isUpdating = !!editingUser;

      // Validación de seguridad interna
      if (isUpdating && !permisos.editar) return;
      if (!isUpdating && !permisos.crear) return;

      if (
         !formData.nombre ||
         !formData.apellido ||
         !formData.mail ||
         !formData.empresa ||
         !formData.cargo ||
         !formData.rol
      ) {
         alert("Por favor completa todos los campos obligatorios");
         return;
      }

      const method = isUpdating ? "PUT" : "POST";
      const url = isUpdating ? `${API_BASE_URL}/auth/users/${editingUser._id}` : `${API_BASE_URL}/auth/register`;

      try {
         setIsLoading(true);

         const response = await apiFetch(url, {
            method: method,
            body: JSON.stringify(
               isUpdating ? { ...formData, estado: formData.estado } : { ...formData, pass: "", estado: "pendiente" },
            ),
         });

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Error en la operación");
         }

         // REINTEGRACIÓN DE ALERTAS ORIGINALES
         alert(
            isUpdating
               ? "Usuario actualizado exitosamente."
               : "Usuario registrado. Se ha enviado un correo de activación.",
         );

         clearForm();
         await fetchUsers();
         // Retorno automático a la lista
         setActiveTab("list");
      } catch (error) {
         alert(error.message);
      } finally {
         setIsLoading(false);
      }
   };

   const handleEditUser = (user) => {
      if (!permisos.editar) return;
      setEditingUser(user);
      setFormData({
         nombre: user.nombre || "",
         apellido: user.apellido || "",
         mail: user.mail || "",
         empresa: user.empresa || "",
         cargo: user.rol || "",
         rol: user.rol || "user",
         estado: user.estado || "pendiente",
      });
      setActiveTab("register");
   };

   const clearForm = () => {
      setFormData({ nombre: "", apellido: "", mail: "", empresa: "", cargo: "", rol: "user" });
      setEditingUser(null);
   };

   const handleRemoveUser = async (userId) => {
      if (!permisos.eliminar) return;

      if (!window.confirm("¿Estás seguro?")) return;
      try {
         setIsLoading(true);
         const response = await apiFetch(`${API_BASE_URL}/auth/users/${userId}`, { method: "DELETE" });
         if (response.ok) fetchUsers();
      } catch (error) {
         alert(error.message);
      } finally {
         setIsLoading(false);
      }
   };

   const handleFilter = (field, value) => {
      setFilters(filters.field === field && filters.value === value ? { field: null, value: null } : { field, value });
   };

   const handleSort = (key) => {
      setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc" });
   };

   const getSortIcon = (key) => {
      if (sortConfig.key !== key) return <Icon name="ChevronsUpDown" size={14} className="ml-1 opacity-30" />;
      return sortConfig.direction === "asc" ? (
         <Icon name="ChevronUp" size={14} className="ml-1 text-primary" />
      ) : (
         <Icon name="ChevronDown" size={14} className="ml-1 text-primary" />
      );
   };

   const sortedUsers = useMemo(() => {
      let processData = [...users];
      if (filters.field && filters.value) {
         processData = processData.filter(
            (u) => String(u[filters.field]).toLowerCase() === String(filters.value).toLowerCase(),
         );
      }
      if (searchTerm.trim() !== "") {
         const term = searchTerm.toLowerCase();
         processData = processData.filter(
            (u) =>
               Object.values(u).some((v) => String(v).toLowerCase().includes(term)) ||
               `${u.nombre} ${u.apellido}`.toLowerCase().includes(term),
         );
      }
      if (sortConfig.key) {
         processData.sort((a, b) => {
            let vA = sortConfig.key === "nombre" ? `${a.nombre} ${a.apellido}` : a[sortConfig.key];
            let vB = sortConfig.key === "nombre" ? `${b.nombre} ${b.apellido}` : b[sortConfig.key];
            vA = String(vA || "").toLowerCase();
            vB = String(vB || "").toLowerCase();
            return sortConfig.direction === "asc" ? vA.localeCompare(vB) : vB.localeCompare(vA);
         });
      }
      return processData;
   }, [users, filters, sortConfig, searchTerm]);

   const getTabContent = () => {
      if (activeTab === "register") {
         return (
            <RegisterForm
               formData={formData}
               empresas={empresas}
               cargos={fetchedRoles}
               onUpdateFormData={(f, v) => setFormData((p) => ({ ...p, [f]: v }))}
               onRegister={handleSave}
               isLoading={isLoading}
               isEditing={!!editingUser}
               onCancelEdit={clearForm}
               permisos={permisos}
            />
         );
      }

      return (
         <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
               <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-foreground">Usuarios registrados</h2>
                  {filters.field && (
                     <button
                        onClick={() => setFilters({ field: null, value: null })}
                        className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full"
                     >
                        Filtro: {filters.field} ✕
                     </button>
                  )}
               </div>
               <div className="relative w-full md:w-80">
                  <Icon
                     name="Search"
                     size={16}
                     className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500"
                  />
                  <input
                     type="text"
                     placeholder="Búsqueda rápida..."
                     className="w-full pl-10 pr-10 py-2.5 bg-card text-foreground border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                     <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground transition-colors"
                     >
                        <Icon name="X" size={14} />
                     </button>
                  )}
               </div>
            </div>
            <div className="overflow-x-auto border border-border rounded-xl">
               <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                     <tr>
                        {["nombre", "empresa", "mail", "cargo", "rol", "estado", "createdAt"].map((k) => (
                           <th
                              key={k}
                              className="px-4 py-3 text-left cursor-pointer hover:bg-muted"
                              onClick={() => handleSort(k)}
                           >
                              <div className="flex items-center">
                                 {k.replace("createdAt", "Fecha")} {getSortIcon(k)}
                              </div>
                           </th>
                        ))}
                        {(permisos.editar || permisos.eliminar) && <th className="px-4 py-3 text-left">Acciones</th>}
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                     {sortedUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-muted/20 transition">
                           {/* ELIMINADAS CLASES whitespace-nowrap PARA RECUPERAR EL ESPACIO ORIGINAL */}
                           <td
                              className="px-4 py-3 font-medium cursor-pointer hover:text-primary"
                              onClick={() => handleFilter("nombre", u.nombre)}
                           >
                              {u.nombre} {u.apellido}
                           </td>
                           <td
                              className="px-4 py-3 cursor-pointer hover:text-primary"
                              onClick={() => handleFilter("empresa", u.empresa)}
                           >
                              {u.empresa || "—"}
                           </td>
                           <td className="px-4 py-3 text-muted-foreground">{u.mail}</td>
                           <td
                              className="px-4 py-3 cursor-pointer hover:text-primary"
                              onClick={() => handleFilter("cargo", u.cargo)}
                           >
                              {u.cargo || "—"}
                           </td>
                           <td className="px-4 py-3">{u.rol}</td>
                           <td className="px-4 py-3">
                              <span
                                 className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${u.estado === "pendiente" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}
                              >
                                 {u.estado}
                              </span>
                           </td>
                           <td className="px-4 py-3 text-muted-foreground text-xs">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                           </td>

                           {/* Columna Acciones dinâmica */}
                           {(permisos.editar || permisos.eliminar) && (
                              <td className="px-4 py-3">
                                 <div className="flex gap-3">
                                    {permisos.editar && (
                                       <button
                                          onClick={() => {
                                             handleEditUser(u);
                                             setActiveTab("register");
                                          }}
                                          className="text-primary hover:underline"
                                       >
                                          Editar
                                       </button>
                                    )}
                                    {permisos.eliminar && (
                                       <button
                                          onClick={() => handleRemoveUser(u._id)}
                                          className="text-destructive hover:underline"
                                       >
                                          Borrar
                                       </button>
                                    )}
                                 </div>
                              </td>
                           )}
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      );
   };

   const mainMarginClass = isMobileScreen ? "ml-0" : isDesktopOpen ? "ml-64" : "ml-16";

   return (
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
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
               <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
               </div>
               <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex gap-2 p-4 bg-muted/20 border-b border-border">
                     {/* Pestaña dinámica */}
                     {permisos.crear || editingUser ? (
                        <button
                           onClick={() => setActiveTab("register")}
                           className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                        >
                           <Icon name="Plus" size={16} className="inline mr-2" />{" "}
                           {editingUser ? "Modificar" : "Registrar"}
                        </button>
                     ) : (
                        <div className="px-5 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground bg-muted/50 border border-dashed border-border flex items-center opacity-60">
                           <Icon name="Lock" size={14} className="mr-2" /> Acceso Restringido
                        </div>
                     )}

                     <button
                        onClick={() => setActiveTab("list")}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                     >
                        <Icon name="List" size={16} className="inline mr-2" /> Lista ({users.length})
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

export default FormReg;
