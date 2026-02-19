import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Button from "../../components/ui/Button";
import { apiFetch } from '../../utils/api';

import UploadReceiptModal from './UploadReceiptModal';

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

    // Modal States
    const [selectedCharge, setSelectedCharge] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [filter, setFilter] = useState('Todos');

    const fetchTransactions = async () => {
        try {
            const response = await apiFetch('/pagos/client/my-charges', { method: 'GET' });
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

    const handleUploadClick = (charge) => {
        setSelectedCharge(charge);
        setIsUploadModalOpen(true);
    };

    const handleViewDetails = (charge) => {
        // Prepare data for PaymentModal which expects a 'payment' object (or renamed 'company' logic)
        // Since we are reusing PaymentModal which was refactored for Admin to show list, 
        // we might need a simpler ReadOnly modal for Client or adapt PaymentModal.
        // The Admin PaymentModal takes `company` and fetches charges. 
        // The OLD PaymentModal took `payment`.
        // I replaced PaymentModal with the Admin version in previous step? 
        // Wait, I replaced `PaymentModal.jsx` completely. 
        // The NEW PaymentModal expects `company` prop and fetches list.
        // This is problematic for the Client view which just wants to see ONE charge details or the same view?
        // Actually, the new PaymentModal shows the list of charges for a company.
        // Getting "My Charges" is essentially the same view but for "My Company".
        // BUT `PaymentModal` fetches `/pagos/admin/charges/:companyDb`.
        // Client cannot access `/pagos/admin/...`.
        // So I cannot reuse the NEW `PaymentModal` directly if it hardcodes the admin endpoint.

        // FIX: I should probably create a separate `ClientPaymentDetailModal` or make `PaymentModal` flexible.
        // OR simply use a simple modal here since I have the data.

        // For now, I'll alert or show a simple placeholder if I can't reuse it easily, 
        // OR I will perform a quick fix to `PaymentModal` to accept a `mode` or `endpoint`.

        // actually looking at PaymentModal code I wrote:
        // const response = await apiFetch(`/pagos/admin/charges/${company.dbName}`, ...);
        // It IS hardcoded.

        // So I will create a simple ReadOnlyDetailModal inside here or separate file. 
        // Or better yet, since I am creating UploadReceiptModal, I can create `ChargeDetailModal.jsx`.

        setSelectedCharge(charge);
        setIsDetailModalOpen(true);
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

            {isMobileScreen && isMobileOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileOpen(false)}></div>
            )}

            <main className={`transition-all duration-300 ${mainMarginClass} pt-24 lg:pt-20`}>
                <div className="px-4 sm:px-6 lg:p-6 space-y-6 max-w-7xl mx-auto">
                    {/* Header Content */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Mis Cobros</h1>
                            <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">Gestiona tus pagos pendientes y visualiza tu historial.</p>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex gap-2">
                            <button onClick={() => setFilter('Todos')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'Todos' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Todos</button>
                            <button onClick={() => setFilter('Pendiente')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'Pendiente' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Pendientes</button>
                            <button onClick={() => setFilter('Aprobado')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'Aprobado' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Aprobados</button>
                            <button onClick={() => setFilter('Rechazado')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'Rechazado' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Rechazados</button>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-40">Estado</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Concepto</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center w-40">Monto</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right w-48">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {loading ? (
                                        <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Cargando historial...</td></tr>
                                    ) : filteredTransactions.length === 0 ? (
                                        <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No hay cobros registrados</td></tr>
                                    ) : (
                                        filteredTransactions.map((tx) => (
                                            <tr key={tx._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border 
                                                        ${tx.status === 'Aprobado' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20' :
                                                            tx.status === 'Pendiente' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' :
                                                                tx.status === 'En Revisión' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' :
                                                                    'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'}`}>
                                                        <span className={`size-1.5 rounded-full ${tx.status === 'Aprobado' ? 'bg-green-500' :
                                                            tx.status === 'Pendiente' ? 'bg-amber-500' :
                                                                tx.status === 'En Revisión' ? 'bg-blue-500' : 'bg-red-400'}`}></span>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{tx.concept}</span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            {tx.period}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center font-bold text-slate-700 dark:text-slate-300">
                                                    {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(tx.amount)}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    {tx.status === 'Pendiente' || tx.status === 'Rechazado' ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleUploadClick(tx)}
                                                            iconName="Upload"
                                                        >
                                                            Subir Pago
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleViewDetails(tx)}
                                                        >
                                                            Ver Detalles
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <UploadReceiptModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                charge={selectedCharge}
                onSuccess={() => {
                    fetchTransactions();
                    setIsUploadModalOpen(false);
                }}
            />

            {/* Simple Detail Modal using generic HTML/Tailwind for now to avoid Dependency Loop or Complexity with Admin Modal */}
            {isDetailModalOpen && selectedCharge && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col p-6 space-y-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">Detalle del Cobro</h3>
                            <button onClick={() => setIsDetailModalOpen(false)}><Icon name="X" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500">Concepto</label>
                                <p className="font-medium">{selectedCharge.concept}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500">Monto</label>
                                <p className="font-medium">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(selectedCharge.amount)}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500">Estado</label>
                                <p className="font-medium">{selectedCharge.status}</p>
                            </div>
                            {selectedCharge.receipt && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-between">
                                    <span className="text-sm">{selectedCharge.receipt.file?.name}</span>
                                    <Button size="sm" variant="outline" onClick={async () => {
                                        try {
                                            const response = await apiFetch(`/pagos/file/${selectedCharge._id}`, { method: 'GET' });
                                            if (response.ok) {
                                                const blob = await response.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = selectedCharge.receipt?.file?.name || 'comprobante';
                                                a.click();
                                            }
                                        } catch (error) {
                                            console.error("Error downloading file:", error);
                                        }
                                    }}>Descargar</Button>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => setIsDetailModalOpen(false)}>Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}

            {!isMobileOpen && isMobileScreen && (
                <div className="fixed bottom-4 left-4 z-50">
                    <Button variant="default" size="icon" onClick={toggleSidebar} iconName="Menu" className="w-12 h-12 rounded-full shadow-lg" />
                </div>
            )}
        </div>
    );
};

export default ComprobantesIndex;
