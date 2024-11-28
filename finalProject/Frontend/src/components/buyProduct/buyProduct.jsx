import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

function ProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product;

  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(product?.precio || 0);
  const [address, setAddress] = useState("");
  const [clientId, setClientId] = useState(null);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  // Obtener el ID del cliente
  useEffect(() => {
    axios
      .get("http://localhost:8081")
      .then((res) => {
        if (res.data.Status === "Success") {
          setClientId(res.data.id);
        }
      })
      .catch((err) => console.error("Error fetching client ID:", err));
  }, []);

  // Obtener productos recomendados basados en la categoría del producto
  useEffect(() => {
    if (product?.categoria) {
      axios
        .get(`http://localhost:8081/getProductsByCategory/${product.categoria}`)
        .then((res) => {
          if (res.data.status === "success") {
            // Filtrar para excluir el producto actualmente en consulta
            const filteredProducts = res.data.products.filter(
              (item) => item.id !== product.id
            );
            setRecommendedProducts(filteredProducts);
          } else {
            console.error(
              "Error al obtener productos recomendados:",
              res.data.message
            );
          }
        })
        .catch((err) =>
          console.error("Error al obtener productos recomendados:", err)
        )
        .finally(() => setLoadingRecommendations(false));
    }
  }, [product?.categoria]);

  if (!product) {
    return <div className="text-center mt-8">Producto no encontrado.</div>;
  }

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (value <= product.stock && value >= 1) {
      setQuantity(value);
      setTotalPrice(value * product.precio);
    }
  };

  const handlePurchase = (e) => {
    e.preventDefault();

    if (!address.trim()) {
      alert("Por favor, ingresa una dirección.");
      return;
    }

    const orderData = {
      clientID: clientId,
      orderAddress: address,
      productOrdered: product.nombre,
      productClasification: product.categoria,
      orderQuantity: quantity,
      orderAmount: totalPrice,
    };

    axios
      .post("http://localhost:8081/createOrder", orderData)
      .then((res) => {
        if (res.data.status === "success") {
          alert("Compra realizada con éxito.");
          navigate("/orders");
        } else {
          alert("Error al realizar la compra.");
        }
      })
      .catch((err) => {
        console.error("Error en la compra:", err);
        alert("Hubo un problema al procesar tu compra.");
      });
  };

  const goToProductDetails = (item) => {
    navigate("/productDetails", { state: { product: item } }); // Navega a la misma página con el producto seleccionado
  };

  return (
    <div className="max-w-6xl mx-auto p-6 pt-20 bg-gray-100 min-h-screen">
      <div className="mb-4 text-center">
        <p className="text-gray-600">
          ID del Usuario: <span className="font-bold">{clientId}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 flex justify-center">
          <img
            src={`http://localhost:8081/images/${product.imagen}` || "https://via.placeholder.com/250"}
            alt={product.nombre}
            className="w-80 h-80 object-cover rounded-lg shadow-md"
          />
        </div>

        <div className="col-span-1">
          <h1 className="text-2xl font-bold mb-4">{product.nombre}</h1>
          <p className="text-gray-600 mb-4">{product.descripcion}</p>
          <p className="text-gray-800 text-xl font-bold mb-2">
            Precio por unidad: ${product.precio.toFixed(2)}
          </p>
          <p className="text-gray-600">
            Stock disponible: <span className="font-bold">{product.stock}</span>
          </p>
        </div>

        <div className="bg-white shadow-lg p-6 rounded-lg">
          <h2 className="text-lg font-bold mb-4">Comprar</h2>
          <form onSubmit={handlePurchase}>
            <div className="mb-4 flex items-center">
              <label className="text-gray-700 mr-4">Cantidad:</label>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={handleQuantityChange}
                className="w-16 p-2 border rounded-lg text-center"
              />
            </div>

            <p className="text-gray-800 text-xl font-bold mb-4">
              Total: ${totalPrice.toFixed(2)}
            </p>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Dirección</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                placeholder="Ingresa tu dirección"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Tarjeta</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                placeholder="Número de tarjeta"
              />
            </div>

            {/* Vencimiento */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Vencimiento</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                placeholder="MM/AA"
              />
            </div>

            {/* CVV */}
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">CVV</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                placeholder="CVV"
              />
            </div>

            {/* Botón Comprar */}
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
            >
              Comprar
            </button>
          </form>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Artículos Recomendados</h2>
        <div className="flex overflow-x-auto space-x-4">
          {loadingRecommendations ? (
            <p>Cargando productos recomendados...</p>
          ) : (
            recommendedProducts.map((item) => (
              <div
                key={item.id}
                className="min-w-[200px] bg-gray-200 rounded-lg p-4 shadow"
              >
                <img
                  src={`http://localhost:8081/images/${item.imagen}` || "https://via.placeholder.com/150"}
                  alt={item.nombre}
                  className="w-full h-32 object-cover rounded-md mb-2"
                />
                <h3 className="text-md font-bold text-gray-800">
                  {item.nombre}
                </h3>
                <p className="text-sm text-gray-600">{item.descripcion}</p>
                <p className="text-sm text-gray-800 font-bold">
                  Precio: ${item.precio}
                </p>
                <button
                  onClick={() => goToProductDetails(item)}
                  className="mt-2 bg-blue-600 text-white py-1 px-4 rounded-lg hover:bg-blue-700 transition"
                >
                  Ver Detalles
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
