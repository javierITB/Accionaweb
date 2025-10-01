import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import NotFound from "./pages/NotFound";
import FormCenter from './pages/form-center/Index.jsx';
import Login from './pages/login/Index.jsx';
import SupportPortal from './pages/support-portal/Index.jsx';
import DashboardHome from './pages/dashboard-home/Index.jsx';
import RequestTracking from './pages/request-tracking/Index.jsx';
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from './clientPages/home/Index.jsx';
import Remuneraciones from './clientPages/remuneraciones/Index.jsx';
import Finiquitos from './clientPages/Finiquitos/Index.jsx';
import FormBuilder from './pages/form-builder/Index.jsx';
import FormRenderer from './pages/form-renderer/Index.jsx';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          <Route path="/login" element = {<Login />}/>
          <Route path="/" element = {<Home />}/>
          <Route path="/Remuneraciones" element = {<Remuneraciones />}/>
          <Route path="/finiquitos" element = {<Finiquitos />}/>
          <Route path="/form-builder" element={<FormBuilder />} />
          <Route path="/form-renderer" element={<FormRenderer />} />
          {/* Rutas protegidas */}
          
          <Route path="/form-center"
            element={
              <ProtectedRoute>
                <FormCenter />
              </ProtectedRoute>
            }
          />
          <Route path="/support-portal"
            element={
              <ProtectedRoute>
                <SupportPortal />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard-home"
            element={
              <ProtectedRoute>
                <DashboardHome />
              </ProtectedRoute>
            }
          />
          <Route path="/request-tracking"
            element={
              <ProtectedRoute>
                <RequestTracking />
              </ProtectedRoute>
            }
          />

          {/* Rutas libres */}
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
