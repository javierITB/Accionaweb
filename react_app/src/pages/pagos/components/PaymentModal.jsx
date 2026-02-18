import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { apiFetch } from '../../../utils/api';

const PaymentModal = ({ isOpen, onClose, payment, onStatusChange }) => {
    const [loading, setLoading] = useState(false);

    if (!isOpen || !payment) return null;

    const updateStatus = async (status) => {
        try {
            setLoading(true);
            await apiFetch(`/pagos/${payment._id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
            onStatusChange(payment._id, status);
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error al actualizar el estado");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            const response = await apiFetch(`/pagos/file/${payment._id}`, { method: 'GET' });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = payment.file?.name || 'comprobante';
                a.click();
            }
        } catch (error) {
            console.error("Error downloading file:", error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40">
            {/* Modal Container */}
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-900">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <span className="text-primary">
                                <Icon name="Receipt" size={28} />
                            </span>
                            Detalle de Pago
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Información detallada del comprobante de transferencia</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                    >
                        <Icon name="X" size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-5 gap-8 bg-white dark:bg-slate-900">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Status Badge */}
                        <div className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold uppercase tracking-wider ${payment.status === 'Aprobado' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            payment.status === 'Pendiente' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-red-100 text-red-600 dark:bg-red-800/30 dark:text-red-400'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${payment.status === 'Aprobado' ? 'bg-green-500' :
                                payment.status === 'Pendiente' ? 'bg-amber-500 animate-pulse' :
                                    'bg-red-500'
                                }`}></span>
                            {payment.status}
                        </div>

                        <div className="space-y-6">
                            {/* Amount */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monto del Pago</label>
                                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(payment.amount)} <span className="text-lg font-normal text-slate-400">CLP</span>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                                        <Icon name="Calendar" size={20} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Fecha y Hora de Subida</label>
                                        <p className="font-medium text-slate-900 dark:text-white">{new Date(payment.date).toLocaleDateString()}</p>
                                        <p className="text-sm text-slate-400">{new Date(payment.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                                        <Icon name="User" size={20} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Empresa / Usuario</label>
                                        <p className="font-medium text-slate-900 dark:text-white">{payment.company}</p>
                                        <p className="text-sm text-slate-400">{payment.userEmail}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                                        <Icon name="FileText" size={20} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Concepto</label>
                                        <p className="font-medium text-slate-900 dark:text-white">{payment.concept}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Receipt Preview */}
                    <div className="lg:col-span-3">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Visualización del Comprobante</label>
                        <div className="relative group aspect-[3/4] lg:aspect-auto lg:h-[450px] w-full bg-slate-200 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center">

                            <div className="flex flex-col items-center gap-4">
                                <Icon name="FileText" size={64} className="text-slate-400" />
                                <p className="text-slate-500 font-medium">{payment.file?.name}</p>
                            </div>

                            {/* Actions Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button onClick={handleDownload} className="bg-white text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-100 transition-all shadow-lg">
                                    <Icon name="Download" size={20} />
                                    Descargar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => updateStatus('Rechazado')}
                            disabled={loading || payment.status === 'Rechazado'}
                            className="w-full sm:w-auto px-8 py-2.5 rounded-lg border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Icon name="Ban" size={20} />
                            Rechazar Pago
                        </button>
                        <button
                            onClick={() => updateStatus('Aprobado')}
                            disabled={loading || payment.status === 'Aprobado'}
                            className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-primary text-white hover:bg-blue-600 font-semibold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Icon name="CheckCircle" size={20} />
                            Aprobar Pago
                        </button>
                    </div>
                </div>
            </div>

            {/* Shortcut hint */}
            <div className="fixed bottom-6 right-6 z-10 hidden md:block">
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-xl max-w-xs">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                        <Icon name="Info" size={16} />
                        <span className="text-xs font-bold uppercase">Atajo</span>
                    </div>
                    <p className="text-xs text-slate-400">Presiona 'Esc' para cerrar o haz clic fuera del modal para volver al listado.</p>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
