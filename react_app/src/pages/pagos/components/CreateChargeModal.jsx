import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { apiFetch } from '../../../utils/api';

const CreateChargeModal = ({ isOpen, onClose, companies, onSuccess }) => {
    const [selectedCompanies, setSelectedCompanies] = useState([]);
    const [amount, setAmount] = useState('');
    const [concept, setConcept] = useState('');
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSelectAll = () => {
        if (selectedCompanies.length === companies.length) {
            setSelectedCompanies([]);
        } else {
            setSelectedCompanies(companies.map(c => c));
        }
    };

    const toggleCompany = (company) => {
        if (selectedCompanies.find(c => c._id === company._id)) {
            setSelectedCompanies(selectedCompanies.filter(c => c._id !== company._id));
        } else {
            setSelectedCompanies([...selectedCompanies, company]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await apiFetch('/pagos/admin/generate-charges', {
                method: 'POST',
                body: JSON.stringify({
                    companies: selectedCompanies.map(c => ({ dbName: c.dbName, name: c.name })),
                    amount,
                    concept,
                    period
                })
            });

            if (response.ok) {
                alert('Cobros generados exitosamente');
                onSuccess();
                // Reset form
                setSelectedCompanies([]);
                setAmount('');
                setConcept('');
            } else {
                alert('Error al generar cobros');
            }
        } catch (error) {
            console.error(error);
            alert('Error al generar cobros');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Icon name="PlusCircle" className="text-primary" />
                        Generar Nuevo Cobro
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Icon name="X" size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    <form id="create-charge-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Concept & Period */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Concepto</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Ej: Mensualidad Febrero"
                                    value={concept}
                                    onChange={e => setConcept(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Periodo</label>
                                <input
                                    type="month"
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={period}
                                    onChange={e => setPeriod(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Monto (CLP)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="0"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Company Selection */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Seleccionar Empresas</label>
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                >
                                    {selectedCompanies.length === companies.length ? "Deseleccionar todas" : "Seleccionar todas"}
                                </button>
                            </div>

                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-800/50">
                                {companies.map(company => (
                                    <div
                                        key={company._id}
                                        onClick={() => toggleCompany(company)}
                                        className={`flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 last:border-0 cursor-pointer transition-colors ${selectedCompanies.find(c => c._id === company._id) ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedCompanies.find(c => c._id === company._id) ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                                {selectedCompanies.find(c => c._id === company._id) && <Icon name="Check" size={12} />}
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{company.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 text-right">
                                {selectedCompanies.length} empresas seleccionadas
                            </p>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" form="create-charge-form" loading={loading} disabled={selectedCompanies.length === 0}>
                        Generar Cobros
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CreateChargeModal;
