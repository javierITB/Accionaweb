import React, { useState, useEffect } from 'react';
// Ajuste de rutas: Mantenemos el patrón original, pero en un entorno de compilación
// donde todas las rutas absolutas fallan, es posible que solo necesitemos ajustar el nivel.
// Aquí asumimos que las rutas originales eran correctas y que el error es transitorio,
// pero corregimos la ruta de los componentes de UI a un patrón más común.
import Header from '../../components/ui/Header'; 
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon'; // Se asume que AppIcon está en la raíz de components
import Button from '../../components/ui/Button'; 
import FormCard from './components/FormCard';
import CategoryFilter from './components/CategoryFilter';
import SearchBar from './components/SearchBar';
import FormFilters from './components/FormFilters';

const FormCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [filteredForms, setFilteredForms] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  
  // 🔄 Estado del Sidebar
  const [isDesktopOpen, setIsDesktopOpen] = useState(true); // Controla el estado abierto/colapsado en Desktop
  const [isMobileOpen, setIsMobileOpen] = useState(false); // Controla la visibilidad en Mobile
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768); 

  const [allForms, setAllForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🔄 Efecto para manejar el estado del Sidebar al inicio y redimensionar
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileScreen(isMobile);
      
      // En móvil, la única verdad es isMobileOpen (controlada por el botón flotante)
      // Al pasar a móvil, aseguramos que el overlay esté oculto
      if (isMobile) {
        setIsMobileOpen(false); 
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 🔄 Lógica de Toggle Unificada
  const toggleSidebar = () => {
    if (isMobileScreen) {
      // En móvil, alternar el estado de apertura/cierre modal
      setIsMobileOpen(!isMobileOpen);
    } else {
      // En desktop, alternar el estado de colapsado/abierto
      setIsDesktopOpen(!isDesktopOpen);
    }
  };
  
  // 🔄 Función de navegación (para cerrar el sidebar en móvil)
  const handleNavigation = (path) => {
    if (isMobileScreen) {
      setIsMobileOpen(false); // Cierra el sidebar al navegar en móvil
    }
    console.log(`Navegando a: ${path}`);
    // Usar 'navigate(path);' si estamos en un contexto de router
  };


  // ... (Resto de useEffects y lógica de carga/filtrado sin cambios) ...
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
          section: f.section // Aseguramos que la sección se cargue para el filtro
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
      // 💡 CORRECCIÓN: Filtrar por 'section' en lugar de 'category'
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
  // ... (Fin de useEffects y lógica de carga/filtrado) ...

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

  const handleQuickAction = (action) => {
    console.log('Quick action selected:', action);
    alert(`Starting quick action: ${action.title}`);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  const borradorCount = allForms.filter(f => f.status === 'borrador').length;
  const recentCount = allForms.filter(f => {
    if (!f.lastModified) return false;
    const lastModDate = new Date(f.lastModified);
    const now = new Date();
    return (now - lastModDate) <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  
  // 🔄 Clase de Margen para el contenido principal:
  const mainMarginClass = isMobileScreen 
    ? 'ml-0' // Móvil: sin margen
    : isDesktopOpen ? 'ml-64' : 'ml-16'; // Desktop: abierto (64) o colapsado (16)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* 🔄 Sidebar: Renderiza si está abierto en desktop O si está abierto en móvil */}
      {(isDesktopOpen || isMobileOpen) && (
        <>
          <Sidebar 
            // isCollapsed: En móvil siempre es false, en desktop usa el estado de toggle.
            isCollapsed={isMobileScreen ? false : !isDesktopOpen} 
            onToggleCollapse={toggleSidebar} 
            isMobileOpen={isMobileOpen} 
            onNavigate={handleNavigation} 
          />
          
          {/* 🔄 Overlay semi-transparente en móvil cuando el sidebar está abierto */}
          {isMobileScreen && isMobileOpen && (
            <div 
              className="fixed inset-0 bg-foreground/50 z-40" 
              onClick={toggleSidebar} // Cierra el sidebar
            ></div>
          )}
        </>
      )}

      {/* 🔄 Botón Flotante para Abrir el Sidebar (Visible solo en móvil cuando está cerrado) */}
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

      {/* 🔄 Contenido Principal */}
      <main className={`transition-all duration-300 ${mainMarginClass} pt-20 md:pt-16`}>
        <div className="container-main p-6 space-y-8">
          <div className="space-y-4">
            
            {/* 🔄 Título y Botones */}
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestion de Formularios</h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                  Administración y gestion de formularios
                </p>
              </div>

              <div className="flex items-center space-x-2 md:space-x-3 flex-wrap">
                <Button
                  variant="outline"
                  size="default"
                  onClick={toggleViewMode}
                  iconName={viewMode === 'grid' ? 'List' : 'Grid3X3'}
                  iconPosition="left"
                  iconSize={18}
                  className="mb-2 md:mb-0"
                >
                  {viewMode === 'grid' ? 'List View' : 'Grid View'}
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
                  Create Custom Form
                </Button>
              </div>
            </div>

            {/* 🔄 Tarjetas de Resumen */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
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

              <div className="bg-card border border-border rounded-lg p-4">
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

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-secondary/10 rounded-lg min-touch-target">
                    <Icon name="Clock" size={20} className="text-secondary" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-foreground">
                      {allForms.filter(f => f.status === 'publicado').length}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">Formularios publicados</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
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
              onFilterToggle={toggleFilters}
              showFilters={showFilters}
            />

            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {showFilters && (
              <div className="lg:col-span-1">
                <FormFilters onFiltersChange={handleFiltersChange} />
              </div>
            )}

            <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
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
