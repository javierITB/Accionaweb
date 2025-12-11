// AnunciosList.jsx - VERSIÓN CON DEBUG
import React, { useState, useEffect } from 'react';

const AnunciosList = ({ onCreateNew }) => {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnuncios();
  }, []);

  const fetchAnuncios = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = sessionStorage.getItem('token');
      
      console.log('🔍 Fetching anuncios...');
      console.log('Token:', token ? 'Presente' : 'Ausente');
      
      // PRIMERO: Probar endpoint de test
      const testResponse = await fetch('https://back-acciona.vercel.app/api/anuncios/test', {
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });
      
      console.log('Test endpoint status:', testResponse.status);
      
      if (!testResponse.ok) {
        throw new Error(`Endpoint no disponible (${testResponse.status})`);
      }
      
      const testData = await testResponse.text();
      console.log('Test response:', testData);
      
      // AHORA: Obtener anuncios reales
      const response = await fetch('https://back-acciona.vercel.app/api/anuncios', {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      
      console.log('Anuncios response status:', response.status);
      console.log('Anuncios response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const responseText = await response.text();
      console.log('Response text (raw):', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('Response JSON parsed:', result);
      } catch (parseError) {
        console.error('Error parseando JSON:', parseError);
        console.error('Texto recibido:', responseText);
        throw new Error('Respuesta no es JSON válido');
      }
      
      if (result.success && Array.isArray(result.data)) {
        console.log(`✅ ${result.data.length} anuncios cargados`);
        setAnuncios(result.data);
      } else if (Array.isArray(result)) {
        console.log(`✅ ${result.length} anuncios cargados (array directo)`);
        setAnuncios(result);
      } else {
        console.warn('Formato de respuesta inesperado:', result);
        setAnuncios([]);
      }
      
    } catch (error) {
      console.error('❌ Error cargando anuncios:', error);
      setError(error.message);
      setAnuncios([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Cargando anuncios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Anuncios</h2>
            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Nuevo Anuncio
            </button>
          </div>
        </div>
        
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-2xl text-red-600">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error al cargar anuncios</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnuncios}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Anuncios Enviados</h2>
          <p className="text-gray-600">{anuncios.length} anuncios en historial</p>
        </div>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <span className="mr-2">+</span> Nuevo Anuncio
        </button>
      </div>
      
      <div className="divide-y">
        {anuncios.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">📢</span>
            </div>
            <h3 className="text-lg font-medium mb-2">No hay anuncios enviados</h3>
            <p className="text-gray-500 mb-4">Crea tu primer anuncio para enviar notificaciones</p>
            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Crear primer anuncio
            </button>
          </div>
        ) : (
          anuncios.map(anuncio => (
            <div key={anuncio._id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4`}
                  style={{ backgroundColor: `${anuncio.color}20` }}>
                  <span style={{ color: anuncio.color }}>
                    {anuncio.icono === 'paper' ? '📄' :
                     anuncio.icono === 'alert' ? '⚠️' :
                     anuncio.icono === 'info' ? 'ℹ️' : '📢'}
                  </span>
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-semibold">{anuncio.titulo}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      anuncio.prioridad >= 3 ? 'bg-red-100 text-red-800' : 
                      anuncio.prioridad === 2 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      Prioridad {anuncio.prioridad}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mt-1 text-sm">{anuncio.descripcion}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                    <span>{new Date(anuncio.fechaEnvio).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{anuncio.resultado?.modificados || 0} enviados</span>
                    {anuncio.resultado?.errores > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-red-600">{anuncio.resultado.errores} errores</span>
                      </>
                    )}
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