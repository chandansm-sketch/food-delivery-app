import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { Power, MapPin, Navigation } from 'lucide-react';
import { socket } from '../../utils/socket';

const DeliveryDashboard = () => {
    const { token, user } = useAuthStore();
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(false);
    const [availableOrders, setAvailableOrders] = useState([]);
    const [myDeliveries, setMyDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);

    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchData = async () => {
        try {
            const [availRes, myRes] = await Promise.all([
                axios.get('https://food-delivery-app-1atr.onrender.com/api/orders/delivery/available', config),
                axios.get('https://food-delivery-app-1atr.onrender.com/api/orders/delivery/my-deliveries', config)
            ]);
            setAvailableOrders(availRes.data);
            setMyDeliveries(myRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        socket.connect();
        socket.on('new_order', (newOrder) => {
            if (newOrder.status === 'Ready for Pickup') {
                setAvailableOrders(prev => {
                    if (prev.find(o => o._id === newOrder._id)) return prev;
                    return [newOrder, ...prev];
                });
            }
        });

        socket.on('order_status_updated', (updatedOrder) => {
            if (updatedOrder.status === 'Ready for Pickup') {
                setAvailableOrders(prev => {
                    if (prev.find(o => o._id === updatedOrder._id)) return prev;
                    return [updatedOrder, ...prev];
                });
            } else {
                setAvailableOrders(prev => prev.filter(o => o._id !== updatedOrder._id));
            }
        });

        return () => {
            socket.off('new_order');
            socket.off('order_status_updated');
            socket.disconnect();
        };
    }, [token]);

    const handleAcceptOrder = async (orderId) => {
        try {
            await axios.put(`https://food-delivery-app-1atr.onrender.com/api/orders/${orderId}/status`, {
                deliveryPartnerId: user._id,
                status: 'Picked Up' // or 'Accepted by Delivery'
            }, config);
            fetchData(); // Refresh lists
        } catch (err) {
            alert('Error accepting delivery');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Dashboard...</div>;

    const activeDeliveries = myDeliveries.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
    const pastDeliveries = myDeliveries.filter(o => o.status === 'Delivered');
    const totalEarnings = pastDeliveries.length * 40; // Flat ₹40 per delivery for simulation

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Rider Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Hello, {user.name}!</p>
                </div>

                {/* Toggle Duty Status */}
                <button onClick={() => setIsOnline(!isOnline)} className={`btn ${isOnline ? 'btn-success' : 'btn-danger'}`} style={{ display: 'flex', gap: '0.5rem', fontWeight: 800 }}>
                    <Power size={18} /> {isOnline ? "YOU'RE ONLINE" : "GO ONLINE"}
                </button>
            </div>

            <div className="dashboard-grid">
                {/* Assigned active deliveries */}
                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>My Active Deliveries ({activeDeliveries.length})</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {activeDeliveries.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No active deliveries right now.</p> : activeDeliveries.map(order => (
                            <div key={order._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>Order: {order._id.substring(order._id.length - 6)}</span>
                                    <span className="badge badge-ontheway" style={{ background: 'var(--primary)', color: 'white' }}>{order.status}</span>
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}><MapPin size={16} /> From: {order.restaurant?.name}</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                        <Navigation size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <span>To: {order.deliveryAddress || 'Address not provided'} <br /><small>({order.customer?.name} / {order.customer?.phone})</small></span>
                                    </div>
                                </div>
                                <button onClick={() => navigate(`/delivery/active/${order._id}`)} className="btn btn-primary" style={{ width: '100%' }}>Tracking & Navigation</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Available nearby orders - Only show if online */}
                {!isOnline ? (
                    <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
                        <div>
                            <Power size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <h3>You are currently offline.</h3>
                            <p>Go online to see delivery requests.</p>
                        </div>
                    </div>
                ) : (
                    <div className="card border-primary" style={{ borderColor: 'var(--success)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--success)' }}>Delivery Requests ({availableOrders.length})</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {availableOrders.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Looking for nearby orders...</p> : availableOrders.map(order => (
                                <div key={order._id} style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Order from <strong style={{ color: 'white' }}>{order.restaurant?.name}</strong></div>
                                    <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '1rem' }}>Earnings: ₹40</div>
                                    <button onClick={() => handleAcceptOrder(order._id)} className="btn btn-success" style={{ width: '100%' }}>Accept Delivery</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="card" style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: 'var(--primary)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, opacity: 0.9 }}>Deliveries Done</p>
                        <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{pastDeliveries.length}</h3>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, opacity: 0.9 }}>Total Earnings</p>
                        <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>₹{totalEarnings}</h3>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryDashboard;
