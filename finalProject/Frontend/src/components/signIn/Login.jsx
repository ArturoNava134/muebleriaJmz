import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    axios.defaults.withCredentials = true;

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!email && !password) {
            alert('The email and password must be filled');
        } else {
            axios.post('http://localhost:8081/Login', { email, password })
                .then(res => {
                    if (res.data.Status === "Success") {
                        navigate('/');
                    } else {
                        alert(res.data.Error);
                    }
                })
                .catch(err => console.log(err));
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
            <div className="flex flex-col items-center bg-gray-200 p-6 rounded-lg shadow-md w-full max-w-md">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Sign In</h1>
                    <div className="mt-2 w-20 h-1 bg-yellow-600 mx-auto rounded"></div>
                </div>
                <form onSubmit={handleSubmit} className="w-full">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center bg-gray-300 rounded-lg p-2">
                            <MdEmail className="text-xl text-gray-600 mr-2" />
                            <input
                                type="email"
                                placeholder="Email"
                                name="email"
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-500"
                            />
                        </div>
                        <div className="flex items-center bg-gray-300 rounded-lg p-2">
                            <RiLockPasswordFill className="text-xl text-gray-600 mr-2" />
                            <input
                                type="password"
                                placeholder="Password"
                                name="password"
                                onChange={(e) => setPassword(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4 text-center text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/Register" className="text-blue-500 hover:underline">
                            Register!
                        </Link>
                    </div>
                    <div className="mt-6 flex justify-center">
                        <button
                            type="submit"
                            className="bg-teal-600 text-white font-bold py-2 px-6 rounded-full hover:bg-teal-700 transition duration-300"
                        >
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
