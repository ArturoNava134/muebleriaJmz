import React, { useState, useEffect } from "react";
import axios from "axios";

function Orders() {
  const [orders, setOrders] = useState([]); // Lista de pedidos
  const [clientId, setClientId] = useState(null); // ID del cliente
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState(null); // Estado de error

  // Obtener el ClientID del cliente
  useEffect(() => {
    axios
      .get("http://localhost:8081") // Endpoint para obtener datos del usuario
      .then((res) => {
        if (res.data.Status === "Success") {
          setClientId(res.data.id); // Establece el ID del cliente
        } else {
          setError("No se pudo obtener el ID del cliente.");
          setLoading(false);
        }
      })
      .catch((err) => {
        setError("Error al obtener el ID del cliente.");
        setLoading(false);
      });
  }, []);

  // Obtener pedidos del cliente
  useEffect(() => {
    if (clientId) {
      axios
        .get(`http://localhost:8081/getOrdersByClient/${clientId}`) // Llamar al backend
        .then((res) => {
          if (res.data.status === "success") {
            setOrders(res.data.data.orders || []); // Guardar los pedidos en el estado
          } else {
            setError(res.data.message || "Error al obtener los pedidos.");
          }
          setLoading(false);
        })
        .catch((err) => {
          setError("Error al obtener los pedidos.");
          setLoading(false);
        });
    }
  }, [clientId]);

  if (loading) {
    return <div className="text-center mt-8">Cargando pedidos...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center mt-8 text-gray-500">
        No se encontraron pedidos.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 pt-20 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Tus Pedidos</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.orderID}
            className="bg-white shadow-lg p-4 rounded-lg flex justify-between items-center"
          >
            <div>
              <h2 className="text-xl font-bold">
                {order.productOrdered} ({order.productClassification})
              </h2>
              <p className="text-gray-600">
                Dirección: {order.orderAddress}
              </p>
              <p className="text-gray-600">
                Cantidad: {order.orderQuantity}
              </p>
              <p className="text-gray-600">Monto Total: ${order.orderAmount}</p>
              <p className="text-gray-600">
                Estado:{" "}
                <span
                  className={`${
                    order.orderStatus === "En proceso"
                      ? "text-yellow-500"
                      : order.orderStatus === "Enviado"
                      ? "text-green-500"
                      : "text-red-500"
                  } font-bold`}
                >
                  {order.orderStatus}
                </span>
              </p>
            </div>
            <div className="text-right text-gray-500">
              <p>ID del Pedido: {order.orderID}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Orders;
