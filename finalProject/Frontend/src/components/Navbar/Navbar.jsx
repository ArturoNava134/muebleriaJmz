import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes, FaBell } from 'react-icons/fa';

const Navbar = () => {
  const [auth, setAuth] = useState(false);
  const [name, setName] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(0); // Estado para las notificaciones
  const [clientID, setClientID] = useState(null); // Estado para el clientID
  const [showNotifications, setShowNotifications] = useState(false); // Controla si se muestra el dropdown
  const [notificationList, setNotificationList] = useState([]); // Lista de notificaciones
  const [hasClosedDropdown, setHasClosedDropdown] = useState(false); // Estado para saber si se ha cerrado el dropdown

  axios.defaults.withCredentials = true;

  // Fetch de la autenticación y notificaciones
  useEffect(() => {
    axios
      .get('http://localhost:8081') // Ruta para obtener el estado de autenticación
      .then((res) => {
        if (res.data.Status === 'Success') {
          setAuth(true);
          setName(res.data.name);
          setClientID(res.data.id); // Guardamos el ID del cliente
        } else {
          setAuth(false);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  // Fetch de notificaciones para el usuario logueado
  useEffect(() => {
    if (clientID) {
      const interval = setInterval(() => {
        // Polling cada 5 segundos
        axios
          .get(`http://localhost:8081/getNotifications/${clientID}`)
          .then((response) => {
            setNotifications(response.data.unreadCount); // Actualizamos el contador
            setNotificationList(response.data.notifications); // Guardamos las notificaciones
          })
          .catch((error) => {
            console.log('Error al obtener notificaciones:', error);
          });
      }, 5000); // Actualización cada 5 segundos

      // Limpiar el intervalo cuando el componente se desmonte
      return () => clearInterval(interval);
    }
  }, [clientID]);

  // Función para manejar la apertura/cierre del dropdown y marcar las notificaciones como leídas
  const toggleNotifications = () => {
    if (showNotifications) {
      // Si el dropdown está siendo cerrado, marcamos las notificaciones como leídas solo la primera vez
      if (!hasClosedDropdown && notifications > 0) {
        axios
          .put(`http://localhost:8081/markNotificationsRead/${clientID}`)
          .then(() => {
            setNotifications(0); // Reseteamos el contador
          })
          .catch((error) => {
            console.log('Error al marcar las notificaciones como leídas:', error);
          });
        setHasClosedDropdown(true); // Marcamos que el dropdown ya se cerró
      }
    } else {
      // Si el dropdown está siendo abierto, no hacemos nada en cuanto a marcar las notificaciones
      setHasClosedDropdown(false); // Restablecemos el estado al abrir el dropdown
    }

    // Alternamos la visibilidad del dropdown
    setShowNotifications(!showNotifications);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleDelete = () => {
    axios
      .get('http://localhost:8081/Logout')
      .then(() => {
        location.reload(true);
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="bg-gray-900 text-white fixed w-full top-0 z-50 shadow-md">
      <nav className="container mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <h3 className="text-2xl font-bold">Mueblería Jiménez</h3>

        {/* Mobile menu toggle */}
        <div
          className="text-2xl cursor-pointer lg:hidden"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </div>

        {/* Links */}
        <ul
          className={`lg:flex lg:gap-8 lg:static absolute top-16 left-0 w-full lg:w-auto bg-gray-800 lg:bg-transparent transition-all duration-300 ${
            isMobileMenuOpen ? 'block' : 'hidden'
          }`}
        >
          <Link
            to="/orders"
            className="block px-4 py-2 lg:py-0 hover:bg-gray-700 lg:hover:bg-transparent"
          >
            <li>Pedidos</li>
          </Link>
          <Link
            to="/"
            className="block px-4 py-2 lg:py-0 hover:bg-gray-700 lg:hover:bg-transparent"
          >
            <li>Shop</li>
          </Link>

          {auth ? (
            <>
              <li className="block px-4 py-2 lg:py-0">
                Welcome, <span className="font-semibold">{name}</span>
              </li>

              {/* Notificaciones */}
              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  className="text-2xl relative"
                >
                  <FaBell />
                  {notifications > 0 && (
                    <span className="absolute top-0 right-0 bg-red-600 text-white rounded-full text-xs px-2">
                      {notifications}
                    </span>
                  )}
                </button>

                {/* Dropdown de notificaciones */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-64 bg-white text-black rounded-lg shadow-lg z-10">
                    <div className="py-2 px-4 font-bold text-lg border-b">Notificaciones</div>
                    {notificationList.filter(notif => !notif.read).length === 0 ? (
                      <div className="px-4 py-2">No tienes notificaciones recientes.</div>
                    ) : (
                        notificationList
                        .filter((notif) => !notif.read)
                        .map((notif, index) => (
                          <div key={index} className="px-4 py-2 border-b hover:bg-gray-100">
                            <div className=' py-2 text-left text-xs text-blue-500'>
                            <Link to="/orders">ver pedidos</Link>
                            </div>
                            <div className="text-sm">{notif.message}</div>
                            <div className="text-xs text-gray-500">{notif.timestamp}</div>
                          </div>
                        ))
                    )}
                    <div className="px-4 py-2 text-center text-sm text-blue-500">
                      <Link to="/notifications">Ver historial</Link>
                    </div>
                  </div>
                )}
              </div>

              <button
                className="block px-4 py-2 bg-red-600 text-white rounded lg:ml-4 lg:py-1 lg:px-4 hover:bg-red-700"
                onClick={handleDelete}
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="block px-4 py-2 lg:py-0 hover:bg-gray-700 lg:hover:bg-transparent"
            >
              <li>Login</li>
            </Link>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;
