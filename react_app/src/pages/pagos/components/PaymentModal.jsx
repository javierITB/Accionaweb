import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { apiFetch } from '../../../utils/api';
import Button from '../../../components/ui/Button';

const PaymentModal = ({ isOpen, onClose, company }) => {
    const [charges, setCharges] = useState([]);
    const [selectedCharge, setSelectedCharge] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [showMobileDetail, setShowMobileDetail] = useState(false);

    // Reset mobile detail when selecting a charge on desktop or closing/opening
    const handleSelectCharge = (charge) => {
        setSelectedCharge(charge);
        setShowMobileDetail(true);
    };

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

    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        let activeUrl = null;

        const fetchPreview = async () => {
            setPreviewUrl(null);

            const mimeType = selectedCharge?.receipt?.file?.mimetype;
            if (mimeType?.startsWith('image/') || mimeType === 'application/pdf') {
                try {
                    const response = await apiFetch(`/pagos/file/${selectedCharge._id}`, { method: 'GET' });
                    if (response.ok) {
                        const blob = await response.blob();
                        activeUrl = window.URL.createObjectURL(blob);
                        setPreviewUrl(activeUrl);
                    }
                } catch (error) {
                    console.error("Error fetching preview:", error);
                }
            } else {
                setPreviewUrl(null);
            }
        };

        fetchPreview();

        return () => {
            if (activeUrl) window.URL.revokeObjectURL(activeUrl);
        };
    }, [selectedCharge]);


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
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Error downloading file:", error);
        }
    };

    const formatPeriod = (periodStr) => {
        if (!periodStr) return 'Sin periodo';
        const [year, month] = periodStr.split('-');
        const months = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        return `${months[parseInt(month) - 1]} de ${year}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm bg-slate-900/40">
            <div className="bg-white dark:bg-slate-900 w-full md:max-w-6xl h-full md:h-[85vh] rounded-t-2xl md:rounded-2xl shadow-2xl border-t md:border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 md:zoom-in duration-300">

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <span className="text-primary">
                                <Icon name="Building" size={24} />
                            </span>
                            {company?.name}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Historial de Cobros y Pagos</p>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Mini Metrics Bar */}
                        <div className="flex gap-1.5 md:gap-3 bg-slate-50 md:bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm md:shadow-none">
                            <div className="px-2.5 md:px-4 py-1 md:py-1.5 rounded-lg flex items-center gap-2 shrink-0">
                                <Icon name="CheckCircle" size={14} className="text-emerald-500" />
                                <div className="min-w-0">
                                    <p className="text-[7px] md:text-[9px] uppercase font-black text-slate-500 dark:text-slate-400 leading-none mb-0.5">Pagado</p>
                                    <p className="text-[11px] md:text-sm font-black text-slate-900 dark:text-white whitespace-nowrap leading-none">
                                        {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
                                            charges.filter(c => c.status === 'Aprobado').reduce((acc, curr) => acc + (curr.amount || 0), 0)
                                        ).replace(',00', '')}
                                    </p>
                                </div>
                            </div>
                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 self-center"></div>
                            <div className="px-2.5 md:px-4 py-1 md:py-1.5 rounded-lg flex items-center gap-2 shrink-0">
                                <Icon name="Clock" size={14} className="text-amber-500" />
                                <div className="min-w-0">
                                    <p className="text-[7px] md:text-[9px] uppercase font-black text-slate-500 dark:text-slate-400 leading-none mb-0.5">Pdt.</p>
                                    <p className="text-[11px] md:text-sm font-black text-slate-900 dark:text-white whitespace-nowrap leading-none">
                                        {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
                                            charges.filter(c => ['Pendiente', 'En Revisión'].includes(c.status)).reduce((acc, curr) => acc + (curr.amount || 0), 0)
                                        ).replace(',00', '')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 md:static text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg active:scale-90"
                        >
                            <Icon name="X" size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden relative">

                    {/* Sidebar: List of Charges */}
                    <div className={`${showMobileDetail ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 flex-col`}>
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-900/50">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Cobros Generados</h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{charges.length}</span>
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
                                        onClick={() => handleSelectCharge(charge)}
                                        className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedCharge?._id === charge._id
                                            ? 'bg-white dark:bg-slate-800 border-primary shadow-md ring-1 ring-primary/20'
                                            : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1 gap-2">
                                            <span className="font-bold text-slate-900 dark:text-white text-sm">{formatPeriod(charge.period)}</span>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${charge.status === 'Aprobado' ? 'bg-green-100 text-green-700' :
                                                charge.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' :
                                                    charge.status === 'En Revisión' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {charge.status === 'En Revisión' ? 'Revisión' : charge.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-2 truncate font-medium">{charge.concept}</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-black text-slate-800 dark:text-white">
                                                {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(charge.amount)}
                                            </p>
                                            <Icon name="ChevronRight" size={14} className="text-slate-300 md:hidden" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main Content: Charge Details */}
                    <div className={`${showMobileDetail ? 'flex' : 'hidden md:flex'} w-full md:w-2/3 bg-white dark:bg-slate-900 flex-col h-full relative`}>
                        {/* Mobile Back Button */}
                        <div className="md:hidden p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0 bg-white dark:bg-slate-900">
                            <button onClick={() => setShowMobileDetail(false)} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                <Icon name="ArrowLeft" size={20} />
                            </button>
                            <h3 className="font-bold text-slate-900 dark:text-white">Detalle del Pago</h3>
                        </div>

                        {selectedCharge ? (
                            <>
                                {/* Scrollable Top Section: Details & File Info */}
                                <div className="p-6 pb-2 shrink-0 overflow-y-auto max-h-[40vh] custom-scrollbar space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        {/* Date Info */}
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-400 border border-slate-200 dark:border-slate-700">
                                                <Icon name="Calendar" size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Fecha y Hora de Subida</p>
                                                {selectedCharge.receipt ? (
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white">
                                                            {new Date(selectedCharge.receipt.uploadedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </p>
                                                        <p className="text-xs text-slate-500 font-medium">
                                                            {new Date(selectedCharge.receipt.uploadedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hrs
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-medium text-slate-400 italic">Pendiente de subida</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Uploader Info */}
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-400 border border-slate-200 dark:border-slate-700">
                                                <Icon name="User" size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Subido Por</p>
                                                {selectedCharge.receipt ? (
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white">
                                                            {selectedCharge.receipt.uploadedBy || 'Usuario Desconocido'}
                                                        </p>
                                                        <p className="text-xs text-slate-500 font-medium">
                                                            {company?.name}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-medium text-slate-400 italic">--</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Comprobante de Pago</h3>
                                        {selectedCharge.receipt && (
                                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                                    <Icon name="FileText" size={24} className="text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-900 dark:text-white">{selectedCharge.receipt.file?.name}</p>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={handleDownload} iconName="Download">
                                                    Descargar
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Flexible Preview Section */}
                                <div className="flex-1 p-6 pt-2 min-h-0 flex flex-col">
                                    {selectedCharge.receipt ? (
                                        (selectedCharge.receipt.file?.mimetype?.startsWith('image/') || selectedCharge.receipt.file?.mimetype === 'application/pdf') && (
                                            <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-950 relative">
                                                {previewUrl ? (
                                                    selectedCharge.receipt.file?.mimetype === 'application/pdf' ? (
                                                        <iframe
                                                            src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                                                            className="w-full h-full"
                                                            title="Vista previa PDF"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center p-4">
                                                            <img
                                                                src={previewUrl}
                                                                alt="Comprobante"
                                                                className="max-w-full max-h-full object-contain"
                                                            />
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-pulse">
                                                        <Icon name="FileText" size={32} className="mb-2 opacity-50" />
                                                        <span className="text-xs">Cargando vista previa...</span>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center h-full">
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

                                {/* Sticky Footer for Actions */}
                                {selectedCharge.status !== 'Aprobado' && selectedCharge.receipt && (
                                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 z-10 sticky bottom-0 shrink-0">
                                        <div className="flex gap-3">
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
                                    </div>
                                )}
                            </>
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
