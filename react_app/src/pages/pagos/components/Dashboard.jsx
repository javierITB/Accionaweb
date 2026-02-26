import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import PaymentModal from './PaymentModal';
import CreateChargeModal from './CreateChargeModal';
import { apiFetch } from '../../../utils/api';
import Button from '../../../components/ui/Button';

const Dashboard = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        global: {
            totalCollected: 0,
            monthCollected: 0,
            totalPending: 0,
            countPending: 0
        },
        byCompany: {}
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [companiesRes, statsRes] = await Promise.all([
                apiFetch('/sas/companies', { method: 'GET' }),
                apiFetch('/pagos/admin/dashboard-stats', { method: 'GET' })
            ]);

            if (companiesRes.ok && statsRes.ok) {
                const companiesData = await companiesRes.json();
                const statsData = await statsRes.json();

                if (Array.isArray(companiesData)) {
                    const clientCompanies = companiesData.filter(c => !c.isSystem && c.dbName !== 'formsdb');
                    setCompanies(clientCompanies);
                }
                setStats(statsData);
            } else {
                console.error("Error fetching dashboard data");
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewCompany = (company) => {
        setSelectedCompany(company);
        setIsPaymentModalOpen(true);
    };

    // Helper to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount || 0);
    };

    return (
        <div className="font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Gestión de Cobros
                    </h1>
                    <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">
                        Administra cobros, revisa estados y gestiona comprobantes.
                    </p>
                </div>
                <div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        iconName="Plus"
                    >
                        Generar Cobro
                    </Button>
                </div>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
                {/* 1. Ingresos Totales */}
                <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                        <div className="p-2 md:p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-500 shrink-0">
                            <Icon name="DollarSign" size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest hidden sm:inline">Histórico</span>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-1">Ingresos Totales</p>
                        <h3 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                            {formatCurrency(stats.global.totalCollected)}
                        </h3>
                    </div>
                </div>

                {/* 2. Ingresos del Mes */}
                <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                        <div className="p-2 md:p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-500 shrink-0">
                            <Icon name="TrendingUp" size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hidden sm:inline">Este Mes</span>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-1">Ingresos del Mes</p>
                        <h3 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                            {formatCurrency(stats.global.monthCollected)}
                        </h3>
                    </div>
                </div>

                {/* 3. Total Pendiente (Mes) */}
                <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                        <div className="p-2 md:p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-500 shrink-0">
                            <Icon name="Briefcase" size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest hidden sm:inline">Por Cobrar</span>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-1">Monto Pendiente</p>
                        <h3 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                            {formatCurrency(stats.global.totalPending)}
                        </h3>
                    </div>
                </div>

                {/* 4. Pagos Pendientes (Count) */}
                <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                        <div className="p-2 md:p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-500 shrink-0">
                            <Icon name="FileText" size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hidden sm:inline">Gestión</span>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-1">Cobros Pendientes</p>
                        <h3 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                            {stats.global.countPending || 0} <span className="text-[10px] md:text-sm font-normal text-slate-500">trans.</span>
                        </h3>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-500 w-full text-slate-900 dark:text-white shadow-sm"
                        placeholder="Buscar empresa por nombre..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Companies List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-500 shadow-sm">
                        <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="text-sm font-medium">Cargando información...</span>
                        </div>
                    </div>
                ) : filteredCompanies.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-500 shadow-sm">
                        No se encontraron empresas coincidentes.
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Empresa</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Último Cobro</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pendientes</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right w-40">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {filteredCompanies.map((company) => {
                                        const cStats = stats.byCompany[company.dbName] || { lastChargeDate: null, pendingCount: 0, pendingAmount: 0 };
                                        return (
                                            <tr key={company._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                                                            <Icon name="Building" size={20} />
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{company.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-sm text-slate-600 dark:text-slate-300">
                                                        {cStats.lastChargeDate ? new Date(cStats.lastChargeDate).toLocaleDateString() : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    {cStats.pendingCount > 0 ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-amber-500">
                                                                {formatCurrency(cStats.pendingAmount)}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400">
                                                                {cStats.pendingCount} Cobro(s)
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                            Al día
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button
                                                        type="button"
                                                        className="relative z-10 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewCompany(company);
                                                        }}
                                                    >
                                                        Ver Historial
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Optimized Card View */}
                        <div className="md:hidden space-y-4">
                            {filteredCompanies.map((company) => {
                                const cStats = stats.byCompany[company.dbName] || { lastChargeDate: null, pendingCount: 0, pendingAmount: 0 };
                                return (
                                    <div key={company._id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.99]" onClick={() => handleViewCompany(company)}>
                                        <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-slate-700/50 pb-3">
                                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                                                <Icon name="Building" size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{company.name}</h4>
                                                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Cliente Corporativo</p>
                                            </div>
                                            <Icon name="ChevronRight" size={16} className="text-slate-300" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Último Cobro</p>
                                                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold italic">
                                                    {cStats.lastChargeDate ? new Date(cStats.lastChargeDate).toLocaleDateString() : 'Sin registros'}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Estado / Monto</p>
                                                {cStats.pendingCount > 0 ? (
                                                    <div>
                                                        <p className="text-sm font-black text-amber-500">{formatCurrency(cStats.pendingAmount)}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{cStats.pendingCount} pdt.</p>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full uppercase">
                                                        Al día
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="w-full py-2.5 bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl transition-colors border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewCompany(company);
                                            }}
                                        >
                                            <Icon name="Eye" size={14} />
                                            Gestionar Historial
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                company={selectedCompany}
            />

            <CreateChargeModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                companies={companies}
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    // Optionally refresh simple stats if we added them
                }}
            />
        </div>
    );
};

export default Dashboard;
