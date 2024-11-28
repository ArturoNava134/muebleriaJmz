import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [editOrderId, setEditOrderId] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchClientID, setSearchClientID] = useState("");
  const [auth, setAuth] = useState(false);

 
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    axios
      .get("http://localhost:8081/getOrders")
      .then((res) => {
        if (res.data.status === "success") {
          setOrders(res.data.data);
        } else {
          console.error("Error fetching orders:", res.data.message);
        }
      })
      .catch((err) => console.error("Error fetching orders:", err));
  };

  const handleSetStatus = (order) => {
    setEditOrderId(order.orderID);
    setEditStatus(order.orderStatus);
  };

  const handleSaveStatus = () => {

    const selectedOrder = orders.find((order) => order.orderID === editOrderId);
    const { clientID } = selectedOrder;

    
    axios
      .put(`http://localhost:8081/putOrders/${editOrderId}`, {
        orderStatus: editStatus,
        clientID: clientID,
      })
      .then((res) => {
        if (res.status === 200) {
          alert("Estado actualizado correctamente");
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.orderID === editOrderId
                ? { ...order, orderStatus: editStatus }
                : order
            )
          );
          setEditOrderId(null);
        } else {
          alert(res.data.message || "Error al actualizar el estado");
        }
      })
      .catch((err) => {
        console.error("Error al actualizar el estado:", err);
        alert("Hubo un error al intentar actualizar el estado.");
      });
  };

  const handleDeleteOrder = (id) => { 
    axios
      .delete(`http://localhost:8081/deleteOrder/${id}`)
      .then((res) => {
        if (res.data.status === "success") {
          alert("Orden eliminada correctamente");
          // Después de eliminar, actualizamos la lista de órdenes
          fetchOrders();  // Esta función debería actualizar correctamente el estado de las órdenes restantes
        } else {
          alert(res.data.message || "Error al eliminar la orden");
        }
      })
      .catch((err) => console.error("Error al eliminar la orden:", err));
};


  const filteredOrders = orders.filter(
    (order) =>
      order.productOrdered?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderID?.toString().includes(searchQuery.toLowerCase())
  );

  const finalFilteredOrders = filteredOrders.filter((order) =>
    searchClientID ? order.clientID?.toString().includes(searchClientID) : true
  );


  axios.defaults.withCredentials = true;

  useEffect(() => {
    axios
      .get("http://localhost:8081")
      .then((res) => {
        if (res.data.Status === "Success") {
          setAuth(true);
        } else {
          setAuth(false);
        }
      })
      .catch((err) => console.log(err));
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-100 p-6 pt-24">
      {auth ? (
      <>
      <div className="flex justify-between items-center mb-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold">Gestión de Órdenes</h1>
        <div className="flex space-x-4 items-center">
          <input
            type="text"
            placeholder="Buscar por producto o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border rounded-lg shadow-sm w-64"
          />
          <input
            type="text"
            placeholder="Buscar por Client ID..."
            value={searchClientID}
            onChange={(e) => setSearchClientID(e.target.value)}
            className="p-2 border rounded-lg shadow-sm w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto max-w-6xl mx-auto">
        <table className="min-w-full bg-white border rounded-lg shadow-md">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-2 px-4 text-left">Order ID</th>
              <th className="py-2 px-4 text-left">Client ID</th>
              <th className="py-2 px-4 text-left">Producto</th>
              <th className="py-2 px-4 text-left">Categoría</th>
              <th className="py-2 px-4 text-left">Cantidad</th>
              <th className="py-2 px-4 text-left">Estado</th>
              <th className="py-2 px-4 text-left">Dirección</th>
              <th className="py-2 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {finalFilteredOrders.map((order) => (
              <tr key={order.orderID} className="border-b">
                <td className="py-2 px-4">{order.orderID}</td>
                <td className="py-2 px-4">{order.clientID}</td>
                <td className="py-2 px-4">{order.productOrdered}</td>
                <td className="py-2 px-4">{order.productClasification}</td>
                <td className="py-2 px-4">{order.orderQuantity}</td>
                <td className="py-2 px-4">
                  {editOrderId === order.orderID ? (
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="p-2 border rounded-lg w-full"
                    >
                      <option value="Enviado">Enviado</option>
                      <option value="Cancelado">Cancelado</option>
                      <option value="Completado">Completado</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  ) : (
                    order.orderStatus
                  )}
                </td>
                <td className="py-2 px-4">{order.orderAddress}</td>
                <td className="py-2 px-4 flex justify-center gap-2">
                  {editOrderId === order.orderID ? (
                    <button
                      onClick={handleSaveStatus}
                      className="bg-green-600 text-white py-1 px-4 rounded-lg hover:bg-green-700"
                    >
                      Guardar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSetStatus(order)}
                      className="bg-blue-600 text-white py-1 px-4 rounded-lg hover:bg-blue-700"
                    >
                      SetStatus
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteOrder(order.orderID)}
                    className="bg-red-600 text-white py-1 px-4 rounded-lg hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          No tienes las credenciales necesarias para acceder a esta página.
        </h1>
        <Link
          to="/"
          className="text-lg font-semibold text-blue-600 hover:underline"
        >
          Regresar.
        </Link>
      </div>
    )}
    </div>
  );
}

export default AdminOrders;
