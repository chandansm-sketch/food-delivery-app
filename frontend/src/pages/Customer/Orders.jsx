import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { Clock, MapPin, ChevronRight, Package } from 'lucide-react';

const Orders = () => {
    const { token } = useAuthStore();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.get('https://food-delivery-app-1atr.onrender.com/api/orders/myorders', config);
                setOrders(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [token]);

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Orders...</div>;

    if (orders.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <Package size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-light)', marginBottom: '1rem' }}>No orders yet</h2>
                <Link to="/" className="btn btn-primary">Start Browsing</Link>
            </div>
        );
    }

    // Sort heavily to push recent to top
    const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div className="animate-fade container" style={{ maxWidth: '800px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>My Orders</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sortedOrders.map(order => (
                    <div key={order._id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{order.restaurant?.name || 'Restaurant'}</h3>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                    <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    {new Date(order.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>₹{order.total}</div>
                                <span className={`badge badge-${order.status.toLowerCase().replace(' ', '')}`} style={{ marginTop: '0.5rem', display: 'inline-block' }}>{order.status}</span>
                            </div>
                        </div>

                        <div style={{ color: 'var(--text-light)', marginBottom: '1rem', lineHeight: '1.5' }}>
                            {order.items.map(item => `${item.quantity} x ${item.name}`).join(' • ')}
                        </div>

                        {order.status !== 'Delivered' && order.status !== 'Cancelled' ? (
                            <Link to={`/tracking/${order._id}`} className="btn btn-outline" style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '100%', gap: '0.5rem' }}>
                                Track Order <ChevronRight size={16} />
                            </Link>
                        ) : (
                            <button className="btn btn-outline" style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '100%', opacity: 0.8 }} disabled>
                                Order Completed
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Orders;
