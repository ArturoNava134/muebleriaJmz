import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientID, setClientID] = useState(null); // Estado para el clientID

  // Fetch de la autenticación y notificaciones
  useEffect(() => {
    axios
      .get('http://localhost:8081') // Ruta para obtener el estado de autenticación
      .then((res) => {
        if (res.data.Status === 'Success') {
          setClientID(res.data.id); // Guardamos el ID del cliente
        }
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    if (clientID) {
      axios
        .get(`http://localhost:8081/getNotifications/${clientID}`)
        .then((response) => {
          setNotifications(response.data.notifications); // Guardamos las notificaciones
          setLoading(false);
        })
        .catch((error) => {
          console.log('Error al obtener notificaciones:', error);
        });
    }
  }, [clientID]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex justify-center items-center">
        <div className="text-xl">Cargando notificaciones...</div>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-900 min-h-screen py-6 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Historial de Notificaciones</h1>

      <div className="max-w-4xl mx-auto">
        {notifications.length === 0 ? (
          <div className="text-center text-lg text-gray-600">
            No tienes notificaciones.
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif, index) => (
              <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm text-blue-500">{notif.message}</span>
                  <span className="text-xs text-gray-400">{notif.timestamp}</span>
                </div>
                <p className="text-sm text-gray-700">{notif.details || 'No hay más detalles sobre esta notificación.'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
