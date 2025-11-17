import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import NotFound from "./pages/NotFound";
import FormCenter from './pages/form-center/Index.jsx';
import FormBuilder from './pages/form-builder/Index.jsx';
import TemplateBuilder from './pages/template-builder/Index.jsx';
import Login from './pages/login/Index.jsx';
import SupportPortal from './pages/support-portal/Index.jsx';
import DashboardHome from './pages/dashboard-home/Index.jsx';
import RequestTracking from './pages/request-tracking/Index.jsx';
import RespuestasForms from './pages/Respuestas/Index.jsx';
import Users from './pages/users/Index.jsx';
import Empresas from './pages/empresas/Index.jsx';
import Ingresos from './pages/Ingresos/Index.jsx';
import SetPassword from './pages/users/components/SetPassword.jsx'; 

import Home from './clientPages/home/Index.jsx';
import FormList from './clientPages/FormList/Index.jsx';
import Form from './clientPages/formulario/Index.jsx';
import Profile from './clientPages/profile/Index.jsx';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          <Route path="/login" element = {<Login />}/>
          <Route path="/" element = {<Home />}/>
          <Route path="/Remuneraciones" element = {<FormList section={"Remuneraciones"}/>}/>
          <Route path="/Finiquitos" element = {<FormList section={"Finiquitos"} />}/>
          <Route path="/Anexos" element = {<FormList section={"Anexos"} />}/>
          <Route path="/Otras" element = {<FormList section={"Otras"} />}/>
          
          
          <Route path="/forms" element={<Form />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/profile" element = {<Profile />}/>
          <Route path="/support-portal" element={ <SupportPortal />}/>

          {/* Rutas protegidas */}
          <Route path="/form-builder" element={<ProtectedRoute><FormBuilder /></ProtectedRoute>}/>
          <Route path="/template-builder" element={<ProtectedRoute><TemplateBuilder /></ProtectedRoute>}/>
          <Route path="/form-center" element={<ProtectedRoute><FormCenter /></ProtectedRoute>}/>
          <Route path="/RespuestasForms" element={<ProtectedRoute><RespuestasForms /></ProtectedRoute>}/>
          <Route path="/registro-ingresos" element={<ProtectedRoute><Ingresos /></ProtectedRoute>}/>
          
          <Route path="/users" element={<ProtectedRoute> <Users /> </ProtectedRoute>}/>
          <Route path="/empresas" element={<ProtectedRoute> <Empresas /> </ProtectedRoute>}/>
          <Route path="/dashboard-home" element={<ProtectedRoute> <DashboardHome /> </ProtectedRoute>}/>
          <Route path="/request-tracking" element={<ProtectedRoute> <RequestTracking /> </ProtectedRoute>}/>
          

          {/* Rutas libres */}
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;