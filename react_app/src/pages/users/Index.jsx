import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import RegisterForm from './components/RegisterForm';

const FormReg = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    mail: '',
    empresa: '',
    cargo: '',
    rol: 'Cliente' // valor por defecto
  });
  const [activeTab, setActiveTab] = useState('properties');

  // Empresas reales (reemplaza con las tuyas)
  const empresas = [
    { value: 'acciona', label: 'Acciona' },
    { value: 'empresa1', label: 'Empresa 1' },
    { value: 'empresa2', label: 'Empresa 2' },
  ];

  const cargos = [
    { value: 'Admin', label: 'Administrador' },
    { value: 'Gerente', label: 'Gerente' },
    { value: 'Supervisor', label: 'Supervisor' },
    { value: 'Empleado', label: 'Empleado' },
  ];

  const roles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'user', label: 'Usuario' },
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`http://192.168.0.2:4000/api/auth/`);
        if (!res.ok) throw new Error('Usuarios no encontrados');
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error('Error cargando los usuarios:', err);
        alert('No se pudo cargar la lista de usuarios');
      }
    };

    fetchUsers();
  }, []);

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para enviar el correo de registro
  const handleRegister = async () => {
    // Validaciones básicas
    if (!formData.nombre || !formData.apellido || !formData.mail || !formData.empresa || !formData.cargo) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!formData.mail.includes('@')) {
      alert('Por favor ingresa un email válido');
      return;
    }

    try {
      // 1. Primero guardar el usuario en la base de datos (sin contraseña)
      const userResponse = await fetch('http://192.168.0.2:4000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          pass: 'pending' // marcamos que la contraseña está pendiente
        }),
      });

      if (!userResponse.ok) {
        throw new Error('Error al guardar el usuario');
      }

      const saved = await userResponse.json();
      const savedUser = saved?.user;
      // 2. Enviar correo con enlace para establecer contraseña
      const mailResponse = await fetch('http://192.168.0.2:4000/api/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessKey: "MI_CLAVE_SECRETA_AQUI",
          to: [formData.mail],
          subject: "Completa tu registro en la plataforma",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3B82F6;">¡Bienvenido a la plataforma!</h2>
              <p>Hola <strong>${formData.nombre} ${formData.apellido}</strong>,</p>
              <p>Has sido registrado en nuestra plataforma. Para completar tu registro y establecer tu contraseña, haz clic en el siguiente botón:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:5173/set-password?userId=${savedUser?.id || savedUser?._id}" 
                   style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Establecer Contraseña
                </a>
              </div>
              <p><strong>Datos de tu cuenta:</strong></p>
              <ul>
                <li><strong>Empresa:</strong> ${formData.empresa}</li>
                <li><strong>Cargo:</strong> ${formData.cargo}</li>
                <li><strong>Rol:</strong> ${formData.rol}</li>
              </ul>
              <p style="color: #666; font-size: 12px;">Si no solicitaste este registro, por favor ignora este correo.</p>
            </div>
          `
        }),
      });

      if (!mailResponse.ok) {
        throw new Error('Error al enviar el correo');
      }

      alert('Usuario registrado exitosamente. Se ha enviado un correo para establecer la contraseña.');
      
      // 3. Limpiar el formulario
      setFormData({
        nombre: '',
        apellido: '',
        mail: '',
        empresa: '',
        cargo: '',
        rol: 'user'
      });

      // 4. Recargar la lista de usuarios
      const res = await fetch(`http://192.168.0.2:4000/api/auth/`);
      const data = await res.json();
      setUsers(data);

    } catch (error) {
      console.error('Error en el registro:', error);
      alert('Error al registrar el usuario: ' + error.message);
    }
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'properties':
        return (
          <RegisterForm
            formData={formData}
            empresas={empresas}
            cargos={cargos}
            roles={roles}
            onUpdateFormData={updateFormData}
            onRegister={handleRegister}
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

            {users.length === 0 ? (
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
                      <th className="px-4 py-2 text-left">Estado</th>
                      <th className="px-4 py-2 text-left">Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t hover:bg-muted/30 transition">
                        <td className="px-4 py-2">{u._id}</td>
                        <td className="px-4 py-2">{u.nombre || '—'}</td>
                        <td className="px-4 py-2">{u.empresa || '—'}</td>
                        <td className="px-4 py-2">{u.mail || '—'}</td>
                        <td className="px-4 py-2">{u.cargo || '—'}</td>
                        <td className="px-4 py-2">{u.rol || '—'}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            u.pass === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {u.pass === 'pending' ? 'Pendiente' : 'Activo'}
                          </span>
                        </td>
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

export default FormReg;