import React, { Suspense } from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop.jsx";
import LoadingCard from "clientPages/components/LoadingCard.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ProtectedClient from "./clientPages/components/ProtectedClient.jsx";
import { PermissionsProvider } from "./context/PermissionsContext.jsx";

// import NotFound from "./pages/NotFound";
// import FormCenter from './pages/form-center/Index.jsx';
// import TicketConfig from './pages/ticket-config/Index.jsx';
// import TicketBuilder from './pages/ticket-builder/Index.jsx';
// import FormBuilder from './pages/form-builder/Index.jsx';
// import TemplateBuilder from './pages/template-builder/Index.jsx';
// import Login from './pages/login/Index.jsx';
// import PanelEntry from './components/PanelEntry.jsx';
// import Recuperacion from './pages/login/Recuperacion.jsx';
// import SupportPortal from './pages/support-portal/Index.jsx';
// import DashboardHome from './pages/dashboard-home/Index.jsx';
// import RequestTracking from './pages/request-tracking/Index.jsx';
// import RespuestasForms from './pages/Respuestas/Index.jsx';
// import AdminTickets from './pages/Tickets/Index.jsx';
// import Users from './pages/users/Index.jsx';
// import Empresas from './pages/empresas/Index.jsx';
// import Ingresos from './pages/Ingresos/Index.jsx';
// import Roles from './pages/dashboard-roles/Index.jsx';
// import EmpresasDashboard from './pages/dashboard-empresas/Index.jsx';
// import Registro from './pages/registro/Index.jsx';
// import SetPassword from './pages/users/components/SetPassword.jsx';
// import Solicitudes from './pages/solicitudes/Index.jsx';
// import DomicilioVirtualIndex from './pages/DomicilioVirtual/Index.jsx';
// import AdminNotificationManager from './pages/config-notificaciones/Index.jsx';
// import Anuncios from './pages/anuncios/Index.jsx';
// import PagosIndex from './pages/pagos/Index.jsx';
// import RegistroEmpresas from "pages/registroEmpresas/registroEmpresas.jsx";

// import Home from './clientPages/home/Index.jsx';
// import FormList from './clientPages/FormList/Index.jsx';
// import Form from './clientPages/formulario/Index.jsx';
// import Profile from './clientPages/profile/Index.jsx';
// import PublicPreview from './pages/public/PublicPreview.jsx';

// import ComprobantesIndex from "./pages/comprobantes/Index";
// import UploadComprobante from "./pages/comprobantes/Upload";

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

// Client pages
const Home = React.lazy(() => import("./clientPages/home/Index.jsx"));
const FormList = React.lazy(() => import("./clientPages/FormList/Index.jsx"));
const Form = React.lazy(() => import("./clientPages/formulario/Index.jsx"));
const Profile = React.lazy(() => import("./clientPages/profile/Index.jsx"));
const PublicPreview = React.lazy(() => import("./pages/public/PublicPreview.jsx"));

const ComprobantesIndex = React.lazy(() => import("./pages/comprobantes/Index"));
const UploadComprobante = React.lazy(() => import("./pages/comprobantes/Upload"));

// 👇 helper reutilizable
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
                        <ProtectedClient>
                           <LazyPage text="Cargando inicio">
                              <Home />
                           </LazyPage>
                        </ProtectedClient>
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

                  <Route
                     path="/Remuneraciones"
                     element={
                        <ProtectedClient>
                           <LazyPage>
                              <FormList section="Remuneraciones" />
                           </LazyPage>
                        </ProtectedClient>
                     }
                  />
                  <Route
                     path="/Finiquitos"
                     element={
                        <ProtectedClient>
                           <LazyPage>
                              <FormList section="Finiquitos" />
                           </LazyPage>
                        </ProtectedClient>
                     }
                  />
                  <Route
                     path="/Anexos"
                     element={
                        <ProtectedClient>
                           <LazyPage>
                              <FormList section="Anexos" />
                           </LazyPage>
                        </ProtectedClient>
                     }
                  />
                  <Route
                     path="/Otras"
                     element={
                        <ProtectedClient>
                           <LazyPage>
                              <FormList section="Otras" />
                           </LazyPage>
                        </ProtectedClient>
                     }
                  />

                  <Route
                     path="/forms"
                     element={
                        <ProtectedClient>
                           <LazyPage>
                              <Form />
                           </LazyPage>
                        </ProtectedClient>
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
                        <ProtectedClient>
                           <LazyPage>
                              <Profile />
                           </LazyPage>
                        </ProtectedClient>
                     }
                  />
                  <Route
                     path="/soporte"
                     element={
                        <ProtectedClient>
                           <LazyPage>
                              <SupportPortal />
                           </LazyPage>
                        </ProtectedClient>
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
                        <ProtectedRoute>
                           <LazyPage>
                              <PanelEntry />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/form-builder"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <FormBuilder />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/template-builder"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <TemplateBuilder />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/form-center"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <FormCenter />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/DomicilioVirtual"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <DomicilioVirtualIndex />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/RespuestasForms"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <RespuestasForms />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/Tickets"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <AdminTickets />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/registro-ingresos"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <Ingresos />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/registro-cambios"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <Registro />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/gestor-roles"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <Roles />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/gestor-empresas"
                     element={
                        <ProtectedRoute permission="view_gestor_empresas">
                           <LazyPage>
                              <EmpresasDashboard />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/config-notificaciones"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <AdminNotificationManager />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/config-planes"
                     element={
                        <ProtectedRoute permission="view_gestor_empresas">
                           <LazyPage>
                              <EmpresasDashboard />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/registro-empresas"
                     element={
                        <ProtectedRoute permission="view_acceso_registro_empresas">
                           <LazyPage>
                              <RegistroEmpresas />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />

                  <Route
                     path="/users"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <Users />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />

                  <Route
                     path="/comprobantes"
                     element={
                        <ProtectedRoute permission="view_comprobantes">
                           <LazyPage>
                              <ComprobantesIndex />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />

                  <Route
                     path="/comprobantes/subir"
                     element={
                        <ProtectedRoute permission="view_comprobantes">
                           <LazyPage>
                              <UploadComprobante />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />

                  <Route
                     path="/empresas"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <Empresas />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/dashboard-home"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <DashboardHome />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/request-tracking"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <RequestTracking />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/solicitudes"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <Solicitudes />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/anuncios"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <Anuncios />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/pagos"
                     element={
                        <ProtectedRoute permission="view_pagos">
                           <LazyPage>
                              <PagosIndex />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/ticket-builder"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <TicketBuilder />
                           </LazyPage>
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/config-tickets"
                     element={
                        <ProtectedRoute>
                           <LazyPage>
                              <TicketConfig />
                           </LazyPage>
                        </ProtectedRoute>
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
