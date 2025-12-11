// react_app/src/pages/anuncios/Index.jsx
import React, { useState } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import AnunciosList from './components/AnunciosList';
import AnuncioCreator from './components/AnuncioCreator';

const AnunciosPage = () => {
  const [showCreator, setShowCreator] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeItem="anuncios" />
      
      <div className="flex-1">
        <Header 
          title="Anuncios" 
          subtitle="Enviar notificaciones a grupos de usuarios"
        />
        
        <main className="p-4 md:p-6">
          <AnunciosList onCreateNew={() => setShowCreator(true)} />
        </main>
      </div>

      {showCreator && (
        <AnuncioCreator
          onClose={() => setShowCreator(false)}
          onSuccess={() => {
            setShowCreator(false);
            window.location.reload(); // Recargar para ver el nuevo anuncio
          }}
        />
      )}
    </div>
  );
};

export default AnunciosPage;