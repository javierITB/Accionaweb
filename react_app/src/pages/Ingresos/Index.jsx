import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Button from '../../components/ui/Button';
import { Navigate } from 'react-router-dom';
import { Search, X, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'; 

const CompanyReg = ({ userPermissions = [] }) => {
  const [logins, setLogins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ESTADO DE ORDENAMIENTO
  const [sortConfig, setSortConfig] = useState({ key: 'now', direction: 'desc' });

  // ESTADOS DEL SIDEBAR
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileScreen(isMobile);
      if (isMobile) setIsMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchLogins = async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/auth/logins/todos`);
      if (response.ok) {
        const loginsData = await response.json();
        setLogins(loginsData);
      }
    } catch (error) {
      console.error('Error cargando logins:', error);
    }
  };

  useEffect(() => {
    fetchLogins();
  }, []);

  // FUNCIÓN PARA CAMBIAR EL ORDEN
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // LÓGICA DE FILTRADO Y ORDENAMIENTO COMBINADA
  const processedLogins = useMemo(() => {
    // 1. Filtrar primero
    let filtered = logins.filter((item) => {
      if (item.nombre === "Todas") return false;
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;

      const searchableString = `
        ${item.usr?.name} ${item.usr?.email} ${item.usr?.cargo} 
        ${item.ipAddress} ${item.browser} ${item.os} ${item.now}
      `.toLowerCase();
      return searchableString.includes(term);
    });

    // 2. Ordenar después
    if (sortConfig.key !== null) {
      filtered.sort((a, b) => {
        // Acceso a datos anidados si es necesario (ej: 'usr.name')
        const getNestedValue = (obj, path) => {
          return path.split('.').reduce((acc, part) => acc && acc[part], obj);
        };

        let aValue = getNestedValue(a, sortConfig.key) || '';
        let bValue = getNestedValue(b, sortConfig.key) || '';

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [logins, searchTerm, sortConfig]);

  const canAccess = userPermissions.includes('view_registro_ingresos');
  if (!canAccess) return <Navigate to="/panel" replace />;

  // Helper para renderizar iconos de orden
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="ml-1 h-4 w-4 text-primary" /> 
      : <ChevronDown className="ml-1 h-4 w-4 text-primary" />;
  };

  const getTabContent = () => {
    const columns = [
      { label: 'Nombre', key: 'usr.name' },
      { label: 'Email', key: 'usr.email' },
      { label: 'Cargo', key: 'usr.cargo' },
      { label: 'IP', key: 'ipAddress' },
      { label: 'Navegador', key: 'browser' },
      { label: 'S.O.', key: 'os' },
      { label: 'Fecha Ingreso', key: 'now' },
    ];

    return (
      <div className="space-y-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrar por palabra clave..."
            className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                {columns.map((col) => (
                  <th 
                    key={col.key}
                    onClick={() => requestSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center">
                      {col.label}
                      {getSortIcon(col.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {processedLogins.map((empresa) => (
                <tr key={empresa._id} className="hover:bg-muted/30 transition-colors">
                  <td onClick={() => setSearchTerm(empresa.usr.name)} className="px-4 py-3 text-sm font-medium cursor-pointer hover:text-primary">{empresa.usr.name}</td>
                  <td onClick={() => setSearchTerm(empresa.usr.email)} className="px-4 py-3 text-sm cursor-pointer hover:text-primary">{empresa.usr.email}</td>
                  <td onClick={() => setSearchTerm(empresa.usr.cargo)} className="px-4 py-3 text-sm cursor-pointer hover:text-primary">{empresa.usr.cargo || '—'}</td>
                  <td onClick={() => setSearchTerm(empresa.ipAddress)} className="px-4 py-3 text-sm font-mono cursor-pointer hover:text-primary">{empresa.ipAddress || '—'}</td>
                  <td onClick={() => setSearchTerm(empresa.browser)} className="px-4 py-3 text-sm cursor-pointer hover:text-primary">{empresa.browser || '—'}</td>
                  <td onClick={() => setSearchTerm(empresa.os)} className="px-4 py-3 text-sm cursor-pointer hover:text-primary">{empresa.os || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {empresa.now ? empresa.now.replace("T", " ").split(".")[0] : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const mainMarginClass = isMobileScreen ? 'ml-0' : isDesktopOpen ? 'ml-64' : 'ml-16';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar 
        isCollapsed={!isDesktopOpen} 
        onToggleCollapse={() => isMobileScreen ? setIsMobileOpen(!isMobileOpen) : setIsDesktopOpen(!isDesktopOpen)} 
        isMobileOpen={isMobileOpen} 
      />
      <main className={`transition-all duration-300 ${mainMarginClass} pt-4 lg:pt-8`}>
        <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Registro de Logins</h1>
            <p className="text-muted-foreground text-sm">Haz clic en los encabezados para ordenar o en las celdas para filtrar.</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm">
            {getTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanyReg;