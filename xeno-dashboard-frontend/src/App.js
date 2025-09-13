import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './Dashboard.css';

// Register Chart.js components you'll use
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// --- ⬇️ IMPORTANT: Replace this with your actual Tenant ID ⬇️ ---
const TENANT_ID = '6f817f7b-c259-461d-8e6e-437f714d6d4a'; 
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// A simple component for the logout button
const LogoutButton = () => {
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
    };
    return <button className="logout-button" onClick={handleLogout}>Logout</button>;
};

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [ordersByDate, setOrdersByDate] = useState(null);
    const [topCustomers, setTopCustomers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            // Get the authentication token from local storage
            const token = localStorage.getItem('authToken');
            if (!token) {
                // If no token is found, redirect to login
                window.location.href = '/login';
                return;
            }

            // Create an Axios instance with the authorization header
            const apiClient = axios.create({
                baseURL: API_BASE_URL,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            try {
                // Fetch all data in parallel using the authenticated client
                const [summaryRes, ordersRes, topCustomersRes] = await Promise.all([
                    apiClient.get(`/metrics/${TENANT_ID}/summary`),
                    apiClient.get(`/metrics/${TENANT_ID}/orders-by-date`),
                    apiClient.get(`/metrics/${TENANT_ID}/top-customers`)
                ]);

                setSummary(summaryRes.data);
                setTopCustomers(topCustomersRes.data);

                // Format data for the Line chart
                const formattedOrdersData = {
                    labels: ordersRes.data.map(d => d.date),
                    datasets: [
                        {
                            label: 'Daily Revenue ($)',
                            data: ordersRes.data.map(d => d.revenue),
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: true,
                        },
                    ],
                };
                setOrdersByDate(formattedOrdersData);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                // If the token is invalid or expired (401 error), log the user out
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('authToken');
                    window.location.href = '/login';
                }
            }
        };

        fetchData();
    }, []);

    return (
        <div className="dashboard-container">
            <header>
                <h1>Shopify Data Insights</h1>
                <LogoutButton />
            </header>

            {/* Summary Metrics */}
            <div className="summary-cards">
                <div className="card">
                    <h2>Total Revenue</h2>
                    <p>${summary ? summary.totalRevenue.toFixed(2) : '0.00'}</p>
                </div>
                <div className="card">
                    <h2>Total Orders</h2>
                    <p>{summary ? summary.totalOrders : '0'}</p>
                </div>
                <div className="card">
                    <h2>Total Customers</h2>
                    <p>{summary ? summary.totalCustomers : '0'}</p>
                </div>
            </div>

            <div className="charts-container">
                {/* Orders by Date Chart */}
                <div className="chart-card">
                    <h2>Revenue Over Time</h2>
                    {ordersByDate ? <Line data={ordersByDate} /> : <p>Loading chart data...</p>}
                </div>

                {/* Top Customers List */}
                <div className="list-card">
                    <h2>Top Customers by Spend</h2>
                    {topCustomers.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Total Spent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topCustomers.map(customer => (
                                    <tr key={customer.id}>
                                        <td>{customer.firstName || ''} {customer.lastName || ''}</td>
                                        <td>{customer.email}</td>
                                        <td>${customer.totalSpent ? customer.totalSpent.toFixed(2) : '0.00'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p>No customer spending data to display.</p>}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;