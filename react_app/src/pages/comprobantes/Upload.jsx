import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Button from "../../components/ui/Button";
import { apiFetch } from '../../utils/api';

const UploadComprobante = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [concept, setConcept] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('amount', amount);
            formData.append('date', date);
            formData.append('concept', concept);

            await apiFetch('/pagos/upload', {
                method: 'POST',
                body: formData
            });

            navigate('/comprobantes');
        } catch (error) {
            console.error("Error uploading comprobante:", error);
            alert("Error al subir el comprobante");
        } finally {
            setLoading(false);
        }
    };

    // State for sidebar and mobile view
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 1024); // lg breakpoint

    useEffect(() => {
        const handleResize = () => {
            setIsMobileScreen(window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        if (isMobileScreen) {
            setIsMobileOpen(!isMobileOpen);
        } else {
            setSidebarCollapsed(!sidebarCollapsed);
        }
    };

    const handleNavigation = (path) => {
        navigate(path);
        if (isMobileScreen) {
            setIsMobileOpen(false); // Close sidebar on mobile after navigation
        }
    };

    const mainMarginClass = isMobileScreen
        ? 'ml-0'
        : sidebarCollapsed
            ? 'lg:ml-[72px]' // Collapsed sidebar width
            : 'lg:ml-[280px]'; // Expanded sidebar width

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
                <div className="px-4 sm:px-6 lg:p-6 space-y-6 max-w-3xl mx-auto flex flex-col justify-center min-h-[80vh]">

                    <div className="flex items-center gap-2 mb-2 text-sm group cursor-pointer w-fit" onClick={() => navigate('/comprobantes')}>
                        <Icon name="ArrowLeft" className="text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors" size={18} />
                        <span className="text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors font-medium">Volver a mis facturas</span>
                    </div>

                    <div className="flex flex-col gap-2 mb-6">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Subir Comprobante</h1>
                        <p className="text-slate-600 dark:text-slate-400 text-lg">Carga los detalles de tu transferencia para procesar el pago.</p>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl flex items-start gap-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                            <Icon name="Info" size={20} />
                        </div>
                        <div>
                            <h3 className="text-blue-900 dark:text-blue-100 text-sm font-semibold">Requisitos de subida</h3>
                            <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                                Archivos <span className="font-semibold">PDF, JPG o PNG</span>. Validación en <span className="font-semibold">24 horas hábiles</span>.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 md:p-8 rounded-xl shadow-sm space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Icon name="FileText" className="text-primary" size={16} />
                                    Factura o Concepto
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg h-12 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                                        placeholder="Ej: Pago Factura #123"
                                        value={concept}
                                        onChange={(e) => setConcept(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Icon name="DollarSign" className="text-primary" size={16} />
                                        Monto del pago
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
                                        <input
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg h-12 pl-9 pr-4 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                                            placeholder="0.00"
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Icon name="Calendar" className="text-primary" size={16} />
                                        Fecha de pago
                                    </label>
                                    <div className="relative">
                                        <input
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg h-12 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Icon name="Upload" className="text-primary" size={16} />
                                    Archivo del Comprobante
                                </label>
                                <div
                                    className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/50 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
                                    onClick={() => document.getElementById('file-upload').click()}
                                >
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Icon name="CloudUpload" className="text-primary" size={24} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-900 dark:text-white font-medium text-sm">Haz clic para subir o arrastra el archivo</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Soporta PDF, JPG o PNG (Máx 10MB)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* File Preview */}
                        {file && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
                                        <Icon name="FileText" className="text-primary" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{file.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB • Listo para subir</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="size-8 flex items-center justify-center rounded-full hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all"
                                >
                                    <Icon name="Trash2" size={16} />
                                </button>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !file || !amount || !date || !concept}
                                className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-sm active:scale-[0.98] text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading && <Icon name="Loader2" className="animate-spin" size={16} />}
                                {loading ? "Enviando..." : "Finalizar y Enviar"}
                            </button>
                            <button
                                onClick={() => navigate('/comprobantes')}
                                className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm"
                            >
                                Cancelar
                            </button>
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
        </div>
    );
};

export default UploadComprobante;
