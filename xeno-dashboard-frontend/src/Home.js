// src/Home.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './Dashboard';
import ConnectStore from './ConnectStore';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const Home = () => {
    const [hasStore, setHasStore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkStoreStatus = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        const decodedToken = jwtDecode(token);
        const tenantId = decodedToken.tenantId;

        try {
            const apiClient = axios.create({
                baseURL: API_BASE_URL,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const response = await apiClient.get(`/shopify/stores/${tenantId}`);
            
            // If the array is not empty, a store is connected
            if (response.data.length > 0) {
                setHasStore(true);
            } else {
                setHasStore(false);
            }
        } catch (error) {
            console.error("Error checking store status", error);
            setHasStore(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkStoreStatus();
    }, []);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    // If a store is connected, show the dashboard.
    // If not, show the ConnectStore page and pass the function to re-check when successful.
    return hasStore ? <Dashboard /> : <ConnectStore onConnectSuccess={checkStoreStatus} />;
};

export default Home;