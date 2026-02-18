import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import PaymentModal from './PaymentModal';
import { apiFetch } from '../../../utils/api';

const Dashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState('Todos');
    const [metrics, setMetrics] = useState({
        income: 0,
        pendingAmount: 0,
        todayCount: 0,
        pendingCount: 0
    });

    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'Todos') return true;
        return tx.status === filter;
    });

    const fetchTransactions = async () => {
        try {
            const response = await apiFetch('/pagos/admin/all', { method: 'GET' });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setTransactions(data);
                    calculateMetrics(data);
                }
            } else {
                console.error("Error fetching admin transactions:", response.statusText);
            }
        } catch (error) {
            console.error("Error fetching admin transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateMetrics = (data) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const income = data
            .filter(t => t.status === 'Aprobado')
            .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

        const pendingAmount = data
            .filter(t => t.status === 'Pendiente')
            .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

        const todayCount = data.filter(t => {
            const tDate = new Date(t.createdAt).getTime();
            return tDate >= today;
        }).length;

        const pendingCount = data.filter(t => t.status === 'Pendiente').length;

        setMetrics({ income, pendingAmount, todayCount, pendingCount });
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleStatusChange = (id, newStatus) => {
        setTransactions(prev => {
            const updated = prev.map(t => t._id === id ? { ...t, status: newStatus } : t);
            calculateMetrics(updated);
            return updated;
        });
        setIsModalOpen(false);
    };

    const handleViewDetails = (payment) => {
        setSelectedPayment(payment);
        setIsModalOpen(true);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    };

    return (
        <div className="font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Gestor de Pagos
                    </h1>
                    <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">
                        Gestión de pagos y administración de comprobantes empresariales.
                    </p>
                </div>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {/* Ingresos del Mes */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-primary">
                            <Icon name="DollarSign" size={24} />
                        </div>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ingresos Totales</h3>
                    <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(metrics.income)}</span>
                    </div>
                </div>

                {/* Total Pendiente */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
                            <Icon name="Wallet" size={24} />
                        </div>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monto Pendiente</h3>
                    <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(metrics.pendingAmount)}</span>
                    </div>
                </div>

                {/* Comprobantes Hoy */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-sky-50 dark:bg-sky-500/10 rounded-lg text-sky-600 dark:text-sky-400">
                            <Icon name="Upload" size={24} />
                        </div>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comprobantes Hoy</h3>
                    <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-xl font-bold text-slate-900 dark:text-white">{metrics.todayCount}</span>
                    </div>
                </div>

                {/* Pagos Pendientes */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-violet-50 dark:bg-violet-500/10 rounded-lg text-violet-600 dark:text-violet-400">
                            <Icon name="Clock" size={24} />
                        </div>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Por Revisar</h3>
                    <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-xl font-bold text-slate-900 dark:text-white">{metrics.pendingCount}</span>
                        <span className="text-[10px] text-slate-400 font-normal">Transacciones</span>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
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
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">Cargando datos...</td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No hay pagos registrados.</td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx) => (
                                    <tr key={tx._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                                        <td className="px-6 py-5">
                                            {tx.status === 'Aprobado' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></span>
                                                    Aprobado
                                                </span>
                                            )}
                                            {tx.status === 'Pendiente' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2"></span>
                                                    Pendiente
                                                </span>
                                            )}
                                            {tx.status === 'Rechazado' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>
                                                    Rechazado
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{tx.concept}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    {tx.company} • {new Date(tx.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center font-bold text-slate-700 dark:text-slate-300">
                                            {formatCurrency(tx.amount)}
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

            <PaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                payment={selectedPayment}
                onStatusChange={handleStatusChange}
            />
        </div>
    );
};

export default Dashboard;
