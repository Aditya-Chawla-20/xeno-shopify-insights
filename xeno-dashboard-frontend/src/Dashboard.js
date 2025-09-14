import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const LogoutButton = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return <button className="logout-button" onClick={handleLogout}>Logout</button>;
};

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [ordersByDate, setOrdersByDate] = useState(null);
    const [topCustomers, setTopCustomers] = useState([]);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchData = async () => {
            const token = localStorage.getItem('authToken');
            const decodedToken = jwtDecode(token);
            const tenantId = decodedToken.tenantId;

            const apiClient = axios.create({
                baseURL: API_BASE_URL,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            try {
                const [summaryRes, ordersRes, topCustomersRes] = await Promise.all([
                    apiClient.get(`/metrics/${tenantId}/summary`),
                    apiClient.get(`/metrics/${tenantId}/orders-by-date`),
                    apiClient.get(`/metrics/${tenantId}/top-customers`)
                ]);

                setSummary(summaryRes.data);
                setTopCustomers(topCustomersRes.data);

                const formattedOrdersData = {
                    labels: ordersRes.data.map(d => d.date),
                    datasets: [{
                        label: 'Daily Revenue ($)',
                        data: ordersRes.data.map(d => d.revenue),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: true,
                    }],
                };
                setOrdersByDate(formattedOrdersData);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            }
        };

        fetchData();
    }, [isAuthenticated]);

    return (
        <div className="dashboard-container">
            <header>
                <h1>Shopify Data Insights</h1>
                <LogoutButton />
            </header>
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
                <div className="chart-card">
                    <h2>Revenue Over Time</h2>
                    {ordersByDate ? <Line data={ordersByDate} /> : <p>Loading chart data...</p>}
                </div>
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