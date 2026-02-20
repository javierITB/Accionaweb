import React, { Suspense } from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop.jsx";
import LoadingCard from "./clientPages/components/LoadingCard.jsx";
import ErrorBoundary from "./components/ErrorBoundary";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ProtectedClient from "./clientPages/components/ProtectedClient.jsx";
import { PermissionsProvider } from "./context/PermissionsContext.jsx";

const NotFound = React.lazy(() => import("./pages/NotFound"));
const FormCenter = React.lazy(() => import("./pages/form-center/Index.jsx"));
const TicketConfig = React.lazy(() => import("./pages/ticket-config/Index.jsx"));
const TicketBuilder = React.lazy(() => import("./pages/ticket-builder/Index.jsx"));
const FormBuilder = React.lazy(() => import("./pages/form-builder/Index.jsx"));
const TemplateBuilder = React.lazy(() => import("./pages/template-builder/Index.jsx"));
const Login = React.lazy(() => import("./pages/login/Index.jsx"));
const PanelEntry = React.lazy(() => import("./components/PanelEntry.jsx"));
const Recuperacion = React.lazy(() => import("./pages/login/Recuperacion.jsx"));
const SupportPortal = React.lazy(() => import("./pages/support-portal/Index.jsx"));
const DashboardHome = React.lazy(() => import("./pages/dashboard-home/Index.jsx"));
const RequestTracking = React.lazy(() => import("./pages/request-tracking/Index.jsx"));
const RespuestasForms = React.lazy(() => import("./pages/Respuestas/Index.jsx"));
const AdminTickets = React.lazy(() => import("./pages/Tickets/Index.jsx"));
const Users = React.lazy(() => import("./pages/users/Index.jsx"));
const Empresas = React.lazy(() => import("./pages/empresas/Index.jsx"));
const Ingresos = React.lazy(() => import("./pages/Ingresos/Index.jsx"));
const Roles = React.lazy(() => import("./pages/dashboard-roles/Index.jsx"));
const EmpresasDashboard = React.lazy(() => import("./pages/dashboard-empresas/Index.jsx"));
const Registro = React.lazy(() => import("./pages/registro/Index.jsx"));
const SetPassword = React.lazy(() => import("./pages/users/components/SetPassword.jsx"));
const Solicitudes = React.lazy(() => import("./pages/solicitudes/Index.jsx"));
const DomicilioVirtualIndex = React.lazy(() => import("./pages/DomicilioVirtual/Index.jsx"));
const AdminNotificationManager = React.lazy(() => import("./pages/config-notificaciones/Index.jsx"));
const Anuncios = React.lazy(() => import("./pages/anuncios/Index.jsx"));
const PagosIndex = React.lazy(() => import("./pages/pagos/Index.jsx"));
const RegistroEmpresas = React.lazy(() => import("pages/registroEmpresas/registroEmpresas.jsx"));

// Client
const Home = React.lazy(() => import("./clientPages/home/Index.jsx"));
const FormList = React.lazy(() => import("./clientPages/FormList/Index.jsx"));
const Form = React.lazy(() => import("./clientPages/formulario/Index.jsx"));
const Profile = React.lazy(() => import("./clientPages/profile/Index.jsx"));
const PublicPreview = React.lazy(() => import("./pages/public/PublicPreview.jsx"));

const ComprobantesIndex = React.lazy(() => import("./pages/comprobantes/Index"));
const UploadComprobante = React.lazy(() => import("./pages/comprobantes/Upload"));

// helper reutilizable
const LazyPage = ({ children, text }) => (
   <Suspense fallback={<LoadingCard text={text || "Cargando"} />}>{children}</Suspense>
);

const Routes = () => {
   return (
      <BrowserRouter>
         <ErrorBoundary>
            <ScrollToTop />
            <PermissionsProvider>
               <RouterRoutes>
                  <Route
                     path="/login"
                     element={
                        <LazyPage>
                           <Login />
                        </LazyPage>
                     }
                  />

                  <Route
                     path="/"
                     element={
                        <LazyPage text="Cargando inicio">
                           <Home />
                        </LazyPage>
                     }
                  />

                  <Route
                     path="/preview"
                     element={
                        <LazyPage>
                           <PublicPreview />
                        </LazyPage>
                     }
                  />

                  {/* Rutas Clientes - ProtectedClient */}

                  <Route
                     path="/Remuneraciones"
                     element={
                        <LazyPage>
                           <ProtectedClient>
                              <FormList section="Remuneraciones" />
                           </ProtectedClient>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/Finiquitos"
                     element={
                        <LazyPage>
                           <ProtectedClient>
                              <FormList section="Finiquitos" />
                           </ProtectedClient>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/Anexos"
                     element={
                        <LazyPage>
                           <ProtectedClient>
                              <FormList section="Anexos" />
                           </ProtectedClient>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/Otras"
                     element={
                        <LazyPage>
                           <ProtectedClient>
                              <FormList section="Otras" />
                           </ProtectedClient>
                        </LazyPage>
                     }
                  />

                  <Route
                     path="/forms"
                     element={
                        <LazyPage>
                           <ProtectedClient>
                              <Form />
                           </ProtectedClient>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/set-password"
                     element={
                        <LazyPage>
                           <SetPassword />
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/perfil"
                     element={
                        <LazyPage>
                           <ProtectedClient>
                              <Profile />
                           </ProtectedClient>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/soporte"
                     element={
                        <LazyPage>
                           <ProtectedClient>
                              <SupportPortal />
                           </ProtectedClient>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/recuperacion"
                     element={
                        <LazyPage>
                           <Recuperacion />
                        </LazyPage>
                     }
                  />

                  {/* ADMIN */}

                  <Route
                     path="/panel"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <PanelEntry />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/form-builder"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <FormBuilder />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/template-builder"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <TemplateBuilder />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/form-center"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <FormCenter />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/DomicilioVirtual"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <DomicilioVirtualIndex />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/RespuestasForms"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <RespuestasForms />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/Tickets"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <AdminTickets />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/registro-ingresos"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <Ingresos />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/registro-cambios"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <Registro />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/gestor-roles"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <Roles />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/gestor-empresas"
                     element={
                        <LazyPage>
                           <ProtectedRoute permission="view_gestor_empresas">
                              <EmpresasDashboard />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/config-notificaciones"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <AdminNotificationManager />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/config-planes"
                     element={
                        <LazyPage>
                           <ProtectedRoute permission="view_gestor_empresas">
                              <EmpresasDashboard />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/registro-empresas"
                     element={
                        <LazyPage>
                           <ProtectedRoute permission="view_acceso_registro_empresas">
                              <RegistroEmpresas />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />

                  <Route
                     path="/users"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <Users />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />

                  <Route
                     path="/comprobantes"
                     element={
                        <LazyPage>
                           <ProtectedRoute permission="view_comprobantes">
                              <ComprobantesIndex />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />

                  <Route
                     path="/comprobantes/subir"
                     element={
                        <LazyPage>
                           <ProtectedRoute permission="view_comprobantes">
                              <UploadComprobante />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />

                  <Route
                     path="/empresas"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <Empresas />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/dashboard-home"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <DashboardHome />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/request-tracking"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <RequestTracking />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/solicitudes"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <Solicitudes />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/anuncios"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <Anuncios />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/pagos"
                     element={
                        <LazyPage>
                           <ProtectedRoute permission="view_pagos">
                              <PagosIndex />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/ticket-builder"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <TicketBuilder />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />
                  <Route
                     path="/config-tickets"
                     element={
                        <LazyPage>
                           <ProtectedRoute>
                              <TicketConfig />
                           </ProtectedRoute>
                        </LazyPage>
                     }
                  />

                  <Route
                     path="*"
                     element={
                        <LazyPage>
                           <NotFound />
                        </LazyPage>
                     }
                  />
               </RouterRoutes>
            </PermissionsProvider>
         </ErrorBoundary>
      </BrowserRouter>
   );
};

export default Routes;