import React, { useState, useEffect, memo, useCallback } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import RequestCard from './components/RequestCard';
import FilterPanel from './components/FilterPanel';
import MessageModal from './components/MessageModal';
import RequestDetails from './components/RequestDetails';
import StatsOverview from './components/StatsOverview';

// --- FUNCIÓN PARA OBTENER DATOS DEL ADMIN DESDE SESSION STORAGE ---
const getAdminData = () => {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const cargo = sessionStorage.getItem('cargo');
    const email = sessionStorage.getItem('email');
    const token = sessionStorage.getItem('token');
    const nombre = sessionStorage.getItem('user'); 
    const uid = sessionStorage.getItem('uid'); 
    const empresa = sessionStorage.getItem('empresa'); 
    
    if (token && uid && nombre) {
      return {
        uid: uid,
        nombre: nombre,
        mail: email,
        token: token,
        cargo: cargo,
        empresa: empresa || 'Admin'
      };
    }
  }
  return null;
};
// --- FIN FUNCIÓN PARA OBTENER DATOS DEL ADMIN ---

// --- COMPONENTE SIMULADO PARA INYECCIÓN (MODAL) ---
// **ESTE COMPONENTE DEBE SER REEMPLAZADO POR TU MODAL REAL DE FORMULARIO**
const InjectRequestModal = ({ isOpen, onClose, onSubmit, forms }) => {
    // Usamos datos predeterminados basados en tu estructura de formulario para el ejemplo
    const FORM_ID = '692dbd48cbdccb42fb466c22'; 
    const FORM_TITLE = 'Solicitud para Cliente';
    const [formData, setFormData] = useState({
        formId: FORM_ID, 
        formTitle: FORM_TITLE,
        responses: {
            Destinatario: 'Joanis', // Nombre que debe coincidir con un usuario en la DB
            EmpresaDestino: 'MINIMRKET KAMI 2024 SPA', // Empresa que debe coincidir con un usuario en la DB
            Asunto: 'Solicitud Administrativa Inyectada',
            Mensaje: 'Por favor, revise y responda esta solicitud.',
        },
        adjuntos: [], // Nombres de archivo para el payload del backend
        files: [], // Objetos File para la subida real
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            responses: {
                ...prev.responses,
                [name]: value
            }
        }));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFormData(prev => ({
            ...prev,
            files: selectedFiles,
            // Preparamos el array 'adjuntos' con los nombres para el payload inicial
            adjuntos: selectedFiles.map(f => f.name) 
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">Inyectar Solicitud: {FORM_TITLE}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campos de simulación para el destinatario y el contenido */}
                    <input type="hidden" name="formId" value={formData.formId} />
                    
                    <label className="block">Destinatario (Nombre):
                        <input type="text" name="Destinatario" value={formData.responses.Destinatario} onChange={handleChange} required className="w-full p-2 border rounded" />
                    </label>
                    <label className="block">Destinatario (Empresa):
                        <input type="text" name="EmpresaDestino" value={formData.responses.EmpresaDestino} onChange={handleChange} required className="w-full p-2 border rounded" />
                    </label>
                    <label className="block">Asunto:
                        <input type="text" name="Asunto" value={formData.responses.Asunto} onChange={handleChange} required className="w-full p-2 border rounded" />
                    </label>
                    <label className="block">Mensaje:
                        <textarea name="Mensaje" value={formData.responses.Mensaje} onChange={handleChange} required className="w-full p-2 border rounded"></textarea>
                    </label>

                    {/* Manejo de archivos múltiples */}
                    <label className="block">Adjuntar Archivos (Múltiple):
                        <input type="file" multiple onChange={handleFileChange} className="w-full p-2 border rounded" />
                        <p className="text-sm text-gray-500 mt-1">{formData.files.length} archivo(s) seleccionado(s).</p>
                    </label>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" variant="default">Inyectar Solicitud</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
// --- FIN COMPONENTE SIMULADO PARA INYECCIÓN ---


const RequestTracking = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [resp, setResp] = useState([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [messageRequest, setMessageRequest] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [allForms, setAllForms] = useState([]); // Nuevo estado para los forms
  const [showInjectModal, setShowInjectModal] = useState(false); // Nuevo estado para el modal

  const [filters, setFilters] = useState({
    search: '', status: '', category: '', priority: '', dateRange: '', 
    startDate: '', endDate: '', assignedTo: '', submittedBy: ''
  });

  const [data, setData] = useState({ forms: [], resp: [] });


  // --- FUNCIÓN DE SUBIDA DE ARCHIVOS ---
  const handleUploadFiles = async (responseId, files, adminToken) => {
      // Asumo que el endpoint de subida espera el ID en la URL
      const UPLOAD_ENDPOINT = `https://back-acciona.vercel.app/api/adjuntos/upload/${responseId}`; 

      for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          
          const res = await fetch(UPLOAD_ENDPOINT, {
              method: 'POST',
              headers: {
                  // El Authorization es crucial para que el backend valide al admin en la subida
                  'Authorization': `Bearer ${adminToken}`, 
              },
              body: formData,
          });

          if (!res.ok) {
              const errorResult = await res.json();
              throw new Error(`Error al subir el archivo ${file.name}: ${errorResult.error || res.statusText}`);
          }
      }
  };


  // --- FUNCIÓN PRINCIPAL DE INYECCIÓN ---
  const handleInjectRequest = async (dataToInject) => {
    const adminUser = getAdminData();

    if (!adminUser) {
        alert("Error: Sesión de administrador no encontrada. Por favor, inicie sesión.");
        return;
    }

    const { files, adjuntos, ...restOfData } = dataToInject;

    // 1. Construir el Payload para guardar la respuesta (incluye solo nombres de archivo)
    const payload = {
        ...restOfData,
        adjuntos: adjuntos, // Array de nombres de archivo
        user: adminUser // El objeto del administrador (para validación)
    };
    
    let insertedId = null;

    try {
        setIsLoading(true);
        // POST al endpoint de administrador para guardar la respuesta principal
        const res = await fetch('https://back-acciona.vercel.app/api/respuestas/admin', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.error || 'Error al inyectar la solicitud en el backend.');
        }

        insertedId = result._id;

        // 2. Si hay archivos, subirlos usando el ID de la respuesta
        if (files && files.length > 0) {
            await handleUploadFiles(insertedId, files, adminUser.token);
        }

        alert(`Solicitud inyectada correctamente para ${dataToInject.responses.Destinatario}.`);
        setShowInjectModal(false);
        fetchForms(); // Recargar la lista de solicitudes

    } catch (err) {
        console.error("Error al inyectar solicitud:", err);
        alert(`Fallo en la inyección (ID: ${insertedId || 'pendiente'}): ${err.message}`);
    } finally {
        setIsLoading(false);
    }
  };
  // --- FIN FUNCIÓN PRINCIPAL DE INYECCIÓN ---


  // --- FETCH DE DATOS (ACTUALIZADO) ---
  const fetchForms = useCallback(async () => {
    let active = true; 
    try {
      setIsLoading(true);

      const controller = new AbortController();
      const signal = controller.signal;

      // 1) Traer formularios y respuestas en paralelo
      const [ resForms, resResp] = await Promise.all([
        fetch('https://back-acciona.vercel.app/api/forms/', { signal }),
        fetch('https://back-acciona.vercel.app/api/respuestas/', { signal }) // Asumo este endpoint
      ]);

      if (!resForms.ok || !resResp.ok) {
        throw new Error('Error al obtener datos del servidor');
      }

      const [forms, responses] = await Promise.all([resForms.json(), resResp.json()]);

      // Lógica de normalización
      const formsMap = new Map(forms.map(form => [form._id, form]));
      const normalized = responses.map(response => ({
          ...response,
          // Añadir lógica de submittedDate, submittedBy, etc.
          formTitle: formsMap.get(response.formId)?.title || response.formTitle,
          submittedDate: response.createdAt || new Date(0), // Asegurar un valor
          submittedBy: response.user?.nombre || 'Desconocido',
          // ... mapeo de otros campos necesarios para RequestCard y filtros
      }));
      // Fin Lógica de normalización

      if (active) {
        setAllForms(forms); // Guardar todos los forms para el modal
        setResp(normalized);
      }

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error cargando formularios:', err);
      }
    } finally {
      if (active) {
        setIsLoading(false);
      }
    }
    return () => { active = false; };
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);


  // ... (Mock timeline data, mock stats data, filteredRequests, y sortOptions) ...
  const mockTimeline = [/* ... */];
  const mockStats = { /* ... */ };
  const filteredRequests = resp?.filter(request => { /* ... */ })?.sort((a, b) => { /* ... */ });


  const handleRemove = async (request) => { /* ... */ };
  const handleViewDetails = (request) => { /* ... */ };
  const handleSendMessage = (request) => { /* ... */ };
  const handleSendMessageSubmit = async (messageData) => { /* ... */ };
  const handleClearFilters = () => { /* ... */ };


  const sortOptions = [
    { value: 'date', label: 'Fecha' },
    { value: 'title', label: 'Título' },
    { value: 'status', label: 'Estado' },
    { value: 'priority', label: 'Prioridad' }
  ];


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)
      } />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} pt-16`}>
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Seguimiento de Solicitudes</h1>
              <p className="text-muted-foreground mt-1">
                Monitorea el estado de todas tus solicitudes con cronología detallada
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* BOTÓN PARA ABRIR EL MODAL DE INYECCIÓN */}
              <Button
                variant="default"
                onClick={() => setShowInjectModal(true)}
                iconName="Plus"
                iconSize={20}
              >
                Inyectar Solicitud
              </Button>
              {/* FIN BOTÓN */}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                iconName={sidebarCollapsed ? "PanelLeftOpen" : "PanelLeftClose"}
                iconSize={20}
              />
            </div>
          </div>

          {/* Stats Overview */}
          <StatsOverview stats={mockStats} />

          {/* Filters */}
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={handleClearFilters}
            isVisible={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          />

          {/* Controls */}
          <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Vista:</span>
                <div className="flex items-center border border-border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    iconName="Grid3X3"
                    iconSize={16}
                    className="rounded-r-none"
                  />
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    iconName="List"
                    iconSize={16}
                    className="rounded-l-none border-l"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e?.target?.value)}
                  className="px-3 py-1 border border-border rounded-md text-sm bg-input text-foreground"
                >
                  {sortOptions?.map(option => (
                    <option key={option?.value} value={option?.value}>
                      {option?.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  iconName={sortOrder === 'asc' ? "ArrowUp" : "ArrowDown"}
                  iconSize={16}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Icon name="FileText" size={16} />
              <span>{filteredRequests?.length} solicitudes encontradas</span>
            </div>
          </div>

          {/* Requests List - CORREGIDO */}
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {isLoading ? (
                <div className="text-center py-12 col-span-full">Cargando solicitudes...</div>
            ) : filteredRequests?.length > 0 ? (
              filteredRequests?.map((request) => (
                <RequestCard
                  key={request?._id || request?.id}
                  request={request}
                  onRemove={handleRemove}
                  onViewDetails={handleViewDetails}
                  onSendMessage={handleSendMessage}
                  viewMode={viewMode} // Pasar el viewMode al componente
                />
              ))
            ) : (
              <div className="text-center py-12 bg-card border border-border rounded-lg col-span-full">
                <Icon name="Search" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron solicitudes</h3>
                <p className="text-muted-foreground mb-4">
                  Intenta ajustar los filtros o crear una nueva solicitud
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
      {/* Modals */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        request={messageRequest}
        onSendMessage={handleSendMessageSubmit}
      />
      <RequestDetails
        request={selectedRequest}
        isVisible={showRequestDetails}
        onClose={() => setShowRequestDetails(false)}
      />
      
      {/* --- MODAL DE INYECCIÓN --- */}
      <InjectRequestModal
        isOpen={showInjectModal}
        onClose={() => setShowInjectModal(false)}
        onSubmit={handleInjectRequest}
        forms={allForms}
      />
    </div>
  );
};

export default memo(RequestTracking);