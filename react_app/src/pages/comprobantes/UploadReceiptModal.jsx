import React, { useState } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { apiFetch } from '../../utils/api';

const UploadReceiptModal = ({ isOpen, onClose, charge, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dragging, setDragging] = useState(false);

    if (!isOpen || !charge) return null;

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            alert("Por favor selecciona un archivo.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiFetch(`/pagos/client/upload/${charge._id}`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Comprobante subido exitosamente.');
                onSuccess();
                onClose();
            } else {
                const data = await response.json();
                alert(data.error || 'Error al subir comprobante.');
            }
        } catch (error) {
            console.error("Error uploading receipt:", error);
            alert('Error al subir comprobante.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Icon name="UploadCloud" className="text-primary" />
                        Subir Comprobante
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <Icon name="X" size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Requirements Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
                        <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                            <Icon name="Info" size={20} />
                        </div>
                        <div className="text-sm text-blue-900 dark:text-blue-100">
                            <h4 className="font-bold mb-1">Requisitos de subida</h4>
                            <p className="opacity-90 leading-relaxed">
                                Para asegurar la validación de su pago, los archivos deben ser originales en formato <strong>PDF, JPG o PNG</strong>. El tiempo estimado de validación es de <strong>24 horas hábiles</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Charge Info Summary */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-2 border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500">Concepto:</span>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{charge.concept}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500">Monto:</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(charge.amount)}</span>
                        </div>
                    </div>

                    {/* File Upload Area */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${dragging ? 'border-primary bg-primary/5' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                            }`}
                    >
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {file ? (
                            <div className="flex flex-col items-center animate-in zoom-in duration-200">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                                    <Icon name="Check" size={24} />
                                </div>
                                <p className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{file.name}</p>
                                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }} className="mt-2 text-xs text-red-500 hover:underline">Eliminar</button>
                            </div>
                        ) : (
                            <>
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-3">
                                    <Icon name="Upload" size={24} />
                                </div>
                                <p className="font-medium text-slate-900 dark:text-white">Haz clic o arrastra tu archivo aquí</p>
                                <p className="text-sm text-slate-500 mt-1">PDF, JPG o PNG (Máx. 10MB)</p>
                            </>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" loading={loading} disabled={!file}>Subir Comprobante</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadReceiptModal;
