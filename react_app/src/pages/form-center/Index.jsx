import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header'; 
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button'; 
import FormCard from './components/FormCard';
import CategoryFilter from './components/CategoryFilter';
import SearchBar from './components/SearchBar';

const FormCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [filters, setFilters] = useState({});
  const [filteredForms, setFilteredForms] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  
  // Estado del Sidebar - ACTUALIZADO
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

  const [allForms, setAllForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Efecto para manejar el estado del Sidebar - ACTUALIZADO
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
  
  // Lógica de Toggle Unificada - ACTUALIZADA
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
        const res = await fetch('https://accionaapi.vercel.app/api/forms');
        const data = await res.json();

        const normalizedForms = data.map(f => ({
          id: f._id,
          title: f.title || 'Sin título',
          description: f.description || '',
          category: f.category || 'general',
          icon: f.icon || 'FileText',
          primaryColor: f.primaryColor || '#3B82F6',
          status: f.status || 'borrador',
          priority: f.priority || 'medium',
          estimatedTime: f.responseTime || '1-5 min',
          fields: f.questions ? f.questions.length : 0,
          documentsRequired: f.documentsRequired ?? false,
          tags: f.tags || [],
          companies: f.companies || [],
          lastModified: f.updatedAt ? f.updatedAt.split("T")[0] : null,
          section: f.section
        }));

        setAllForms(normalizedForms);
      } catch (err) {
        console.error('Error cargando formularios:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForms();
  }, []);

  useEffect(() => {
    if (allForms.length === 0) {
      setFilteredForms([]);
      return;
    }

    let filtered = [...allForms];

    if (activeCategory !== 'all') {
      filtered = filtered.filter(form => form.section === activeCategory); 
    }

    if (searchQuery) {
      filtered = filtered.filter(form =>
        form.title?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        form.description?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        form.category?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        form.tags?.some(tag => tag?.toLowerCase()?.includes(searchQuery?.toLowerCase()))
      );
    }
    
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(form => filters.status.includes(form.status));
    }
    
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

    if (filters.recentlyUsed) {
      filtered = filtered.filter(form => form.lastModified);
    }

    setFilteredForms(filtered);
  }, [searchQuery, activeCategory, filters, allForms]);

  const categories = [
    { id: 'all', name: 'Todos', count: allForms.length },
    { id: 'Remuneraciones', name: 'Remuneraciones', count: allForms.filter(f => f.section === 'Remuneraciones').length },
    { id: 'Anexos', name: 'Anexos', count: allForms.filter(f => f.section === 'Anexos').length },
    { id: 'Finiquitos', name: 'Finiquitos', count: allForms.filter(f => f.section === 'Finiquitos').length },
    { id: 'Otras', name: 'Otras', count: allForms.filter(f => f.section === 'Otras').length }
  ];

  const handleFormSelect = (form) => {
    console.log('Selected form:', form);
    alert(`Opening form: ${form.title}`);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
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

  const borradorCount = allForms.filter(f => f.status === 'borrador').length;
  const publicadoCount = allForms.filter(f => f.status === 'publicado').length;
  
  const recentCount = allForms.filter(f => {
    if (!f.lastModified) return false;
    const lastModDate = new Date(f.lastModified);
    const now = new Date();
    return (now - lastModDate) <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  
  // Clase de Margen para el contenido principal - ACTUALIZADA
  const mainMarginClass = isMobileScreen 
    ? 'ml-0'
    : isDesktopOpen ? 'ml-64' : 'ml-16';
  
  const isStatusFilterActive = (statusValue) => filters.status && filters.status.includes(statusValue);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* IMPLEMENTACIÓN UNIFICADA DEL SIDEBAR - ACTUALIZADA */}
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
              className="fixed inset-0 bg-foreground/50 z-40" 
              onClick={toggleSidebar}
            ></div>
          )}
        </>
      )}

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

      {/* Contenido Principal - ACTUALIZADO */}
      <main className={`transition-all duration-300 ${mainMarginClass} pt-20 md:pt-16`}>
        <div className="container-main p-6 space-y-8">
          <div className="space-y-4">
            
            {/* Título y Botones - CON BOTÓN DE TOGGLE AGREGADO */}
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestion de Formularios</h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                  Administración y gestion de formularios
                </p>
              </div>

              <div className="flex items-center space-x-2 md:space-x-3 flex-wrap">
                {/* Botón de toggle del sidebar en desktop - AGREGADO */}
                <div className="hidden md:flex items-center">
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
                  size="default"
                  onClick={toggleViewMode}
                  iconName={viewMode === 'grid' ? 'List' : 'Grid3X3'}
                  iconPosition="left"
                  iconSize={18}
                  className="mb-2 md:mb-0"
                >
                  {viewMode === 'grid' ? 'Lista' : 'Tabla'}
                </Button>

                <Button
                  variant="default"
                  size="default"
                  iconName="Plus"
                  iconPosition="left"
                  iconSize={18}
                  onClick={() => window.location.href = "/form-builder"}
                  className="mb-2 md:mb-0"
                >
                  Crear Formulario
                </Button>
              </div>
            </div>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Tarjeta 1: Todos los Formularios (Limpiar Filtros) */}
              <div className={`bg-card border rounded-lg p-4 cursor-pointer transition-all duration-300
                            ${!isStatusFilterActive('borrador') && !isStatusFilterActive('publicado') && !filters.isRecent ? 'border-primary shadow-lg' : 'border-border hover:shadow-md'}`}
                   onClick={() => setFilters({ status: [] })}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg min-touch-target">
                    <Icon name="FileText" size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-foreground">{allForms.length}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Formularios Disponibles</p>
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Borradores */}
              <div className={`bg-card border rounded-lg p-4 cursor-pointer transition-all duration-300
                            ${isStatusFilterActive('borrador') ? 'border-warning shadow-lg' : 'border-border hover:shadow-md'}`}
                   onClick={() => handleStatusFilter("borrador")}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-warning/10 rounded-lg min-touch-target">
                    <Icon name="Edit" size={20} className="text-warning" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-foreground">{borradorCount}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Borradores</p>
                  </div>
                </div>
              </div>

              {/* Tarjeta 3: Publicados */}
              <div className={`bg-card border rounded-lg p-4 cursor-pointer transition-all duration-300
                            ${isStatusFilterActive('publicado') ? 'border-secondary shadow-lg' : 'border-border hover:shadow-md'}`}
                   onClick={() => handleStatusFilter("publicado")}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-secondary/10 rounded-lg min-touch-target">
                    <Icon name="Clock" size={20} className="text-secondary" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-foreground">
                      {publicadoCount}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">Formularios publicados</p>
                  </div>
                </div>
              </div>

              {/* Tarjeta 4: Modificaciones Recientes (Filtro por Fecha) */}
              <div className={`bg-card border rounded-lg p-4 cursor-pointer transition-all duration-300
                            ${filters.isRecent ? 'border-success shadow-lg' : 'border-border hover:shadow-md'}`}
                   onClick={handleRecentFilter}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-success/10 rounded-lg min-touch-target">
                    <Icon name="CheckCircle" size={20} className="text-success" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-foreground">{recentCount}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Modificaciones esta semana</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <SearchBar
              onSearch={handleSearch}
            />

            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className='lg:col-span-4'>
              <div className="space-y-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon name="Loader" size={24} className="text-muted-foreground animate-spin" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Cargando formularios...</h3>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">
                        Formularios ({filteredForms.length})
                      </h3>

                      {searchQuery && (
                        <div className="text-sm text-muted-foreground">
                          Resultados de "{searchQuery}"
                        </div>
                      )}
                    </div>

                    {filteredForms.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon name="Search" size={24} className="text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">No se encontraron Formularios</h3>
                        <p className="text-muted-foreground mb-4">
                          prueba a ajustar los criterios de busqueda y filtrado
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchQuery('');
                            setActiveCategory('all');
                            setFilters({});
                          }}
                        >
                          Limpiar Filtros
                        </Button>
                      </div>
                    ) : (
                      <div className={viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                        : 'space-y-4'
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FormCenter;