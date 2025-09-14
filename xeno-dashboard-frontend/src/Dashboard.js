import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
// CHANGE: Import Bar instead of Line
import { Bar } from 'react-chartjs-2'; 
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

// CHANGE: Register BarElement for the new chart
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const LogoutButton = ({ userEmail }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (
        <div className="user-info">
            <span className="user-email">{userEmail}</span>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
    );
};

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [revenueData, setRevenueData] = useState(null);
    const [topCustomers, setTopCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const { isAuthenticated } = useAuth();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        const decodedToken = jwtDecode(token);
        const tenantId = decodedToken.tenantId;
        
        setUserName(decodedToken.name || 'User');
        setUserEmail(decodedToken.email || '');

        const apiClient = axios.create({
            baseURL: API_BASE_URL,
            headers: { 'Authorization': `Bearer ${token}` }
        });

        try {
            const [summaryRes, revenueRes, topCustomersRes] = await Promise.all([
                apiClient.get(`/metrics/${tenantId}/summary`),
                apiClient.get(`/metrics/${tenantId}/revenue-over-time`),
                apiClient.get(`/metrics/${tenantId}/top-customers`)
            ]);

            setSummary(summaryRes.data);
            setTopCustomers(topCustomersRes.data);

            const formattedRevenueData = {
                labels: revenueRes.data.map(d => d.date),
                datasets: [{
                    label: 'Daily Revenue ($)',
                    data: revenueRes.data.map(d => d.revenue),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                }],
            };
            setRevenueData(formattedRevenueData);

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated, fetchData]);

    return (
        <div className="dashboard-container">
            <header>
                <div className="header-text">
                    <h1>Welcome Back, {userName}!</h1>
                    <p>Here's a snapshot of your store's performance.</p>
                </div>
                <LogoutButton userEmail={userEmail} />
            </header>

            <div className="summary-cards">
                <div className="card">
                    <h2>Total Revenue</h2>
                    {isLoading ? <div className="skeleton skeleton-text-large"></div> : <p>${summary ? summary.totalRevenue.toFixed(2) : '0.00'}</p>}
                </div>
                <div className="card">
                    <h2>Total Orders</h2>
                    {isLoading ? <div className="skeleton skeleton-text-large"></div> : <p>{summary ? summary.totalOrders : '0'}</p>}
                </div>
                <div className="card">
                    <h2>Total Customers</h2>
                    {isLoading ? <div className="skeleton skeleton-text-large"></div> : <p>{summary ? summary.totalCustomers : '0'}</p>}
                </div>
                <div className="card">
                    <h2>Total Products</h2>
                    {isLoading ? <div className="skeleton skeleton-text-large"></div> : <p>{summary ? summary.totalProducts : '0'}</p>}
                </div>
            </div>

            <div className="charts-container">
                <div className="chart-card">
                    <h2>Revenue Over Time</h2>
                    {/* CHANGE: Replaced Line with Bar */}
                    {isLoading ? <div className="skeleton skeleton-chart"></div> : <Bar data={revenueData || { labels: [], datasets: [] }} />}
                </div>

                <div className="list-card">
                    <h2>Top Customers by Spend</h2>
                    {isLoading ? (
                        <div>
                            <div className="skeleton skeleton-list-item"></div>
                            <div className="skeleton skeleton-list-item"></div>
                            <div className="skeleton skeleton-list-item"></div>
                        </div>
                    ) : (
                        topCustomers.length > 0 ? (
                            <ul className="customer-list">
                                {topCustomers.map(customer => (
                                    <li key={customer.id} className="customer-item">
                                        <div className="customer-avatar">
                                            {(customer.firstName?.charAt(0) || '')}{(customer.lastName?.charAt(0) || '')}
                                        </div>
                                        <div className="customer-details">
                                            <span className="customer-name">{customer.firstName} {customer.lastName}</span>
                                            <span className="customer-email">{customer.email}</span>
                                        </div>
                                        <span className="customer-spent">${customer.totalSpent.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p>No customer spending data to display.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;