import React, { useState, useEffect } from "react";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import { API_BASE_URL, apiFetch } from "../../utils/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import SummaryCard from "./components/SummaryCard";

const DashboardHome = () => {
   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
   const [isMobileOpen, setIsMobileOpen] = useState(false);
   const [isMobileScreen, setIsMobileScreen] = useState(false);
   const [rawData, setRawData] = useState(null);
   const [metrics, setMetrics] = useState(null);
   const [isGlobalTime, setIsGlobalTime] = useState(false); // Default: Esta Semana
   const [chartOffset, setChartOffset] = useState(0);

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
         const isMobile = window.innerWidth < 768;
         setIsMobileScreen(isMobile);
         if (isMobile) {
            setIsMobileOpen(false);
         }
      };
      checkScreenSize();
      window.addEventListener("resize", checkScreenSize);
      return () => window.removeEventListener("resize", checkScreenSize);
   }, []);

   const toggleSidebar = () => {
      if (isMobileScreen) {
         setIsMobileOpen(!isMobileOpen);
      } else {
         setSidebarCollapsed(!sidebarCollapsed);
      }
   };

   const handleNavigation = () => {
      if (isMobileScreen) {
         setIsMobileOpen(false);
      }
   };

   useEffect(() => {
      const fetchMetrics = async () => {
         try {
            const res = await apiFetch(`${API_BASE_URL}/dashboard/metrics`);
            const data = await res.json();
            if (data.success) {
               setRawData(data.data);
            }
         } catch (err) {
            console.error("Error fetching metrics:", err);
         } finally {
            setLoading(false);
         }
      };
      fetchMetrics();
   }, []);

   // CÁLCULO DE MÉTRICAS EN EL CLIENTE
   const processedMetrics = React.useMemo(() => {
      if (!rawData || !rawData.requests) return null;

      const { requests, totalUsers } = rawData;
      const now = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // 1. Totales
      const totalRequests = requests.length;
      const finalizedRequests = requests.filter(r => r.status === 'finalizado').length;
      const globalRate = totalRequests > 0 ? Math.round((finalizedRequests / totalRequests) * 100) : 0;

      // 2. Preparar datos para tiempos
      const diffHours = (end, start) => {
         if (!end || !start) return null;
         const dEnd = new Date(end);
         const dStart = new Date(start);
         const diff = dEnd - dStart;
         return Math.abs(diff) / (1000 * 60 * 60);
      };

      const calculateAverages = (reqs) => {
         let sumReview = 0, countReview = 0;
         let sumApprove = 0, countApprove = 0;
         let sumFinalize = 0, countFinalize = 0;

         reqs.forEach(r => {
            // Creación -> Revisión
            if (r.reviewedAt) {
               const val = diffHours(r.reviewedAt, r.createdAt);
               if (val !== null) { sumReview += val; countReview++; }
            } else if (['revision', 'en_revision'].includes(r.status)) {
            }

            // Creación -> Aprobado
            if (r.approvedAt) {
               const val = diffHours(r.approvedAt, r.createdAt);
               if (val !== null) { sumApprove += val; countApprove++; }
            }

            // Firmado -> Finalizado
            if (r.status === 'finalizado' && r.signedAt) {
               const val = diffHours(r.updatedAt, r.signedAt); // updatedAt es finalizado
               if (val !== null) { sumFinalize += val; countFinalize++; }
            }
         });

         return {
            creationToReview: countReview > 0 ? parseFloat((sumReview / countReview).toFixed(1)) : 0,
            creationToApproved: countApprove > 0 ? parseFloat((sumApprove / countApprove).toFixed(1)) : 0,
            signedToFinalized: countFinalize > 0 ? parseFloat((sumFinalize / countFinalize).toFixed(1)) : 0
         };
      };

      // Tiempos Globales
      const timeMetrics = calculateAverages(requests);

      // 3. Filtros Semanales
      const weeklyRequestsList = requests.filter(r => new Date(r.createdAt) >= oneWeekAgo);
      const weeklyRequests = weeklyRequestsList.length;

      // Tiempos Semanales (sobre solicitudes de la última semana)
      const weeklyTimeMetrics = calculateAverages(weeklyRequestsList);

      // 4. Distribución por Estado
      const statusCountMap = {};
      requests.forEach(r => {
         const s = r.status || 'Desconocido';
         statusCountMap[s] = (statusCountMap[s] || 0) + 1;
      });
      const statusDistribution = Object.keys(statusCountMap).map(key => ({
         name: key,
         value: statusCountMap[key]
      }));

      // 5. Performance Semanal
      const daysName = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
      const weeklyPerformance = [];

      for (let i = 6; i >= 0; i--) {
         const d = new Date(now);
         d.setDate(d.getDate() - i - (chartOffset * 7));

         const dayName = daysName[d.getDay()];
         const dayNum = String(d.getDate()).padStart(2, '0');
         const monthNum = String(d.getMonth() + 1).padStart(2, '0');
         const dateLabel = `${dayName} ${dayNum}/${monthNum}`;

         // Contar solicitudes de ese día
         const localDateStr = d.toLocaleDateString('en-CA');

         const count = requests.filter(r => {
            const rDate = new Date(r.createdAt);
            return rDate.toLocaleDateString('en-CA') === localDateStr;
         }).length;


         weeklyPerformance.push({
            name: dateLabel, // Recharts usa 'name' como eje X por defecto
            dayNameRaw: dayName, // Para filtro
            solicitudes: count,
            fullDate: localDateStr
         });
      }

      // Filtrar Domingo si no tiene solicitudes
      const finalWeeklyPerformance = weeklyPerformance.filter(d => {
         if (d.dayNameRaw === 'Dom' && d.solicitudes === 0) return false;
         return true;
      });

      return {
         totalUsers,
         totalRequests,
         globalRate,
         weeklyRequests,
         timeMetrics,
         weeklyTimeMetrics,
         statusDistribution,
         weeklyPerformance: finalWeeklyPerformance
      };

   }, [rawData, chartOffset]);

   useEffect(() => {
      if (processedMetrics) {
         setMetrics(processedMetrics);
      }
   }, [processedMetrics]);

   // No ordenar, respetar orden cronológico generado
   const performanceData = metrics?.weeklyPerformance || [];
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

   const mainMarginClass = isMobileScreen ? 'ml-0' : sidebarCollapsed ? 'ml-16' : 'ml-64';

   return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white selection:bg-blue-500 selection:text-white">
         <Header />
         
         {/* IMPLEMENTACIÓN DEL SIDEBAR - CORREGIDA */}
         {(isMobileOpen || !isMobileScreen) && (
            <>
               <Sidebar
                  isCollapsed={sidebarCollapsed}
                  onToggleCollapse={toggleSidebar}
                  isMobileOpen={isMobileOpen}
                  onNavigate={handleNavigation}
               />
            </>
         )}

         {/* OVERLAY PARA MÓVIL - SEPARADO Y CORREGIDO */}
         {isMobileScreen && isMobileOpen && (
            <div 
               className="fixed inset-0 bg-black/50 z-40" 
               onClick={() => setIsMobileOpen(false)}
            ></div>
         )}

         <main className={`transition-all duration-300 ${mainMarginClass} pt-20 lg:pt-24 p-6`}>
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

                        </div>

                        {/* Selector Días/Horas eliminado por formateo inteligente */}
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <TimeMetricItem
                           label="Creación → Revisión"
                           value={isGlobalTime ? metrics?.timeMetrics?.creationToReview : metrics?.weeklyTimeMetrics?.creationToReview}
                           globalValue={metrics?.timeMetrics?.creationToReview}
                           color="bg-blue-500"
                           showComparison={!isGlobalTime}
                        />
                        <TimeMetricItem
                           label="Creación → Aprobado"
                           value={isGlobalTime ? metrics?.timeMetrics?.creationToApproved : metrics?.weeklyTimeMetrics?.creationToApproved}
                           globalValue={metrics?.timeMetrics?.creationToApproved}
                           color="bg-purple-500"
                           showComparison={!isGlobalTime}
                        />
                        <TimeMetricItem
                           label="Firmado → Finalizado"
                           value={isGlobalTime ? metrics?.timeMetrics?.signedToFinalized : metrics?.weeklyTimeMetrics?.signedToFinalized}
                           globalValue={metrics?.timeMetrics?.signedToFinalized}
                           color="bg-emerald-500"
                           showComparison={!isGlobalTime}
                        />
                     </div>
                  </div>

                  {/* Gráfico de Barras */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg transition-colors">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                           {(() => {
                              if (chartOffset === 0) return "Solicitudes por Día (Última Semana)";
                              const now = new Date();
                              const startDate = new Date(now);
                              startDate.setDate(startDate.getDate() - 6 - (chartOffset * 7));
                              const dateStr = startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                              return `Semana del ${dateStr}`;
                           })()}
                        </h3>
                        <div className="flex gap-2">
                           <button
                              onClick={() => setChartOffset(prev => prev + 1)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 transition-colors"
                              title="Semana Anterior"
                           >
                              <Icon name="ChevronLeft" size={20} />
                           </button>
                           <button
                              onClick={() => setChartOffset(prev => Math.max(0, prev - 1))}
                              disabled={chartOffset === 0}
                              className={`p-1 rounded-md transition-colors ${chartOffset === 0 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                              title="Semana Siguiente"
                           >
                              <Icon name="ChevronRight" size={20} />
                           </button>
                        </div>
                     </div>
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

         {/* BOTÓN FLOTANTE MÓVIL - FUERA DEL MAIN, SIEMPRE VISIBLE */}
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

const TimeMetricItem = ({ label, value, globalValue, color, showComparison }) => {
   const formatSmart = (v) => {
      if (v === null || v === undefined) return { val: "-", unit: "", fullText: "" };

      const vNum = parseFloat(v);
      if (vNum < 24) {
         return { val: vNum.toFixed(1), unit: "hrs", rawDays: vNum / 24 };
      } else {
         const days = Math.floor(vNum / 24);
         const remHours = Math.round(vNum % 24);

         const dayText = `${days} día${days !== 1 ? 's' : ''}`;
         const hourText = remHours > 0 ? ` ${remHours} hr${remHours !== 1 ? 's' : ''}` : '';

         return { val: dayText + hourText, unit: "", rawDays: vNum / 24, isText: true };
      }
   };

   const current = formatSmart(value);
   const global = formatSmart(globalValue);

   const maxScaleDays = 30;
   const currentDays = value ? (value / 24) : 0;
   const widthPerc = Math.min((currentDays / maxScaleDays) * 100, 100);

   let comparison = null;
   if (showComparison && value !== null && globalValue !== null) {
      const diff = globalValue - value;

      if (Math.abs(diff) > 0.1) {
         const diffAbs = Math.abs(diff);
         let diffText = "";
         if (diffAbs < 24) diffText = `${diffAbs.toFixed(1)} hrs`;
         else diffText = `${(diffAbs / 24).toFixed(1)} días`;

         if (diff > 0) comparison = { text: `${diffText} más rápido`, color: "text-emerald-500", icon: "TrendingUp" };
         else comparison = { text: `${diffText} más lento`, color: "text-red-500", icon: "TrendingDown" };
      } else {
         comparison = { text: "Igual al promedio", color: "text-gray-500", icon: "Minus" };
      }
   }

   return (
      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700/50 transition-colors">
         <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">{label}</span>
            <Icon name="Clock" size={14} className="text-gray-400 dark:text-gray-500" />
         </div>
         <div className="flex items-end gap-1 mb-3">
            <span className={`font-bold text-gray-900 dark:text-white ${current.isText ? 'text-xl' : 'text-3xl'}`}>
               {current.val}
            </span>
            {!current.isText && <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">{current.unit}</span>}
         </div>
         <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mb-2">
            <div className={`h-full ${color}`} style={{ width: `${widthPerc}%` }}></div>
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