import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Products() {
  const [auth, setAuth] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8081/getAllProducts")
      .then((res) => {
        if (res.data.status === "success") {
          setProducts(res.data.data);
        } else {
          console.error("Error fetching products:", res.data.message);
        }
      })
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

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
    <div className="flex flex-col items-center min-h-screen bg-gray-100 px-4 py-6">
      {auth ? (
        <>
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Productos</h1>
          {/* Cuadrícula de Productos */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full max-w-6xl">
            {products.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-4 bg-white shadow-lg hover:shadow-2xl transition"
              >
                <img
                  src={product.imagen || "https://via.placeholder.com/250"}
                  alt={product.nombre}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {product.nombre}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {product.descripción}
                </p>
                <p className="text-red-600 text-lg font-bold mb-4">
                  ${product.precio.toFixed(2)}
                </p>
                <button className="block mx-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                  Comprar
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Parece que no has iniciado sesión :c
          </h1>
          <Link
            to="/Login"
            className="text-lg font-semibold text-blue-600 hover:underline"
          >
            Iniciar Sesión
          </Link>
        </div>
      )}
    </div>
  );
}

export default Products;
