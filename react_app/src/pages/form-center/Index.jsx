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
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);;

  // Mock form data
  const [allForms, setAllForms] = useState([]);
  const[draft, setDraft] = useState (0);

  

  // Filter forms based on search, category, and filters
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/forms');
        const data = await res.json();
        
        // Normalizar los datos: rellenar campos faltantes
        const normalizedForms = await data.map(f => ({
          id: f._id,
          title: f.title || 'Sin título',
          description: f.description || '',
          category: f.category || 'general',
          icon: f.icon || 'FileText',
          status: f.status || 'draft', // draft | available | published
          priority: f.priority || 'medium', // low | medium | high
          estimatedTime: f.responseTime || '1-5 min',
          fields: f.questions.length, // si viene undefined
          documentsRequired: f.documentsRequired ?? false,
          tags: f.tags || [],
          createdAt: f.createdAt.split("T")[0] || null,
          lastModified: f.updatedAt.split("T")[0] || null
        }));
        
        setAllForms(normalizedForms);
      } catch (err) {
        console.error('Error cargando formularios:', err);
      }
    };
    console.log(allForms);

    for (const nf in allForms) {
        (nf.status==='draft')?setDraft(draft+1):null;
              
        }
    fetchForms();
    let filtered = allForms;

    // Category filter
    if (activeCategory !== 'all') {
      filtered = filtered?.filter(form => form?.category === activeCategory);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered?.filter(form =>
        form?.title?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        form?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        form?.category?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        form?.tags?.some(tag => tag?.toLowerCase()?.includes(searchQuery?.toLowerCase()))
      );
    }

    // Additional filters
    if (filters?.status && filters?.status?.length > 0) {
      filtered = filtered?.filter(form => filters?.status?.includes(form?.status));
    }

    if (filters?.priority && filters?.priority?.length > 0) {
      filtered = filtered?.filter(form => filters?.priority?.includes(form?.priority));
    }

    if (filters?.documentsRequired) {
      filtered = filtered?.filter(form => form?.documentsRequired);
    }

    if (filters?.recentlyUsed) {
      filtered = filtered?.filter(form => form?.lastModified);
    }

    setFilteredForms(filtered);
  }, [searchQuery, activeCategory, filters]);

  const categories = [
    { id: 'all', name: 'All Forms', count: allForms?.length },
    { id: 'timeoff', name: 'Time Off', count: allForms?.filter(f => f?.category === 'timeoff')?.length },
    { id: 'expense', name: 'Expenses', count: allForms?.filter(f => f?.category === 'expense')?.length },
    { id: 'hr', name: 'HR Services', count: allForms?.filter(f => f?.category === 'hr')?.length },
    { id: 'payroll', name: 'Payroll', count: allForms?.filter(f => f?.category === 'payroll')?.length },
    { id: 'benefits', name: 'Benefits', count: allForms?.filter(f => f?.category === 'benefits')?.length },
    { id: 'training', name: 'Training', count: allForms?.filter(f => f?.category === 'training')?.length },
    { id: 'it', name: 'IT Support', count: allForms?.filter(f => f?.category === 'it')?.length }
  ];

  const handleFormSelect = (form) => {
    console.log('Selected form:', form);
    // Navigate to form or open form modal
    alert(`Opening form: ${form?.title}`);
  };

  const handleQuickAction = (action) => {
    console.log('Quick action selected:', action);
    alert(`Starting quick action: ${action?.title}`);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)
        } />
      <main className={`transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      } pt-16`}>
        <div className="p-6 space-y-8">
          {/* Page Header */}
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
                  onClick={() => window.location.href="/form-builder"} // ruta interna
                >
                  Create Custom Form
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon name="FileText" size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{allForms?.length}</p>
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
                    <p className="text-2xl font-bold text-foreground">{allForms?.filter(f => f?.status === 'draft')?.length}</p>
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
                    <p className="text-2xl font-bold text-foreground">{allForms?.filter(f => new Date(f?.lastModified) - new Date() < 604800000)?.length}</p>
                    <p className="text-sm text-muted-foreground">creaciones esta semana</p>
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
                      {allForms?.filter(f => {
                        if (!f?.lastModified) return false;
                        const diff = new Date() - new Date(f.lastModified); // diferencia en ms
                        return diff <= 7 * 24 * 60 * 60 * 1000; // 7 días en ms
                      })?.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Solicitudes Pendientes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Search and Filters */}
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

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Filters */}
            {showFilters && (
              <div className="lg:col-span-1">
                <FormFilters onFiltersChange={handleFiltersChange} />
              </div>
            )}

            {/* Forms Grid/List */}
            <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
              <div className="space-y-6">

                {/* All Forms */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      Formularios ({filteredForms?.length})
                    </h3>
                    
                    {searchQuery && (
                      <div className="text-sm text-muted-foreground">
                        Resultados de "{searchQuery}"
                      </div>
                    )}
                  </div>

                  {filteredForms?.length === 0 ? (
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
                    <div className={viewMode === 'grid' ?'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' :'space-y-4'
                    }>
                      {filteredForms?.map((form) => (
                        <FormCard
                          key={form?.id}
                          form={form}
                          onSelect={handleFormSelect}
                          className={viewMode === 'list' ? 'w-full' : ''}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FormCenter;