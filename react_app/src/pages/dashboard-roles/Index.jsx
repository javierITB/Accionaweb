import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Shield, Users, Edit2, Trash2, CheckCircle2, Lock, Loader2, Eye } from "lucide-react";

// Helpers y componentes de UI
import { apiFetch, API_BASE_URL } from "../../utils/api";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Button from "../../components/ui/Button";
import Icon from "../../components/AppIcon";
import { RoleModal } from "./components/RoleModal";

const RolesView = ({ userPermissions = {} }) => {
   // --- ESTADOS DE DATOS ---
   const [roles, setRoles] = useState([]);
   const [users, setUsers] = useState([]); // Deberías cargar esto de tu endpoint de usuarios
   const [isLoading, setIsLoading] = useState(true);

   // --- ESTADOS DE ESTRUCTURA ---
   const [isDesktopOpen, setIsDesktopOpen] = useState(true);
   const [isMobileOpen, setIsMobileOpen] = useState(false);
   const [isMobileScreen, setIsMobileScreen] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);

   // --- ESTADOS DE LÓGICA DE ROLES ---
   const [searchQuery, setSearchQuery] = useState("");
   const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
   const [editingRole, setEditingRole] = useState(null);

   const permisos = useMemo(
      () => ({
         view_gestor_roles_details: userPermissions.includes("view_gestor_roles_details"),
         create_gestor_roles: userPermissions.includes("create_gestor_roles"),
         edit_gestor_roles: userPermissions.includes("edit_gestor_roles"),
         edit_gestor_roles_admin: userPermissions.includes("edit_gestor_roles_admin"),
         edit_gestor_roles_by_self: userPermissions.includes("edit_gestor_roles_by_self"),
         delete_gestor_roles: userPermissions.includes("delete_gestor_roles"),
      }),
      [userPermissions],
   );

   // --- CARGA DE DATOS DESDE API ---
   const fetchRoles = async () => {
      try {
         setIsLoading(true);
         const res = await apiFetch(`${API_BASE_URL}/roles`);
         if (res.ok) {
            const data = await res.json();
            setRoles(data);
         }
      } catch (error) {
         console.error("Error cargando roles:", error);
      } finally {
         setIsLoading(false);
      }
   };

   // Efecto inicial
   useEffect(() => {
      fetchRoles();
      // Aquí podrías cargar también los usuarios para el conteo
   }, []);

   // --- RESPONSIVIDAD ---
   useEffect(() => {
      const handleResize = () => {
         const isMobile = window.innerWidth < 768;
         setIsMobileScreen(isMobile);
         if (isMobile) setIsMobileOpen(false);
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
   }, []);

   const toggleSidebar = () => {
      if (isMobileScreen) setIsMobileOpen(!isMobileOpen);
      else setIsDesktopOpen(!isDesktopOpen);
   };

   // --- LÓGICA DE NEGOCIO ---
   const filteredRoles = roles.filter(
      (role) =>
         role.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         role.description?.toLowerCase().includes(searchQuery.toLowerCase()),
   );

   const getUserCount = (roleId) => {
      // Asumiendo que users es un array de objetos con propiedad roleId o similar
      return users.filter((u) => u.roleId === roleId || u.role === roleId).length;
   };

   const handleDelete = async (roleId) => {
      if (roleId === "admin") {
         alert("No se puede eliminar el rol de Administrador de sistema.");
         return;
      }

      if (window.confirm("¿Estás seguro de eliminar este rol? Esta acción no se puede deshacer.")) {
         try {
            const res = await apiFetch(`${API_BASE_URL}/roles/${roleId}`, {
               method: "DELETE",
            });

            if (res.ok) {
               setRoles((prev) => prev.filter((r) => r._id !== roleId));
            } else {
               const err = await res.json();
               alert(err.error || "Error al eliminar el rol");
            }
         } catch (error) {
            alert("Error de conexión con el servidor");
         }
      }
   };

   const getPermissionCount = (role) => {
      if (!role.permissions) return "0 permisos";
      if (role.permissions.includes("all")) return "Acceso Total";
      return `${role.permissions.length} permisos`;
   };

   const mainMarginClass = isMobileScreen ? "ml-0" : isDesktopOpen ? "lg:ml-64" : "lg:ml-16";

   return (
      <div className="min-h-screen bg-background">
         <Header />

         <Sidebar
            isCollapsed={!isDesktopOpen}
            onToggleCollapse={toggleSidebar}
            isMobileOpen={isMobileOpen}
            onNavigate={() => isMobileScreen && setIsMobileOpen(false)}
         />

         {isMobileScreen && isMobileOpen && (
            <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={toggleSidebar}></div>
         )}

         {!isMobileOpen && isMobileScreen && (
            <div className="fixed bottom-4 left-4 z-50">
               <Button
                  variant="default"
                  size="icon"
                  onClick={toggleSidebar}
                  iconName="Menu"
                  className="w-12 h-12 rounded-full shadow-brand-active"
               />
            </div>
         )}

         <main className={`transition-all duration-300 ${mainMarginClass} pt-24 lg:pt-20`}>
            <div className="px-4 sm:px-6 lg:p-6 space-y-6 max-w-7xl mx-auto">
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                     <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                        Roles y Permisos
                     </h1>
                     <p className="text-muted-foreground mt-1 text-sm lg:text-base">
                        Configuración de acceso para las vistas y módulos del sistema.
                     </p>
                  </div>

                  {permisos.create_gestor_roles && (<Button
                     variant="default"
                     iconName="Plus"
                     onClick={() => {
                        setEditingRole(null);
                        setIsRoleModalOpen(true);
                     }}
                  >
                     Crear Nuevo Rol
                  </Button>)}
               </div>

               <div className="relative max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                     type="text"
                     placeholder="Buscar roles..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
               </div>

               {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                     <Loader2 className="w-10 h-10 animate-spin mb-4 text-accent" />
                     <p>Cargando configuración de seguridad...</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                     {filteredRoles.map((role) => {
                        const userCount = getUserCount(role._id);
                        const isAdmin = role.id === "admin" || role.name?.toLowerCase() === "administrador";

                        return (
                           <div
                              key={role._id}
                              className="bg-card rounded-xl border border-border shadow-sm p-6 hover:shadow-md transition-all group relative flex flex-col"
                           >
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                 {(!isAdmin && permisos.view_gestor_roles_details) && (<button
                                    onClick={() => {
                                       setEditingRole(role);
                                       setIsRoleModalOpen(true);
                                    }}
                                    className="p-1.5 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                                 >
                                    <Eye size={21} />
                                 </button>)}

                                 {!isAdmin && permisos.delete_gestor_roles && (
                                    <button
                                       onClick={() => handleDelete(role._id)}
                                       className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    >
                                       <Trash2 size={16} />
                                    </button>
                                 )}
                              </div>

                              <div className="flex items-start justify-between mb-4">
                                 <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                                    style={{ backgroundColor: role.color || "#4f46e5" }}
                                 >
                                    <Shield size={24} />
                                 </div>
                              </div>

                              <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                                 {role.name}
                                 {isAdmin && <Lock size={14} className="text-amber-500" />}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[40px]">
                                 {role.description}
                              </p>

                              <div className="mt-auto space-y-4">
                                 <div className="flex items-center gap-2 text-sm text-foreground bg-muted/50 px-3 py-2 rounded-lg">
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    <span>{getPermissionCount(role)}</span>
                                 </div>

                                 <div className="h-px bg-border" />

                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                       <Users size={16} />
                                       <span className="text-sm">Usuarios asignados</span>
                                    </div>
                                    <span className="text-lg font-bold text-foreground">{userCount}</span>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
         </main>

         {/* Modal de Rol */}
         {isRoleModalOpen && (
            <RoleModal
               isOpen={isRoleModalOpen}
               onClose={() => {
                  setIsRoleModalOpen(false);
                  setEditingRole(null);
               }}
               onSuccess={() => {
                  setIsRoleModalOpen(false);
                  setEditingRole(null);
                  fetchRoles(); // Recargar tras guardar
               }}
               role={editingRole}
               permisos={permisos}
            />
         )}
      </div>
   );
};

export default RolesView;
