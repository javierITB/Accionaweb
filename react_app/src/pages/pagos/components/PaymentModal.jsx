import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { apiFetch } from '../../../utils/api';
import Button from '../../../components/ui/Button';

const PaymentModal = ({ isOpen, onClose, company }) => {
    const [charges, setCharges] = useState([]);
    const [selectedCharge, setSelectedCharge] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (isOpen && company?.dbName) {
            fetchCharges();
        } else {
            setCharges([]);
            setSelectedCharge(null);
        }
    }, [isOpen, company]);

    const fetchCharges = async () => {
        setLoading(true);
        try {
            const response = await apiFetch(`/pagos/admin/charges/${company.dbName}`, { method: 'GET' });
            if (response.ok) {
                const data = await response.json();
                setCharges(data);
                if (data.length > 0) {
                    setSelectedCharge(data[0]); // Select first by default
                }
            }
        } catch (error) {
            console.error("Error fetching charges:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (status) => {
        if (!selectedCharge) return;
        try {
            setUpdating(true);
            await apiFetch(`/pagos/admin/status/${selectedCharge._id}`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });

            // Update local state
            const updatedCharge = { ...selectedCharge, status };
            setSelectedCharge(updatedCharge);
            setCharges(charges.map(c => c._id === selectedCharge._id ? updatedCharge : c));

        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error al actualizar el estado");
        } finally {
            setUpdating(false);
        }
    };

    const handleDownload = async () => {
        if (!selectedCharge) return;
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
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40">
            <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                <span className="text-primary">
                                    <Icon name="Building" size={24} />
                                </span>
                                {company?.name}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Historial de Cobros y Pagos</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                        >
                            <Icon name="X" size={24} />
                        </button>
                    </div>

                    {/* Mini Metrics Bar */}
                    <div className="flex gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                            <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md text-green-600 dark:text-green-400">
                                <Icon name="DollarSign" size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Pagado</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
                                        charges.filter(c => c.status === 'Aprobado').reduce((acc, curr) => acc + (curr.amount || 0), 0)
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-md text-amber-600 dark:text-amber-400">
                                <Icon name="Clock" size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Pendiente</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
                                        charges.filter(c => ['Pendiente', 'En Revisión'].includes(c.status)).reduce((acc, curr) => acc + (curr.amount || 0), 0)
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Sidebar: List of Charges */}
                    <div className="w-1/3 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Cobros Generados</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {loading ? (
                                <p className="text-center text-slate-400 py-4">Cargando...</p>
                            ) : charges.length === 0 ? (
                                <p className="text-center text-slate-400 py-4">No hay cobros generados.</p>
                            ) : (
                                charges.map(charge => (
                                    <div
                                        key={charge._id}
                                        onClick={() => setSelectedCharge(charge)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedCharge?._id === charge._id
                                                ? 'bg-white dark:bg-slate-800 border-primary shadow-md ring-1 ring-primary/20'
                                                : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-900 dark:text-white">{charge.period || 'Sin periodo'}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${charge.status === 'Aprobado' ? 'bg-green-100 text-green-700' :
                                                    charge.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' :
                                                        charge.status === 'En Revisión' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-red-100 text-red-700'
                                                }`}>
                                                {charge.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 mb-1 truncate">{charge.concept}</p>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(charge.amount)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main Content: Charge Details */}
                    <div className="w-2/3 bg-white dark:bg-slate-900 overflow-y-auto p-6 custom-scrollbar">
                        {selectedCharge ? (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                {/* Charge Info Header */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{selectedCharge.concept}</h2>
                                        <p className="text-slate-500">Periodo: {selectedCharge.period}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(selectedCharge.amount)}
                                        </div>
                                        <span className="text-xs text-slate-400">CLP</span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

                                {/* Verification Section */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Comprobante de Pago</h3>

                                    {selectedCharge.receipt ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                                    <Icon name="FileText" size={24} className="text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-900 dark:text-white">{selectedCharge.receipt.file?.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        Subido por {selectedCharge.receipt.uploadedBy} el {new Date(selectedCharge.receipt.uploadedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={handleDownload} iconName="Download">
                                                    Descargar
                                                </Button>
                                            </div>

                                            {/* Preview Area (Simplified) */}
                                            {selectedCharge.receipt.file?.mimetype?.startsWith('image/') && (
                                                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm max-h-[400px] flex items-center justify-center bg-slate-100 dark:bg-slate-950">
                                                    {/* We can fetch the image blob again or rely on a separate specific endpoint for preview if needed. reusing download logic for simplicity or just showing icon if secure preview not ready */}
                                                    <div className="text-center p-10 text-slate-400">
                                                        <Icon name="Image" size={48} className="mx-auto mb-2 opacity-50" />
                                                        <p>Vista previa requiere descarga</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Approval Actions */}
                                            {selectedCharge.status !== 'Aprobado' && (
                                                <div className="flex gap-3 pt-4">
                                                    <Button
                                                        variant="success"
                                                        onClick={() => updateStatus('Aprobado')}
                                                        loading={updating}
                                                        iconName="Check"
                                                        className="flex-1"
                                                    >
                                                        Aprobar Pago
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => updateStatus('Rechazado')}
                                                        loading={updating}
                                                        iconName="X"
                                                        className="flex-1"
                                                    >
                                                        Rechazar Pago
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                                <Icon name="Clock" size={32} />
                                            </div>
                                            <h4 className="text-lg font-medium text-slate-900 dark:text-white">Pago Pendiente</h4>
                                            <p className="text-slate-500 mt-1 max-w-sm">
                                                La empresa aún no ha subido el comprobante de transferencia para este cobro.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Icon name="ArrowLeft" size={48} className="mb-4 opacity-50" />
                                <p>Selecciona un cobro para ver los detalles.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
