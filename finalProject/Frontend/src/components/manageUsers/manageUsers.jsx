import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all users
  useEffect(() => {
    axios.get('http://localhost:8081/users')
      .then((res) => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Error fetching users');
        setLoading(false);
      });
  }, []);

  // Edit user
  const handleEdit = (user) => {
    setEditUser({ ...user });
  };

  const handleCancelEdit = () => {
    setEditUser(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditUser(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSave = () => {
    axios.put(`http://localhost:8081/users/${editUser.id}`, editUser)
      .then((response) => {
        setUsers(users.map(user => (user.id === editUser.id ? editUser : user)));
        setEditUser(null);
      })
      .catch((error) => {
        setError('Error saving user');
      });
  };

  const handleDelete = (id) => {
    axios.delete(`http://localhost:8081/users/${id}`)
      .then((response) => {
        setUsers(users.filter(user => user.id !== id));
      })
      .catch((error) => {
        setError('Error deleting user');
      });
  };

  // Add new user
  const handleAddUser = () => {
    axios.post('http://localhost:8081/users', newUser)
      .then((response) => {
        setUsers([...users, { ...newUser, id: response.data.id }]);
        setNewUser({ name: '', email: '', password: '' });
      })
      .catch((error) => {
        setError('Error adding user');
      });
  };

  return (
    <div className="container mx-auto p-8">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">Gestión de Usuarios</h2>

      {/* Add User Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Agregar Nuevo Usuario</h3>
        <div className="space-y-4">
          <input
            type="text"
            className="border border-gray-300 p-3 w-full rounded-md"
            placeholder="Nombre"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <input
            type="email"
            className="border border-gray-300 p-3 w-full rounded-md"
            placeholder="Correo Electrónico"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <input
            type="password"
            className="border border-gray-300 p-3 w-full rounded-md"
            placeholder="Contraseña"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
          <button
            className="bg-green-600 text-white py-1 px-4 rounded-lg hover:bg-green-700"
            onClick={handleAddUser}
          >
            Agregar Usuario
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Usuarios Registrados</h3>
        {loading ? (
          <p className="text-gray-600">Cargando usuarios...</p>
        ) : (
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="p-4 text-left text-sm text-gray-700">Nombre</th>
                <th className="p-4 text-left text-sm text-gray-700">Correo</th>
                <th className="p-4 text-left text-sm text-gray-700">Contraseña</th>
                <th className="p-4 text-left text-sm text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    {editUser && editUser.id === user.id ? (
                      <input
                        type="text"
                        name="name"
                        value={editUser.name}
                        onChange={handleChange}
                        className="border p-2 w-full rounded-md"
                      />
                    ) : (
                      user.userName
                    )}
                  </td>
                  <td className="p-4">
                    {editUser && editUser.id === user.id ? (
                      <input
                        type="email"
                        name="email"
                        value={editUser.email}
                        onChange={handleChange}
                        className="border p-2 w-full rounded-md"
                      />
                    ) : (
                      user.emailAddress
                    )}
                  </td>
                  <td className="p-4">
                    {editUser && editUser.id === user.id ? (
                      <input
                        type="password"
                        name="password"
                        value={editUser.password}
                        onChange={handleChange}
                        className="border p-2 w-full rounded-md"
                        placeholder="Nueva contraseña"
                      />
                    ) : (
                      '******' // Hide password for security
                    )}
                  </td>
                  <td className="p-4">
                    {editUser && editUser.id === user.id ? (
                      <div className="flex space-x-4">
                        <button
                          onClick={handleSave}
                          className="bg-green-600 text-white py-1 px-4 rounded-lg hover:bg-green-700"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-600 text-white py-1 px-4 rounded-lg hover:bg-gray-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleEdit(user)}
                          className="bg-blue-600 text-white py-1 px-4 rounded-lg hover:bg-blue-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="bg-red-600 text-white py-1 px-4 rounded-lg hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
