import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";


function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Estados para agregar producto
  const [id, setId] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [categoria, setCategoria] = useState("");

  // Estados para editar producto
  const [editProductId, setEditProductId] = useState(null);
  const [editId, setEditId] = useState("");
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editPrecio, setEditPrecio] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editCategoria, setEditCategoria] = useState("");
  const [auth, setAuth] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = () => {
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
  };

  const fetchCategories = () => {
    setCategories(["comedor", "habitacion", "oficina", "sala"]);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!id || !nombre || !descripcion || !precio || !stock || !categoria) {
      alert("Todos los campos son requeridos");
      return;
    }

    try {
      const response = await axios.post("http://localhost:8081/addProduct", {
        id,
        nombre,
        descripcion,
        precio: Number(precio),
        stock: Number(stock),
        categoria,
      });

      if (response.data.status === "success") {
        alert("Producto agregado correctamente");
        fetchProducts();
        setId("");
        setNombre("");
        setDescripcion("");
        setPrecio("");
        setStock("");
        setCategoria("");
      } else {
        alert(response.data.message || "Error al agregar el producto");
      }
    } catch (error) {
      console.error("Error al agregar el producto:", error);
      alert("Hubo un error al intentar agregar el producto.");
    }
  };

  const handleDeleteProduct = (id, categoria) => {
    axios
      .delete(`http://localhost:8081/deleteProduct/${categoria}/${id}`)
      .then((res) => {
        if (res.data.status === "success") {
          alert("Producto eliminado correctamente");
          fetchProducts(); // Refrescar la lista de productos
        } else {
          alert(res.data.message || "Error al eliminar el producto");
        }
      })
      .catch((err) => console.error("Error al eliminar el producto:", err));
  };

  const handleEditProduct = (product) => {
    setEditProductId(product.id);

    // Establecemos los datos actuales en los estados de edición
    setEditId(product.id);
    setEditNombre(product.nombre);
    setEditDescripcion(product.descripcion);
    setEditPrecio(product.precio);
    setEditStock(product.stock);
    setEditCategoria(product.categoria);
  };

  const handleSaveEdit = async () => {
    if (!editId || !editNombre || !editDescripcion || !editPrecio || !editStock || !editCategoria) {
      alert("Todos los campos son requeridos");
      return;
    }

    try {
      const response = await axios.put(`http://localhost:8081/editProduct/${editCategoria}/${editId}`, {
        id: editId,
        nombre: editNombre,
        descripcion: editDescripcion,
        precio: Number(editPrecio),
        stock: Number(editStock),
        categoria: editCategoria,
      });

      if (response.data.status === "success") {
        alert("Producto actualizado correctamente");
        setEditProductId(null); // Limpiar modo de edición
        fetchProducts(); // Recargar productos
      } else {
        alert(response.data.message || "Error al actualizar el producto");
      }
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
      alert("Hubo un error al intentar actualizar el producto.");
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.id?.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="min-h-screen bg-gray-100 p-6">
      {auth ? (
      <>
      <div className="flex justify-between items-center mb-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold">Gestión de Inventario</h1>
        <input
          type="text"
          placeholder="Buscar por nombre o ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border rounded-lg shadow-sm"
        />
      </div>

      {/* Formulario para agregar producto */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 max-w-6xl mx-auto">
        <form onSubmit={handleAddProduct}>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <input
              type="text"
              name="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="ID"
              className="p-2 border rounded-lg"
              required
            />
            <input
              type="text"
              name="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre"
              className="p-2 border rounded-lg"
              required
            />
            <input
              type="text"
              name="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción"
              className="p-2 border rounded-lg"
              required
            />
            <input
              type="number"
              name="precio"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="Precio"
              className="p-2 border rounded-lg"
              required
            />
            <input
              type="number"
              name="stock"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Stock"
              className="p-2 border rounded-lg"
              required
            />
            <select
              name="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="p-2 border rounded-lg"
              required
            >
              <option value="" disabled>
                Seleccionar Categoría
              </option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700"
            >
              Agregar
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de productos */}
      <div className="overflow-x-auto max-w-6xl mx-auto">
        <table className="min-w-full bg-white border rounded-lg shadow-md">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-2 px-4 text-left">ID</th>
              <th className="py-2 px-4 text-left">Nombre</th>
              <th className="py-2 px-4 text-left">Descripción</th>
              <th className="py-2 px-4 text-left">Precio</th>
              <th className="py-2 px-4 text-left">Stock</th>
              <th className="py-2 px-4 text-left">Categoría</th>
              <th className="py-2 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="border-b">
                <td className="py-2 px-4">{product.id}</td>
                <td className="py-2 px-4">
                  {editProductId === product.id ? (
                    <input
                      type="text"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="p-2 border rounded-lg w-full"
                    />
                  ) : (
                    product.nombre
                  )}
                </td>
                <td className="py-2 px-4">
                  {editProductId === product.id ? (
                    <input
                      type="text"
                      value={editDescripcion || ""}
                      onChange={(e) => setEditDescripcion(e.target.value)}
                      className="p-2 border rounded-lg w-full"
                    />
                  ) : (
                    product.descripcion || "Sin descripción"
                  )}
                </td>
                <td className="py-2 px-4">
                  {editProductId === product.id ? (
                    <input
                      type="number"
                      value={editPrecio}
                      onChange={(e) => setEditPrecio(e.target.value)}
                      className="p-2 border rounded-lg w-full"
                    />
                  ) : (
                    `$${product.precio.toFixed(2)}`
                  )}
                </td>
                <td className="py-2 px-4">
                  {editProductId === product.id ? (
                    <input
                      type="number"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      className="p-2 border rounded-lg w-full"
                    />
                  ) : (
                    product.stock
                  )}
                </td>
                <td className="py-2 px-4">
                  {editProductId === product.id ? (
                    <div className="p-2 border rounded-lg w-full bg-gray-100 cursor-not-allowed">
                      {editCategoria}
                    </div>
                  ) : (
                    product.categoria
                  )}
                </td>
                <td className="py-2 px-4 flex justify-center gap-2">
                  {editProductId === product.id ? (
                    <button
                      onClick={handleSaveEdit}
                      className="bg-green-600 text-white py-1 px-4 rounded-lg hover:bg-green-700"
                    >
                      Guardar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="bg-blue-600 text-white py-1 px-4 rounded-lg hover:bg-blue-700"
                    >
                      Editar
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteProduct(product.id, product.categoria)}
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

export default AdminProducts;
