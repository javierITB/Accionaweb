import React, { useState, useEffect } from "react";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import { API_BASE_URL, apiFetch } from "../../utils/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import SummaryCard from "./components/SummaryCard";

const DashboardHome = () => {
   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
   const [isMobileOpen, setIsMobileOpen] = useState(false);
   const [isMobileScreen, setIsMobileScreen] = useState(false);
   const [metrics, setMetrics] = useState(null);
   const [loading, setLoading] = useState(true);
   const [isGlobalTime, setIsGlobalTime] = useState(false); // Default: Esta Semana
   const [timeUnit, setTimeUnit] = useState("dias");

   // Paleta para gráfico de torta
   // Mapeo de colores específico por estado (Hex codes para Recharts)
   const STATUS_COLORS = {
      pendiente: "#EF4444", // Red-500 (Error)
      en_revision: "#F97316", // Orange-500 (Secondary approx)
      en_revisión: "#F97316", // Fallback
      aprobado: "#EAB308", // Yellow-500 (Warning)
      firmado: "#10B981", // Emerald-500 (Success)
      finalizado: "#06B6D4", // Cyan-500 (Accent approx)
      archivado: "#6B7280", // Gray-500 (Muted)
      borrador: "#9CA3AF", // Gray-400
   };

   const getStatusColor = (status) => STATUS_COLORS[status?.toLowerCase()] || "#8B5CF6"; // Default Purple

   useEffect(() => {
      const checkScreenSize = () => {
         setIsMobileScreen(window.innerWidth < 1024);
      };
      checkScreenSize();
      window.addEventListener("resize", checkScreenSize);
      return () => window.removeEventListener("resize", checkScreenSize);
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

   // Ordenar días de la semana: Lun - Dom
   const sorter = { 'Lun': 1, 'Mar': 2, 'Mie': 3, 'Jue': 4, 'Vie': 5, 'Sab': 6, 'Dom': 7 };
   const performanceData = [...(metrics?.weeklyPerformance || [])].sort((a, b) => {
      return (sorter[a.name] || 0) - (sorter[b.name] || 0);
   });
   const statusOrder = {
      'pendiente': 1,
      'en_revision': 2,
      'en_revisión': 2,
      'aprobado': 3,
      'firmado': 4,
      'finalizado': 5,
      'archivado': 6,
      'borrador': 0
   };
   const statusData = [...(metrics?.statusDistribution || [])].sort((a, b) => {
      const orderA = statusOrder[a.name?.toLowerCase()] || 99;
      const orderB = statusOrder[b.name?.toLowerCase()] || 99;
      return orderA - orderB;
   });

   return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white selection:bg-blue-500 selection:text-white">
         <Header />
         <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            isMobileOpen={isMobileOpen}
            onNavigate={() => setIsMobileOpen(false)}
         />

         <main
            className={`transition-all duration-300 ${isMobileScreen ? "lg:ml-0" : sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
               } pt-20 lg:pt-24 p-6`}
         >
            <div className="mb-4">
               <h1 className="text-3xl font-bold mb-1">Panel de Métricas</h1>
               <p className="text-gray-500 dark:text-gray-400">
                  Visión general del rendimiento y estado de solicitudes.
               </p>
            </div>

            {/* 1. KPIs Principales (Fila Superior) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
               {/* Columna Izquierda: Tiempos y Rendimiento (Ocupa 2/3) */}
               <div className="xl:col-span-2 space-y-4">
                  {/* Tiempos de Respuesta */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg transition-colors">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                              <Icon name="Clock" size={24} />
                           </div>
                           <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tiempos de Ciclo (Promedios)</h3>
                        </div>

                        {/* Toggle Button */}
                        {/* Toggle Button GroupContainer */}
                        <div className="flex gap-2">
                           {/* Selector Semana/Global */}
                           <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                              <button
                                 onClick={() => setIsGlobalTime(false)}
                                 className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${!isGlobalTime
                                    ? "bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                                    }`}
                              >
                                 Semana
                              </button>
                              <button
                                 onClick={() => setIsGlobalTime(true)}
                                 className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${isGlobalTime
                                    ? "bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                                    }`}
                              >
                                 Global
                              </button>
                           </div>

                           {/* Selector Días/Horas */}
                           <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                              <button
                                 onClick={() => setTimeUnit("dias")}
                                 className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${timeUnit === "dias"
                                    ? "bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                                    }`}
                              >
                                 Días
                              </button>
                              <button
                                 onClick={() => setTimeUnit("horas")}
                                 className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${timeUnit === "horas"
                                    ? "bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                                    }`}
                              >
                                 Hrs
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <TimeMetricItem
                           label="Creación → Revisión"
                           value={isGlobalTime ? metrics?.timeMetrics?.creationToReview : metrics?.weeklyTimeMetrics?.creationToReview}
                           globalValue={metrics?.timeMetrics?.creationToReview}
                           unit={timeUnit}
                           color="bg-blue-500"
                           showComparison={!isGlobalTime}
                        />
                        <TimeMetricItem
                           label="Creación → Aprobado"
                           value={isGlobalTime ? metrics?.timeMetrics?.creationToApproved : metrics?.weeklyTimeMetrics?.creationToApproved}
                           globalValue={metrics?.timeMetrics?.creationToApproved}
                           unit={timeUnit}
                           color="bg-purple-500"
                           showComparison={!isGlobalTime}
                        />
                        <TimeMetricItem
                           label="Firmado → Finalizado"
                           value={isGlobalTime ? metrics?.timeMetrics?.signedToFinalized : metrics?.weeklyTimeMetrics?.signedToFinalized}
                           globalValue={metrics?.timeMetrics?.signedToFinalized}
                           unit={timeUnit}
                           color="bg-emerald-500"
                           showComparison={!isGlobalTime}
                        />
                     </div>
                  </div>

                  {/* Gráfico de Barras */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg transition-colors">
                     <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Solicitudes por Día (Semana Anterior)</h3>
                     <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={performanceData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} opacity={0.3} />
                              <XAxis dataKey="name" stroke="#9CA3AF" axisLine={false} tickLine={false} />
                              <YAxis stroke="#9CA3AF" axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 'auto']} />
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
               <div className="space-y-4">
                  {/* Gráfico de Torta - Estados */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg h-full transition-colors">
                     <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Distribución por Estado</h3>
                     <div className="h-56 w-full flex justify-center">
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
                                 startAngle={180}
                                 endAngle={-180}
                              >
                                 {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                                 ))}
                              </Pie>
                              <Tooltip
                                 contentStyle={{
                                    backgroundColor: "#1F2937",
                                    borderColor: "#374151",
                                    color: "#fff",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                 }}
                                 itemStyle={{ color: "#fff" }}
                                 labelStyle={{ color: "#fff" }}
                              />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>

                     <div className="mt-4 space-y-3">
                        {statusData.map((entry, index) => (
                           <div key={index} className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                 <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getStatusColor(entry.name) }}
                                 ></div>
                                 <span className="text-gray-600 dark:text-gray-300 capitalize">
                                    {entry.name.replace(/_/g, " ")}
                                 </span>
                              </div>
                              <span className="font-bold text-gray-900 dark:text-white">{entry.value}</span>
                           </div>
                        ))}
                        {statusData.length === 0 && (
                           <p className="text-gray-500 text-center text-sm">No hay datos suficientes</p>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
};

const TimeMetricItem = ({ label, value, globalValue, unit, color, showComparison }) => {
   // Conversión dinámica
   // 'value' y 'globalValue' vienen en HORAS
   const isDays = unit === 'dias';

   const formatVal = (v) => {
      if (v === null || v === undefined) return null;
      return isDays ? Math.round(v / 24) : parseFloat(v).toFixed(1);
   };

   const displayVal = formatVal(value);
   const displayGlobal = formatVal(globalValue);
   const unitLabel = isDays ? "días" : "hrs";
   const maxScale = isDays ? 30 : 720; // 30 días o 720 horas

   let comparison = null;
   if (showComparison && displayVal !== null && displayGlobal !== null) {
      // Comparar usando valores convertidos para ser consistentes con lo que ve el usuario,
      // o usar raw hours. Usamos valores convertidos numéricos.
      const valNum = parseFloat(displayVal);
      const globalNum = parseFloat(displayGlobal);

      const diff = globalNum - valNum;
      // Nota: Si diff es positivo, el valor actual es MENOR que el global (más rápido)
      // porque estamos restando Global - Actual.

      const absDiff = Math.abs(diff).toFixed(1);

      if (diff > 0.1) comparison = { text: `${absDiff}${isDays ? 'd' : 'h'} más rápido`, color: "text-emerald-500", icon: "TrendingUp" };
      else if (diff < -0.1) comparison = { text: `${absDiff}${isDays ? 'd' : 'h'} más lento`, color: "text-red-500", icon: "TrendingDown" };
      else comparison = { text: "Igual al promedio", color: "text-gray-500", icon: "Minus" };
   }

   return (
      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700/50 transition-colors">
         <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">{label}</span>
            <Icon name="Clock" size={14} className="text-gray-400 dark:text-gray-500" />
         </div>
         <div className="flex items-end gap-1 mb-3">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{displayVal !== null ? displayVal : "-"}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">{unitLabel}</span>
         </div>
         <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mb-2">
            <div className={`h-full ${color}`} style={{ width: `${Math.min(((value || 0) / maxScale) * 100, 100)}%` }}></div>
         </div>

         {showComparison && comparison && (
            <div className={`flex items-center gap-1 text-xs font-medium ${comparison.color}`}>
               <Icon name={comparison.icon} size={12} />
               <span>{comparison.text}</span>
            </div>
         )}
      </div>
   );
};

export default DashboardHome;
