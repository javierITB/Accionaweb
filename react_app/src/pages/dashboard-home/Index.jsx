import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import { API_BASE_URL, apiFetch } from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import SummaryCard from './components/SummaryCard';
import Footer from '../../clientPages/components/ui/Footer';

const DashboardHome = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Paleta para gráfico de torta
  // Mapeo de colores específico por estado (Hex codes para Recharts)
  const STATUS_COLORS = {
    'pendiente': '#EF4444',     // Red-500 (Error)
    'en_revision': '#F97316',   // Orange-500 (Secondary approx)
    'en_revisión': '#F97316',   // Fallback
    'aprobado': '#EAB308',      // Yellow-500 (Warning)
    'firmado': '#10B981',       // Emerald-500 (Success)
    'finalizado': '#06B6D4',    // Cyan-500 (Accent approx)
    'archivado': '#6B7280',     // Gray-500 (Muted)
    'borrador': '#9CA3AF'       // Gray-400
  };

  const getStatusColor = (status) => STATUS_COLORS[status?.toLowerCase()] || '#8B5CF6'; // Default Purple

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileScreen(window.innerWidth < 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/dashboard/metrics`);
        const data = await res.json();
        if (data.success) {
          setMetrics(data.data);
        }
      } catch (err) {
        console.error("Error fetching metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const performanceData = metrics?.weeklyPerformance || [];
  const statusData = metrics?.statusDistribution || [];

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-900 dark:text-white">Cargando métricas...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans selection:bg-blue-500 selection:text-white">
      <Header />
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={isMobileOpen}
        onNavigate={() => setIsMobileOpen(false)}
      />

      <main className={`transition-all duration-300 ${isMobileScreen ? 'lg:ml-0' : sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        } pt-24 lg:pt-28 p-6`}>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Panel de Métricas</h1>
          <p className="text-gray-500 dark:text-gray-400">Visión general del rendimiento y estado de solicitudes.</p>
        </div>

        {/* 1. KPIs Principales (Fila Superior) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            title="Total Solicitudes"
            count={metrics?.totalRequests || 0}
            trend={statusData.length > 0 ? "Activo" : "Sin Datos"}
            label="Histórico completo"
            icon="FileText"
            color="bg-blue-600"
          />
          <SummaryCard
            title="Total Usuarios"
            count={metrics?.totalUsers || 0}
            label="Registrados"
            icon="Users"
            color="bg-purple-600"
          />
          <SummaryCard
            title="Tasa de Éxito"
            count={`${metrics?.globalRate || 0}%`}
            label="Solicitudes finalizadas"
            icon="CheckCircle"
            color="bg-emerald-600"
          />
          <SummaryCard
            title="Esta Semana"
            count={metrics?.weeklyRequests || 0}
            label="Nuevas solicitudes"
            icon="TrendingUp"
            color="bg-orange-500"
          />
        </div>

        {/* 2. Sección Gráficos y Tiempos */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Columna Izquierda: Tiempos y Rendimiento (Ocupa 2/3) */}
          <div className="xl:col-span-2 space-y-8">

            {/* Tiempos de Respuesta */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400"><Icon name="Clock" size={24} /></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tiempos de Ciclo (Promedios)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TimeMetricItem label="Creación → Revisión" days={metrics?.timeMetrics?.creationToReview} color="bg-blue-500" />
                <TimeMetricItem label="Creación → Aprobado" days={metrics?.timeMetrics?.creationToApproved} color="bg-purple-500" />
                <TimeMetricItem label="Firmado → Finalizado" days={metrics?.timeMetrics?.signedToFinalized} color="bg-emerald-500" />
              </div>
            </div>

            {/* Gráfico de Barras */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg transition-colors">
              <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Solicitudes por Día (Semana Actual)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" stroke="#9CA3AF" axisLine={false} tickLine={false} />
                    <YAxis stroke="#9CA3AF" axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: '#374151', opacity: 0.1 }}
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                    />
                    <Bar dataKey="solicitudes" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Distribución (Ocupa 1/3) */}
          <div className="space-y-8">
            {/* Gráfico de Torta - Estados */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg h-full transition-colors">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Distribución por Estado</h3>
              <div className="h-64 w-full flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-3">
                {statusData.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor(entry.name) }}></div>
                      <span className="text-gray-600 dark:text-gray-300 capitalize">
                        {entry.name.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{entry.value}</span>
                  </div>
                ))}
                {statusData.length === 0 && <p className="text-gray-500 text-center text-sm">No hay datos suficientes</p>}
              </div>
            </div>
          </div>

        </div >
      </main >
    </div >
  );
};

const TimeMetricItem = ({ label, days, color }) => (
  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700/50 transition-colors">
    <div className="flex justify-between items-center mb-2">
      <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">{label}</span>
      <Icon name="Clock" size={14} className="text-gray-400 dark:text-gray-500" />
    </div>
    <div className="flex items-end gap-1 mb-3">
      <span className="text-3xl font-bold text-gray-900 dark:text-white">{days !== null ? days : '-'}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">días</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(((days || 0) / 30) * 100, 100)}%` }}></div>
    </div>
  </div>
);

export default DashboardHome;