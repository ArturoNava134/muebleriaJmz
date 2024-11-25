import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NavbarAdmin from "../Navbarbusqueda/Navbar";

function StockSection({ handleOrderPopup }) {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    axios.get('http://localhost:8081/Products')
      .then(res => setProducts(res.data))
      .catch(err => console.log(err));
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        axios.get(`http://localhost:8081/Products/adminSearch?q=${searchTerm}`)
          .then(res => setProducts(res.data))
          .catch(err => console.log(err));
      } else {
        axios.get('http://localhost:8081/Products')
          .then(res => setProducts(res.data))
          .catch(err => console.log(err));
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <NavbarAdmin 
        handleOrderPopup={handleOrderPopup} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
      />
      <div className="container flex-1 pb-5 flex flex-col">
        <table className="w-full border-collapse text-black dark:text-white">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-800">
              <th>Folio</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Calidad</th>
              <th>Existencia</th>
              <th>Precio</th>
              <th>PiezasMinimo</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-gray-100 dark:bg-gray-700" : ""}>
                  <td>{product.FOLIO}</td>
                  <td>{product.MARCA}</td>
                  <td>{product.MODELO}</td>
                  <td>{product.CALIDAD}</td>
                  <td>{product.EXISTENCIA}</td>
                  <td>{product.PRECIO}</td>
                  <td>{product.PIEZASMINIMO}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-5">No hay resultados</td>
              </tr>
            )}
            <tr style={{ height: "100%", flexGrow: 1 }}>
              <td colSpan="7"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StockSection;
