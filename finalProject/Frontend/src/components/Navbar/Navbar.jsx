import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
    const [auth, setAuth] = useState(false);
    const [name, setName] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    axios.defaults.withCredentials = true;

    useEffect(() => {
        axios
            .get('http://localhost:8081')
            .then((res) => {
                if (res.data.Status === 'Success') {
                    setAuth(true);
                    setName(res.data.name);
                } else {
                    setAuth(false);
                }
            })
            .catch((err) => console.log(err));
    }, []);

    const handleDelete = () => {
        axios
            .get('http://localhost:8081/Logout')
            .then(() => {
                location.reload(true);
            })
            .catch((err) => console.log(err));
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
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
                        to="/"
                        className="block px-4 py-2 lg:py-0 hover:bg-gray-700 lg:hover:bg-transparent"
                    >
                        <li>Home</li>
                    </Link>
                    

                    {auth ? (
                        <>
                            <li className="block px-4 py-2 lg:py-0">
                                Welcome, <span className="font-semibold">{name}</span>
                            </li>
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

