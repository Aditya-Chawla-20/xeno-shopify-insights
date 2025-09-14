import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const ConnectStore = ({ onConnectSuccess }) => {
    const [shopDomain, setShopDomain] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('authToken');
            const apiClient = axios.create({
                baseURL: API_BASE_URL,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const connectResponse = await apiClient.post('/shopify/connect', { shopDomain, accessToken });
            const storeId = connectResponse.data.id;
            
            await Promise.all([
                apiClient.post('/sync/products', { storeId }),
                apiClient.post('/sync/customers', { storeId }),
                apiClient.post('/sync/orders', { storeId })
            ]);

            onConnectSuccess();

        } catch (err) {
            setError('Failed to connect and sync store. Please check your credentials.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Connect Your Shopify Store</h2>
                <p>Enter your store details to begin syncing data.</p>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="shopDomain">Shop Domain</label>
                        <input
                            id="shopDomain"
                            type="text"
                            value={shopDomain}
                            onChange={(e) => setShopDomain(e.target.value)}
                            placeholder="example.myshopify.com"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="accessToken">Admin API Access Token</label>
                        <input
                            id="accessToken"
                            type="password"
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            placeholder="shpat_..."
                            required
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Connecting & Syncing...' : 'Connect and Sync'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ConnectStore;