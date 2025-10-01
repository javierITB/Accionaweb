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
  const allForms = [
    {
      id: 'form-1',
      title: 'Annual Leave Request',
      description: 'Submit requests for vacation time, personal days, and other approved leave types with automatic calendar integration.',
      category: 'timeoff',
      icon: 'Calendar',
      status: 'available',
      priority: 'medium',
      estimatedTime: '3-5 min',
      fields: 8,
      documentsRequired: false,
      tags: ['vacation', 'personal', 'calendar'],
      lastModified: null
    },
    {
      id: 'form-2',
      title: 'Expense Reimbursement',
      description: 'Submit business expenses for reimbursement including travel, meals, and office supplies with receipt upload.',
      category: 'expense',
      icon: 'Receipt',
      status: 'draft',
      priority: 'high',
      estimatedTime: '5-10 min',
      fields: 12,
      documentsRequired: true,
      tags: ['travel', 'meals', 'receipts'],
      lastModified: '2 hours ago'
    },
    {
      id: 'form-3',
      title: 'IT Support Request',
      description: 'Request technical assistance, equipment, or software access with priority routing to IT department.',
      category: 'it',
      icon: 'Monitor',
      status: 'available',
      priority: 'low',
      estimatedTime: '2-3 min',
      fields: 6,
      documentsRequired: false,
      tags: ['technical', 'equipment', 'software'],
      lastModified: null
    },
    {
      id: 'form-4',
      title: 'Salary Certificate Request',
      description: 'Request official salary certificates for bank loans, visa applications, or other official purposes.',
      category: 'hr',
      icon: 'FileText',
      status: 'available',
      priority: 'medium',
      estimatedTime: '1-2 min',
      fields: 4,
      documentsRequired: false,
      tags: ['certificate', 'official', 'salary'],
      lastModified: null
    },
    {
      id: 'form-5',
      title: 'Training Request',
      description: 'Submit requests for professional development courses, conferences, and skill enhancement programs.',
      category: 'training',
      icon: 'GraduationCap',
      status: 'available',
      priority: 'low',
      estimatedTime: '4-6 min',
      fields: 10,
      documentsRequired: true,
      tags: ['development', 'courses', 'skills'],
      lastModified: null
    },
    {
      id: 'form-6',
      title: 'Benefits Enrollment',
      description: 'Enroll in or modify your health insurance, retirement plans, and other employee benefits.',
      category: 'benefits',
      icon: 'Heart',
      status: 'available',
      priority: 'high',
      estimatedTime: '10-15 min',
      fields: 20,
      documentsRequired: true,
      tags: ['health', 'insurance', 'retirement'],
      lastModified: null
    },
    {
      id: 'form-7',
      title: 'Payroll Inquiry',
      description: 'Submit questions or corrections related to your payroll, deductions, or tax withholdings.',
      category: 'payroll',
      icon: 'CreditCard',
      status: 'available',
      priority: 'medium',
      estimatedTime: '3-4 min',
      fields: 7,
      documentsRequired: false,
      tags: ['payroll', 'deductions', 'tax'],
      lastModified: null
    },
    {
      id: 'form-8',
      title: 'Performance Review Self-Assessment',
      description: 'Complete your annual performance review self-assessment with goal setting and achievement tracking.',
      category: 'hr',
      icon: 'Target',
      status: 'draft',
      priority: 'high',
      estimatedTime: '15-20 min',
      fields: 25,
      documentsRequired: false,
      tags: ['performance', 'goals', 'assessment'],
      lastModified: '1 day ago'
    }
  ];

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

  // Filter forms based on search, category, and filters
  useEffect(() => {
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
                <h1 className="text-3xl font-bold text-foreground">Form Center</h1>
                <p className="text-muted-foreground mt-1">
                  Access and submit all your HR forms in one centralized location
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
                    <p className="text-sm text-muted-foreground">Available Forms</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Icon name="Edit" size={20} className="text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">2</p>
                    <p className="text-sm text-muted-foreground">Draft Forms</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Icon name="CheckCircle" size={20} className="text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">15</p>
                    <p className="text-sm text-muted-foreground">Completed This Month</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Icon name="Clock" size={20} className="text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">3.2</p>
                    <p className="text-sm text-muted-foreground">Avg. Completion Time</p>
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
                      All Forms ({filteredForms?.length})
                    </h3>
                    
                    {searchQuery && (
                      <div className="text-sm text-muted-foreground">
                        Showing results for "{searchQuery}"
                      </div>
                    )}
                  </div>

                  {filteredForms?.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="Search" size={24} className="text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">No forms found</h3>
                      <p className="text-muted-foreground mb-4">
                        Try adjusting your search criteria or filters
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery('');
                          setActiveCategory('all');
                          setFilters({});
                        }}
                      >
                        Clear All Filters
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