// src/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './Dashboard.css';

// Register Chart.js components you'll use
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// --- ⬇️ IMPORTANT: Replace this with your actual Tenant ID ⬇️ ---
const TENANT_ID = '6f817f7b-c259-461d-8e6e-437f714d6d4a'; 
const API_BASE_URL = 'http://localhost:4000';

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [ordersByDate, setOrdersByDate] = useState(null);
    const [topCustomers, setTopCustomers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all data in parallel for speed
                const [summaryRes, ordersRes, topCustomersRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/metrics/${TENANT_ID}/summary`),
                    axios.get(`${API_BASE_URL}/metrics/${TENANT_ID}/orders-by-date`),
                    axios.get(`${API_BASE_URL}/metrics/${TENANT_ID}/top-customers`)
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
                alert("Could not fetch data from the backend. Make sure the backend server is running.");
            }
        };

        fetchData();
    }, []);

    return (
        <div className="dashboard-container">
            <header>
                <h1>Shopify Data Insights</h1>
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