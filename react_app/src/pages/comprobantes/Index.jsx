import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Button from "../../components/ui/Button";
import { apiFetch } from '../../utils/api';
import PaymentModal from '../pagos/components/PaymentModal';

const ComprobantesIndex = () => {
    const navigate = useNavigate();

    // Layout States
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobileScreen, setIsMobileScreen] = useState(false);

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

    const mainMarginClass = isMobileScreen ? "ml-0" : sidebarCollapsed ? "ml-16" : "ml-64";

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState('Todos');

    const fetchTransactions = async () => {
        try {
            const response = await apiFetch('/pagos/history', { method: 'GET' });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setTransactions(data);
                }
            } else {
                console.error("Error fetching transactions:", response.statusText);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleViewDetails = (payment) => {
        // Enlazar datos para el modal (el modal espera ciertas propiedades)
        const paymentData = {
            ...payment,
            userEmail: "Tú", // O podrías obtener el email real del usuario actual si lo tienes en contexto
            company: "Tu Empresa" // O obtener el nombre real
        };
        setSelectedPayment(paymentData);
        setIsModalOpen(true);
    };

    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'Todos') return true;
        return tx.status === filter;
    });

    return (
        <div className="min-h-screen bg-background transition-colors duration-200">
            <Header />

            {/* Sidebar */}
            {(isMobileOpen || !isMobileScreen) && (
                <Sidebar
                    isCollapsed={sidebarCollapsed}
                    onToggleCollapse={toggleSidebar}
                    isMobileOpen={isMobileOpen}
                    onNavigate={handleNavigation}
                />
            )}

            {/* Overlay */}
            {isMobileScreen && isMobileOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileOpen(false)}></div>
            )}

            <main className={`transition-all duration-300 ${mainMarginClass} pt-24 lg:pt-20`}>
                <div className="px-4 sm:px-6 lg:p-6 space-y-6 max-w-7xl mx-auto">
                    {/* Header Content */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Historial de Pagos</h1>
                            <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">Gestiona tus comprobantes y visualiza el estado de tus transacciones en tiempo real.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/comprobantes/subir')}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-sm"
                            >
                                <Icon name="CloudUpload" size={18} />
                                Subir Comprobante
                            </button>
                        </div>
                    </div>

                    {/* Filters Bar (Moved outside) */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('Todos')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'Todos' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >Todos</button>
                            <button
                                onClick={() => setFilter('Pendiente')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'Pendiente' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >Pendientes</button>
                            <button
                                onClick={() => setFilter('Aprobado')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'Aprobado' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >Aprobados</button>
                            <button
                                onClick={() => setFilter('Rechazado')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'Rechazado' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >Rechazados</button>
                        </div>

                        {/* Search Bar - Reusing current style but outside */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-500 w-full md:w-64 text-slate-900 dark:text-white"
                                    placeholder="Buscar..."
                                    type="text"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-40">Estado</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Detalles</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center w-40">Monto</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right w-40">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-slate-500">Cargando historial...</td>
                                        </tr>
                                    ) : filteredTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No hay comprobantes registrados</td>
                                        </tr>
                                    ) : (
                                        filteredTransactions.map((tx, index) => (
                                            <tr key={index} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border 
                                                        ${tx.status === 'Aprobado' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20' :
                                                            tx.status === 'Pendiente' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' :
                                                                'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'}`}>
                                                        <span className={`size-1.5 rounded-full ${tx.status === 'Aprobado' ? 'bg-green-500' :
                                                            tx.status === 'Pendiente' ? 'bg-amber-500' :
                                                                'bg-red-400'
                                                            }`}></span>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{tx.concept}</span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            {new Date(tx.date).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center font-bold text-slate-700 dark:text-slate-300">
                                                    ${parseFloat(tx.amount).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button
                                                        className="text-sm font-semibold text-primary hover:text-blue-600 transition-colors"
                                                        onClick={() => handleViewDetails(tx)}
                                                    >
                                                        Ver Detalles
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Requirements Box */}
                    <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 flex items-start gap-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                            <Icon name="Info" size={20} />
                        </div>
                        <div>
                            <h3 className="text-blue-900 dark:text-blue-200 text-sm font-semibold">Requisitos de subida</h3>
                            <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">Los comprobantes deben ser archivos originales en formato PDF, JPG o PNG. El tiempo estimado de validación es de 24 horas hábiles.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Floating Mobile Menu Button */}
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

            <PaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                payment={selectedPayment}
                onStatusChange={() => { }} // No-op for read-only
                readOnly={true}
            />
        </div>
    );
};

export default ComprobantesIndex;
