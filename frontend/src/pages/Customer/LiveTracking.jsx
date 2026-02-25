import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../../utils/socket';
import { MapPin, Navigation, Package, CheckCircle, ChefHat } from 'lucide-react';

const statuses = [
    'Pending',
    'Accepted',
    'Preparing',
    'Ready for Pickup',
    'Picked Up',
    'On the Way',
    'Delivered'
];

const LiveTracking = () => {
    const { id } = useParams();
    const [status, setStatus] = useState('Pending'); // In a real app, fetch initial status from /api/orders/:id
    const [location, setLocation] = useState(null);

    useEffect(() => {
        // Connect to Socket
        socket.connect();
        socket.emit('join_order_room', id);

        socket.on('status_updated', (newStatus) => {
            setStatus(newStatus);
        });

        socket.on('order_status_updated', (updatedOrder) => {
            if (updatedOrder._id === id) {
                setStatus(updatedOrder.status);
            }
        });

        socket.on('location_updated', (newLocation) => {
            setLocation(newLocation); // { lat, lng }
        });

        return () => {
            socket.off('status_updated');
            socket.off('order_status_updated');
            socket.off('location_updated');
            socket.disconnect();
        };
    }, [id]);

    const currentIdx = statuses.indexOf(status);

    return (
        <div className="animate-fade container" style={{ maxWidth: '800px', paddingTop: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', textAlign: 'center' }}>Live Tracker</h1>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--primary)' }}>Order Status: {status}</h3>

                {/* Progress Bar */}
                <div style={{ position: 'relative', height: '8px', background: 'var(--border)', borderRadius: '4px', marginBottom: '3rem' }}>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--success)', borderRadius: '4px',
                        width: `${Math.max(0, (currentIdx / (statuses.length - 1)) * 100)}%`, transition: 'width 0.5s ease-out'
                    }}></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {[
                        { tag: 'Accepted', icon: ChefHat, desc: 'Restaurant confirmed your order' },
                        { tag: 'Preparing', icon: Package, desc: 'Your food is being prepared' },
                        { tag: 'Picked Up', icon: Navigation, desc: 'Delivery partner has picked up your order' },
                        { tag: 'Delivered', icon: CheckCircle, desc: 'Food delivered successfully!' },
                    ].map((step, idx) => {
                        const isCompleted = statuses.indexOf(step.tag) <= currentIdx;
                        const isCurrent = step.tag === status;
                        return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: isCompleted ? 1 : 0.4 }}>
                                <div style={{
                                    background: isCurrent ? 'var(--primary)' : isCompleted ? 'var(--success)' : 'var(--border)',
                                    padding: '0.75rem', borderRadius: '50%', color: isCompleted || isCurrent ? 'white' : 'var(--text-muted)'
                                }}>
                                    <step.icon size={20} />
                                </div>
                                <div>
                                    <h4 style={{ fontWeight: 700 }}>{step.tag}</h4>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{step.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mock Map View */}
            <div className="card" style={{ height: '300px', padding: 0, overflow: 'hidden', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#e2e8f0' }}>
                <img src="https://images.unsplash.com/photo-1524661135-423995f22e0b?q=80&w=1000&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} alt="Map Mock" />

                <div style={{ position: 'absolute', background: 'white', padding: '1rem', borderRadius: '8px', color: 'black', fontWeight: 700, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                    {location ? (
                        <>
                            <MapPin color="var(--primary)" size={32} style={{ margin: '0 auto 0.5rem' }} />
                            Driver Location<br />
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Lat: {location.lat?.toFixed(3)}, Lng: {location.lng?.toFixed(3)}</span>
                        </>
                    ) : (
                        <>Waiting for Delivery Partner location...</>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveTracking;
