// src/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import './Login.css'; // We'll create this file next

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                email,
                password,
            });
            // On successful login, store the token
            localStorage.setItem('authToken', response.data.token);
            // Reload the page to be redirected to the dashboard
            window.location.href = '/';
        } catch (err) {
            setError('Invalid email or password.');
            console.error('Login failed:', err);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Login</h2>
                <p>Access your Shopify Insights Dashboard</p>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit">Login</button>
                </form>
            </div>
        </div>
    );
};

export default Login;