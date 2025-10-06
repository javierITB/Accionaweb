import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import FormCard from './components/FormCard';
import CategoryFilter from './components/CategoryFilter';
import QuickActions from './components/QuickActions';
import SearchBar from './components/SearchBar';
import FormFilters from './components/FormFilters';
import RecentForms from './components/RecentForms';

const FormCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [filteredForms, setFilteredForms] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [allForms, setAllForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('http://192.168.0.2:4000/api/forms');
        const data = await res.json();

        const normalizedForms = data.map(f => ({
          id: f._id,
          title: f.title || 'Sin título',
          description: f.description || '',
          category: f.category || 'general',
          icon: f.icon || 'FileText',
          status: f.status || 'draft',
          priority: f.priority || 'medium',
          estimatedTime: f.responseTime || '1-5 min',
          fields: f.questions ? f.questions.length : 0,
          documentsRequired: f.documentsRequired ?? false,
          tags: f.tags || [],
          lastModified: f.updatedAt ? f.updatedAt.split("T")[0] : null
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
      filtered = filtered.filter(form => form.category === activeCategory);
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

  const categories = [
    { id: 'all', name: 'All Forms', count: allForms.length },
    { id: 'timeoff', name: 'Time Off', count: allForms.filter(f => f.category === 'timeoff').length },
    { id: 'expense', name: 'Expenses', count: allForms.filter(f => f.category === 'expense').length },
    { id: 'hr', name: 'HR Services', count: allForms.filter(f => f.category === 'hr').length },
    { id: 'payroll', name: 'Payroll', count: allForms.filter(f => f.category === 'payroll').length },
    { id: 'benefits', name: 'Benefits', count: allForms.filter(f => f.category === 'benefits').length },
    { id: 'training', name: 'Training', count: allForms.filter(f => f.category === 'training').length },
    { id: 'it', name: 'IT Support', count: allForms.filter(f => f.category === 'it').length }
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

  const draftCount = allForms.filter(f => f.status === 'draft').length;
  const recentCount = allForms.filter(f => {
    if (!f.lastModified) return false;
    const lastModDate = new Date(f.lastModified);
    const now = new Date();
    return (now - lastModDate) <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className={`transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      } pt-16`}>
        <div className="p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gestion de Formularios</h1>
                <p className="text-muted-foreground mt-1">
                  Administración y gestion de formularios
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="default"
                  onClick={toggleViewMode}
                  iconName={viewMode === 'grid' ? 'List' : 'Grid3X3'}
                  iconPosition="left"
                  iconSize={18}
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
                >
                  Create Custom Form
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon name="FileText" size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{allForms.length}</p>
                    <p className="text-sm text-muted-foreground">Formularios Disponibles</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Icon name="Edit" size={20} className="text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{draftCount}</p>
                    <p className="text-sm text-muted-foreground">Borradores</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Icon name="CheckCircle" size={20} className="text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{recentCount}</p>
                    <p className="text-sm text-muted-foreground">Confirmaciones esta semana</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Icon name="Clock" size={20} className="text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {allForms.filter(f => f.status === 'pending').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Solicitudes Pendientes</p>
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