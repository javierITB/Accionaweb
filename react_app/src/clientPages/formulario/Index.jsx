import React, { useState, useEffect } from 'react';
import Header from '../components/ui/Header';
import QuickActionsCard from './components/QuickActionsCard';
import { API_BASE_URL, apiFetch} from '../../utils/api';
import Footer from 'clientPages/components/ui/footer';

const DashboardHome = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    category: '',
    responseTime: '',
    author: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#F3F4F6',
    questions: [],
    status: 'borrador',
    section: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams?.get('id');

    const fetchForm = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/forms/${formId}`);
        if (!res.ok) throw new Error('Formulario no encontrado');
        const data = await res.json();

        // Normalización corregida - incluyendo section
        const normalizedForm = {
          id: data._id || data.id || null,
          title: data.title || '',
          category: data.category || '',
          responseTime: data.responseTime || '',
          author: data.author || 'Invitado',
          primaryColor: data.primaryColor || '#3B82F6',
          secondaryColor: data.secondaryColor || '#F3F4F6',
          questions: data.questions || [],
          status: data.status || 'borrador',
          section: data.section || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        };

        setFormData(normalizedForm);
      } catch (err) {
        console.error('Error cargando el formulario:', err);
        alert('No se pudo cargar el formulario');
      }
    };

    if (formId) {
      fetchForm();
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className={`transition-all duration-300 pt-16 lg:pt-20`}>
        <div className="px-4 sm:px-6 lg:p-6 space-y-4 lg:space-y-6 max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between">

          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 gap-4 lg:gap-6 w-full">
            {/* Left Column - Primary Actions */}
            <div className="xl:col-span-2 space-y-6 lg:space-y-12 w-full">
              {/* Quick Actions - Este componente renderizará el formulario */}
              <QuickActionsCard formData={formData} />
            </div>
          </div>

          <Footer />
        </div>
      </main>
    </div>
  );
};

export default DashboardHome;