import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar/Navbar";
import Products from "./components/Products/Products";
import Login from "./components/signIn/Login"
import Register from "./components/signUp/Register";
import LoginAdmin from "./components/adminSignIn/loginAdmin";
import NavbarAdmin from "./components/NavbarAdmin/navbarAdmin";
import AdminOrders from "./components/gestionarOrdenes/manageOrders";
import AdminProducts from "./components/gestionarProductos/manageProducts";
import NotificationsPage from "./components/notificaciones/notificaciones";
import Orders from "./components/viewOrders/viewOrders";
import UsersPage from "./components/manageUsers/manageUsers";
import AOS from "aos";
import "aos/dist/aos.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProductDetails from "./components/buyProduct/buyProduct";

const App = () => {
  const [orderPopup, setOrderPopup] = useState(false);

  const handleOrderPopup = () => {
    setOrderPopup(!orderPopup);
  };

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-in-sine",
      delay: 100,
      offset: 100,
    });
    AOS.refresh();
  }, []);

  return (
    <Router>
      <div className="bg-white dark:bg-gray-900 dark:text-white duration-200 overflow-hidden">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Products />
              </>
            }
          />
          <Route
            path="/loginAdmin"
            element={
              <>
                <LoginAdmin />
              </>
            }
          />
          <Route
            path="/Login"
            element={
              <>
                <Login />
              </>
            }
          />
          <Route
          path="/Register"
          element={
            <>
              <Register />
            </>
          }
        />

        <Route
            path="/adminSection"
            element={
              <>
                <NavbarAdmin />
                <AdminProducts />
              </>
            }
          />

          <Route
            path="/manageOrders"
            element={
              <>
                <NavbarAdmin />
                <AdminOrders />
              </>
            }
          />

          <Route
            path="/productDetails"
            element={
              <>
                <Navbar />
                <ProductDetails />
              </>
            }
          />
           <Route
            path="/Orders"
            element={
              <>
                <Navbar />
                <Orders />
              </>
            }
          />
          <Route
            path="/notifications"
            element={
              <>
                <Navbar />
                <NotificationsPage />
              </>
            }
          />
          <Route
            path="/manageUsers"
            element={
              <>
                <NavbarAdmin />
                <UsersPage />
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
