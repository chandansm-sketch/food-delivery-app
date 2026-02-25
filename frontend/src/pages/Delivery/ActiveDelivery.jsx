import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { socket } from '../../utils/socket';
import { Map, CheckCircle } from 'lucide-react';

const ActiveDelivery = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const [order, setOrder] = useState(null);
    const [status, setStatus] = useState('');

    // Simulated driver coordinates (e.g. starting near center)
    const [coords, setCoords] = useState({ lat: 28.7041, lng: 77.1025 });

    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await axios.get('https://food-delivery-app-1atr.onrender.com/api/orders/delivery/my-deliveries', config);
                const thisOrder = data.find(o => o._id === id);
                if (thisOrder) {
                    setOrder(thisOrder);
                    setStatus(thisOrder.status);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchOrder();

        socket.connect();
        socket.emit('join_order_room', id);

        // Simulate Location Movement tracking every 3 seconds
        const interval = setInterval(() => {
            const newCoords = {
                lat: coords.lat + (Math.random() * 0.002 - 0.001),
                lng: coords.lng + (Math.random() * 0.002 - 0.001)
            };
            setCoords(newCoords);
            // Emit to customer
            socket.emit('update_location', { orderId: id, location: newCoords });
        }, 3000);

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, [id, token]);

    const updateStatus = async (newStatus) => {
        try {
            await axios.put(`https://food-delivery-app-1atr.onrender.com/api/orders/${id}/status`, { status: newStatus }, config);
            setStatus(newStatus);
            // Emit real-time status change to Customer
            socket.emit('update_status', { orderId: id, status: newStatus });

            if (newStatus === 'Delivered') {
                setTimeout(() => navigate('/delivery/dashboard'), 2000);
            }
        } catch (err) {
            alert('Failed to update status');
        }
    };

    if (!order) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Order details...</div>;

    return (
        <div className="animate-fade container" style={{ maxWidth: '600px', paddingTop: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Map /> Live Navigation
            </h1>

            <div className="card" style={{ padding: 0, overflow: 'hidden', height: '300px', marginBottom: '2rem', background: '#334155', position: 'relative' }}>
                <img src="https://images.unsplash.com/photo-1524661135-423995f22e0b?q=80&w=1000&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="Map Navigation" />
                <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: 600, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                    Lat: {coords.lat.toFixed(4)} | Lng: {coords.lng.toFixed(4)}
                </div>
            </div>

            <div className="card">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Order Details</h2>
                <div style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                    <p style={{ marginBottom: '0.5rem' }}><strong>Pickup:</strong> {order.restaurant?.name} - {order.restaurant?.address}</p>
                    <p><strong>Deliver To:</strong> {order.deliveryAddress || 'Address not provided'}</p>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Customer: {order.customer?.name} ({order.customer?.phone})</p>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-light)' }}>Update Status</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {status !== 'On the Way' && status !== 'Delivered' && (
                        <button onClick={() => updateStatus('On the Way')} className="btn btn-primary" style={{ padding: '1rem', fontSize: '1rem' }}>
                            Confirm Pickup & Start Navigation
                        </button>
                    )}

                    {status === 'On the Way' && (
                        <button onClick={() => updateStatus('Delivered')} className="btn btn-success" style={{ padding: '1rem', fontSize: '1rem' }}>
                            <CheckCircle size={20} style={{ marginRight: '0.5rem' }} /> Mark as Delivered
                        </button>
                    )}

                    {status === 'Delivered' && (
                        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--success)', fontWeight: 700 }}>
                            Delivery Completed! Returning to dashboard...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActiveDelivery;
