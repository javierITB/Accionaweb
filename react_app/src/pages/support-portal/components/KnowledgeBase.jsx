import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const KnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Todas las Categorías', icon: 'Grid3X3' },
    { id: 'forms', name: 'Formularios', icon: 'FileText' },
    { id: 'payroll', name: 'Nómina', icon: 'DollarSign' },
    { id: 'benefits', name: 'Beneficios', icon: 'Heart' },
    { id: 'technical', name: 'Soporte Técnico', icon: 'Monitor' },
    { id: 'policies', name: 'Políticas', icon: 'Shield' }
  ];

  const articles = [
    {
      id: 1,
      title: "¿Cómo solicitar vacaciones?",
      description: "Guía paso a paso para solicitar días de vacaciones a través del portal",
      category: "forms",
      views: 1250,
      helpful: 98,
      lastUpdated: "2025-01-15",
      tags: ["vacaciones", "formularios", "solicitudes"]
    },
    {
      id: 2,
      title: "Entender tu liquidación de sueldo",
      description: "Explicación detallada de todos los conceptos en tu liquidación mensual",
      category: "payroll",
      views: 890,
      helpful: 95,
      lastUpdated: "2025-01-10",
      tags: ["sueldo", "liquidación", "conceptos"]
    },
    {
      id: 3,
      title: "Beneficios de salud disponibles",
      description: "Información completa sobre seguros de salud y beneficios médicos",
      category: "benefits",
      views: 756,
      helpful: 92,
      lastUpdated: "2025-01-08",
      tags: ["salud", "seguros", "beneficios"]
    },
    {
      id: 4,
      title: "Problemas de acceso al portal",
      description: "Soluciones para problemas comunes de login y navegación",
      category: "technical",
      views: 634,
      helpful: 89,
      lastUpdated: "2025-01-12",
      tags: ["acceso", "login", "técnico"]
    },
    {
      id: 5,
      title: "Política de trabajo remoto",
      description: "Lineamientos y procedimientos para trabajo desde casa",
      category: "policies",
      views: 523,
      helpful: 94,
      lastUpdated: "2025-01-05",
      tags: ["remoto", "políticas", "trabajo"]
    },
    {
      id: 6,
      title: "Cómo reportar gastos de viaje",
      description: "Proceso completo para reportar y obtener reembolsos de gastos",
      category: "forms",
      views: 445,
      helpful: 91,
      lastUpdated: "2025-01-14",
      tags: ["gastos", "viajes", "reembolsos"]
    }
  ];

  const filteredArticles = articles?.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article?.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      article?.title?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      article?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      article?.tags?.some(tag => tag?.toLowerCase()?.includes(searchQuery?.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const handleArticleClick = (article) => {
    alert(`Abriendo artículo: ${article?.title}`);
  };

  return (
    <div id="knowledge-section" className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Base de Conocimiento</h2>
        <Button variant="outline" iconName="Plus" iconPosition="left">
          Sugerir Artículo
        </Button>
      </div>
      {/* Search Bar */}
      <div className="mb-6">
        <Input
          type="search"
          placeholder="Buscar en la base de conocimiento..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e?.target?.value)}
          className="max-w-md"
        />
      </div>
      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories?.map((category) => (
          <Button
            key={category?.id}
            variant={selectedCategory === category?.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category?.id)}
            iconName={category?.icon}
            iconPosition="left"
            iconSize={16}
          >
            {category?.name}
          </Button>
        ))}
      </div>
      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles?.map((article) => (
          <div
            key={article?.id}
            className="bg-card border border-border rounded-lg p-6 hover:shadow-brand-hover transition-brand cursor-pointer group"
            onClick={() => handleArticleClick(article)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {article?.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  {article?.description}
                </p>
              </div>
              <Icon name="ExternalLink" size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {article?.tags?.slice(0, 3)?.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Icon name="Eye" size={12} />
                  <span>{article?.views}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Icon name="ThumbsUp" size={12} />
                  <span>{article?.helpful}%</span>
                </div>
              </div>
              <span>Actualizado: {new Date(article.lastUpdated)?.toLocaleDateString('es-ES')}</span>
            </div>
          </div>
        ))}
      </div>
      {filteredArticles?.length === 0 && (
        <div className="text-center py-12">
          <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron artículos</h3>
          <p className="text-muted-foreground">
            Intenta con otros términos de búsqueda o selecciona una categoría diferente
          </p>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;