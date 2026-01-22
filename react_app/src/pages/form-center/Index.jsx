import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import FormCard from './components/FormCard';
import CategoryFilter from './components/CategoryFilter';
import SearchBar from './components/SearchBar';
import { API_BASE_URL, apiFetch } from '../../utils/api';

const FormCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [filters, setFilters] = useState({});
  const [filteredForms, setFilteredForms] = useState([]);
  const [viewMode, setViewMode] = useState('grid');

  // Estado del Sidebar - RESPONSIVE
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Paginación 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    recent: 0,
    status: {},
    section: {}
  });
  const itemsPerPage = 15;

  const [allForms, setAllForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Efecto para manejar el estado del Sidebar - RESPONSIVE
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileScreen(isMobile);

      if (isMobile) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lógica de Toggle Unificada - RESPONSIVE
  const toggleSidebar = () => {
    if (isMobileScreen) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsDesktopOpen(!isDesktopOpen);
    }
  };

  // Función de navegación
  const handleNavigation = (path) => {
    if (isMobileScreen) {
      setIsMobileOpen(false);
    }
    console.log(`Navegando a: ${path}`);
  };

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setIsLoading(true);

        const params = new URLSearchParams({
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery,
          category: activeCategory !== 'all' ? activeCategory : '',
          status: filters.status ? filters.status.join(',') : ''
        });

        Array.from(params.keys()).forEach(key => {
          if (!params.get(key)) params.delete(key);
        });

        const res = await apiFetch(`${API_BASE_URL}/forms/mini?${params.toString()}`);
        const result = await res.json();

        const rawForms = Array.isArray(result) ? result : (result.data || []);
        const total = result.total || rawForms.length;
        const pages = result.pages || 1;
        const serverStats = result.stats || { total: 0, recent: 0, status: {}, section: {} };

        setTotalItems(total);
        setTotalPages(pages);
        setStats(serverStats);

        const normalizedForms = rawForms.map(f => ({
          id: f._id,
          title: f.title || 'Sin título',
          description: f.description || '',
          category: f.category || 'general',
          icon: f.icon || 'FileText',
          primaryColor: f.primaryColor || '#3B82F6',
          status: f.status || 'borrador',
          priority: f.priority || 'medium',
          estimatedTime: f.responseTime || '1-5 min',
          fields: f.fields !== undefined ? f.fields : (f.questions ? f.questions.length : 0),
          documentsRequired: f.documentsRequired ?? false,
          tags: f.tags || [],
          companies: f.companies || [],
          lastModified: f.updatedAt ? f.updatedAt.split("T")[0] : null,
          section: f.section
        }));

        setAllForms(normalizedForms);
        // Direct set for filtered forms as filtering is now server-side (basic params)
        // Client-side filtering can still apply for complex unavailable filters if needed
        setFilteredForms(normalizedForms);

      } catch (err) {
        console.error('Error cargando formularios:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForms();
  }, [currentPage, searchQuery, activeCategory, filters.status]); // Trigger on pagination/filter change

  // Client-side extra filtering (only for things not handled by Server)
  useEffect(() => {
    if (allForms.length === 0) {
      setFilteredForms([]);
      return;
    }

    let filtered = [...allForms];
    // Removed activeCategory and SearchQuery filtering here, as they are server-side now.
    // Kept basic filters that might not be fully server implemented yet or are strictly client-side view logic

    if (filters.isRecent) {
      filtered = filtered.filter(form => {
        if (!form.lastModified) return false;
        const lastModDate = new Date(form.lastModified);
        const now = new Date();
        return (now - lastModDate) <= 7 * 24 * 60 * 60 * 1000;
      });
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(form => filters.priority.includes(form.priority));
    }

    if (filters.documentsRequired) {
      filtered = filtered.filter(form => form.documentsRequired);
    }

    // Check if we need to update state to avoid infinite loop -> only if length/content changed fundamentally
    setFilteredForms(filtered);

  }, [filters.isRecent, filters.priority, filters.documentsRequired, allForms]); // REMOVED searchQuery, activeCategory etc.

  const categories = [
    { id: 'all', name: 'Todos', count: stats.total || 0 },
    { id: 'Remuneraciones', name: 'Remuneraciones', count: stats.section['Remuneraciones'] || 0 },
    { id: 'Anexos', name: 'Anexos', count: stats.section['Anexos'] || 0 },
    { id: 'Finiquitos', name: 'Finiquitos', count: stats.section['Finiquitos'] || 0 },
    { id: 'Otras', name: 'Otras', count: stats.section['Otras'] || 0 }
  ];

  const handleFormSelect = (form) => {
    console.log('Selected form:', form);
    alert(`Opening form: ${form.title}`);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset page on search
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setCurrentPage(1); // Reset page on filter
  };

  const handleStatusFilter = (statusValue) => {
    setFilters(prevFilters => {
      const currentStatus = prevFilters.status || [];
      const isAlreadyActive = currentStatus.includes(statusValue);

      const newStatus = isAlreadyActive ? [] : [statusValue];

      return {
        ...prevFilters,
        status: newStatus,
        search: '',
        activeCategory: 'all',
        isRecent: false
      };
    });
    setCurrentPage(1); // Reset page
  };

  const handleRecentFilter = () => {
    setFilters(prevFilters => ({
      ...prevFilters,
      isRecent: !prevFilters.isRecent,
      status: [],
      search: '',
      activeCategory: 'all'
    }));
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  const borradorCount = stats.status['borrador'] || 0;
  const publicadoCount = stats.status['publicado'] || 0;
  const recentCount = stats.recent || 0;

  // Clase de Margen para el contenido principal - RESPONSIVE
  const mainMarginClass = isMobileScreen
    ? 'ml-0'
    : isDesktopOpen ? 'lg:ml-64' : 'lg:ml-16';

  const isStatusFilterActive = (statusValue) => filters.status && filters.status.includes(statusValue);

  // Handlers de Paginación
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(curr => curr + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(curr => curr - 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* IMPLEMENTACIÓN UNIFICADA DEL SIDEBAR - RESPONSIVE */}
      {(isMobileOpen || !isMobileScreen) && (
        <>
          <Sidebar
            isCollapsed={!isDesktopOpen}
            onToggleCollapse={toggleSidebar}
            isMobileOpen={isMobileOpen}
            onNavigate={handleNavigation}
          />

          {isMobileScreen && isMobileOpen && (
            <div
              className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
              onClick={toggleSidebar}
            ></div>
          )}
        </>
      )}

      {/* Botón flotante para móvil - MEJORADO */}
      {!isMobileOpen && isMobileScreen && (
        <div className="fixed bottom-4 left-4 z-50">
          <Button
            variant="default"
            size="icon"
            onClick={toggleSidebar}
            iconName="Menu"
            className="w-12 h-12 rounded-full shadow-brand-active"
          />
        </div>
      )}

      {/* Contenido Principal - RESPONSIVE */}
      <main className={`transition-all duration-300 ${mainMarginClass} pt-24 lg:pt-20`}>
        <div className="px-4 sm:px-6 lg:p-6 space-y-4 lg:space-y-8 max-w-7xl mx-auto">
          <div className="space-y-3 lg:space-y-4">

            {/* Título y Botones - RESPONSIVE */}
            <div className="flex flex-col md:flex-row md:items-center justify-between items-center text-center md:items-stretch md:text-left">
              <div className="mb-3 md:mb-0 min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Gestión de Formularios</h1>
                <p className="text-muted-foreground mt-1 text-xs sm:text-sm lg:text-base">
                  Administración y gestión de formularios
                </p>
              </div>

              <div className="flex items-center space-x-2 lg:space-x-3 flex-wrap justify-center md:justify-end">
                {/* Botón de toggle del sidebar en desktop - RESPONSIVE */}
                <div className="hidden lg:flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    iconName={isDesktopOpen ? "PanelLeftClose" : "PanelLeftOpen"}
                    iconSize={20}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleViewMode}
                  iconName={viewMode === 'grid' ? 'List' : 'Grid3X3'}
                  iconPosition="left"
                  iconSize={16}
                  className="mb-2 md:mb-0 text-xs sm:text-sm"
                >
                  {viewMode === 'grid' ? 'Lista' : 'Tabla'}
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  iconName="Plus"
                  iconPosition="left"
                  iconSize={16}
                  onClick={() => window.location.href = "/form-builder"}
                  className="mb-2 md:mb-0 text-xs sm:text-sm"
                >
                  Crear Formulario
                </Button>
              </div>
            </div>

            {/* Tarjetas de Resumen - RESPONSIVE */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

              {/* Tarjeta 1: Todos los Formularios */}
              <div className={`bg-card border rounded-lg p-3 sm:p-4 cursor-pointer transition-all duration-300
                            ${!isStatusFilterActive('borrador') && !isStatusFilterActive('publicado') && !filters.isRecent ? 'border-primary shadow-lg' : 'border-border hover:shadow-md'}`}
                onClick={() => setFilters({ status: [] })}>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg min-touch-target">
                    <Icon name="FileText" size={16} className="text-primary sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats.total || 0}</p>
                    <p className="text-xs text-muted-foreground leading-tight">Formularios Disponibles</p>
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Borradores */}
              <div className={`bg-card border rounded-lg p-3 sm:p-4 cursor-pointer transition-all duration-300
                            ${isStatusFilterActive('borrador') ? 'border-warning shadow-lg' : 'border-border hover:shadow-md'}`}
                onClick={() => handleStatusFilter("borrador")}>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-2 bg-warning/10 rounded-lg min-touch-target">
                    <Icon name="Edit" size={16} className="text-warning sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{borradorCount}</p>
                    <p className="text-xs text-muted-foreground leading-tight">Borradores</p>
                  </div>
                </div>
              </div>

              {/* Tarjeta 3: Publicados */}
              <div className={`bg-card border rounded-lg p-3 sm:p-4 cursor-pointer transition-all duration-300
                            ${isStatusFilterActive('publicado') ? 'border-secondary shadow-lg' : 'border-border hover:shadow-md'}`}
                onClick={() => handleStatusFilter("publicado")}>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-2 bg-secondary/10 rounded-lg min-touch-target">
                    <Icon name="Clock" size={16} className="text-secondary sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                      {publicadoCount}
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight">Formularios publicados</p>
                  </div>
                </div>
              </div>

              {/* Tarjeta 4: Modificaciones Recientes */}
              <div className={`bg-card border rounded-lg p-3 sm:p-4 cursor-pointer transition-all duration-300
                            ${filters.isRecent ? 'border-success shadow-lg' : 'border-border hover:shadow-md'}`}
                onClick={handleRecentFilter}>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-2 bg-success/10 rounded-lg min-touch-target">
                    <Icon name="CheckCircle" size={16} className="text-success sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{recentCount}</p>
                    <p className="text-xs text-muted-foreground leading-tight">Modificaciones esta semana</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 lg:space-y-4">
            <SearchBar
              onSearch={handleSearch}
            />

            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          <div className="space-y-4 lg:space-y-6">
            {isLoading ? (
              <div className="text-center py-8 lg:py-12">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
                  <Icon name="Loader" size={20} className="text-muted-foreground animate-spin lg:w-6 lg:h-6" />
                </div>
                <h3 className="text-base lg:text-lg font-medium text-foreground mb-2">Cargando formularios...</h3>
              </div>
            ) : (
              <div className="space-y-3 lg:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <h3 className="text-base lg:text-lg font-semibold text-foreground">
                    Formularios ({filteredForms.length})
                  </h3>

                  {searchQuery && (
                    <div className="text-sm text-muted-foreground">
                      Resultados de "{searchQuery}"
                    </div>
                  )}
                </div>

                {filteredForms.length === 0 ? (
                  <div className="text-center py-8 lg:py-12">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
                      <Icon name="Search" size={20} className="text-muted-foreground lg:w-6 lg:h-6" />
                    </div>
                    <h3 className="text-base lg:text-lg font-medium text-foreground mb-2">No se encontraron Formularios</h3>
                    <p className="text-muted-foreground mb-4 text-sm lg:text-base">
                      Prueba a ajustar los criterios de búsqueda y filtrado
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategory('all');
                        setFilters({});
                      }}
                      size="sm"
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                ) : (
                  <div className={viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6'
                    : 'space-y-3 lg:space-y-4'
                  }>
                    {filteredForms.map((form) => (
                      <FormCard
                        key={form.id}
                        form={form}
                        onSelect={handleFormSelect}
                        className={viewMode === 'list' ? 'w-full' : ''}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CONTROL DE PAGINACIÓN */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 pt-4 pb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={currentPage === 1}
                iconName="ChevronLeft"
                iconSize={16}
              >
                Anterior
              </Button>
              <span className="text-sm font-medium text-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={currentPage === totalPages}
                iconName="ChevronRight"
                iconSize={16}
                iconPosition="right"
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FormCenter;