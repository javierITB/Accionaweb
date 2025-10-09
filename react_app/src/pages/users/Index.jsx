import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import FormProperties from './components/FormProperties';

const FormBuilder = () => {
  const [User, setUserData] = useState([]);
  const [formData, setFormData] = useState("");
  const [activeTab, setActiveTab] = useState('properties');

  const categories = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Cliente', label: 'Cliente' },
  ];

  const sections = [
    { value: 'Remuneraciones', label: 'Remuneraciones' },
    { value: 'Anexos', label: 'Anexos' },
    { value: 'Finiquitos', label: 'Finiquitos' },
    { value: 'Otras', label: 'Otras' }
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`http://192.168.0.2:4000/api/auth/`);
        if (!res.ok) throw new Error('Usuarios no encontrados');
        const data = await res.json();
        setUserData(data);
      } catch (err) {
        console.error('Error cargando los usuarios:', err);
        alert('No se pudo cargar la lista de usuarios');
      }
    };

    fetchUsers();
  }, []);

  const updateFormData = (field, value) => {
    if (field === 'title' && value.length > 50) {
      alert('El título no puede tener más de 50 caracteres');
      return;
    }

    setFormData(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString()
    }));
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'properties':
        return (
          <FormProperties
            formData={formData}
            categories={categories}
            sections={sections}
            onUpdateFormData={updateFormData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="ml-64 pt-16">
        <div className="p-6 space-y-6">
          <div className="bg-card border border-border rounded-lg">
            <div className="p-6">{getTabContent()}</div>
          </div>

          {/* 🧾 Tabla de Usuarios */}
          <div className="bg-card border border-border rounded-lg mt-8 p-6">
            <h2 className="text-xl font-semibold mb-4">Usuarios registrados</h2>

            {User.length === 0 ? (
              <p className="text-muted-foreground">No hay usuarios registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-border rounded-lg">
                  <thead className="bg-muted text-sm text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Nombre</th>
                      <th className="px-4 py-2 text-left">Empresa</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Cargo</th>
                      <th className="px-4 py-2 text-left">Rol</th>
                      <th className="px-4 py-2 text-left">Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {User.map((u) => (
                      <tr key={u.id} className="border-t hover:bg-muted/30 transition">
                        <td className="px-4 py-2">{u.id}</td>
                        <td className="px-4 py-2">{u.nombre || '—'}</td>
                        <td className="px-4 py-2">{u.empresa || '—'}</td>
                        <td className="px-4 py-2">{u.mail || '—'}</td>
                        <td className="px-4 py-2">{u.cargo || '—'}</td>
                        <td className="px-4 py-2">{u.rol || '—'}</td>
                        <td className="px-4 py-2">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FormBuilder;
