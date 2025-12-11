import React, { useState, useEffect } from 'react';

const AnunciosList = ({ onCreateNew }) => {
  const [anuncios, setAnuncios] = useState([]);

  useEffect(() => {
    fetchAnuncios();
  }, []);

  const fetchAnuncios = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('https://back-acciona.vercel.app/api/anuncios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      setAnuncios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando anuncios:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Anuncios Enviados</h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Nuevo Anuncio
        </button>
      </div>
      
      <div className="divide-y">
        {anuncios.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay anuncios enviados
          </div>
        ) : (
          anuncios.map(anuncio => (
            <div key={anuncio._id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{anuncio.titulo}</h3>
                  <p className="text-sm text-gray-600 mt-1">{anuncio.descripcion}</p>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{new Date(anuncio.fechaEnvio).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{anuncio.totalDestinatarios || 0} destinatarios</span>
                    <span>•</span>
                    <span className={`px-2 py-1 rounded ${
                      anuncio.errores > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {anuncio.enviados || 0} enviados
                      {anuncio.errores > 0 && ` (${anuncio.errores} errores)`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnunciosList;