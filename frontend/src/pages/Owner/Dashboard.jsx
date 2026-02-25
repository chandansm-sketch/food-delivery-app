import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { Settings, PlusCircle, Check, X, Truck, Trash2, MapPin, Building2, Plus, Edit } from 'lucide-react';
import { socket } from '../../utils/socket';

const Dashboard = () => {
    const { token, user } = useAuthStore();
    const [restaurants, setRestaurants] = useState([]);
    const [restaurant, setRestaurant] = useState(null); // Active restaurant
    const [allOrders, setAllOrders] = useState([]);
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [isCreatingProfile, setIsCreatingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ id: '', name: '', address: '', hours: '', banner: '' });
    const [menuForm, setMenuForm] = useState({ name: '', description: '', price: '', image: '' });
    const [editingMenuId, setEditingMenuId] = useState(null);

    const config = { headers: { Authorization: `Bearer ${token}` } };

    const loadMenu = async (restId) => {
        try {
            const { data } = await axios.get(`http://localhost:5000/api/restaurants/${restId}`);
            setMenu(data.menu);
        } catch (err) {
            console.error('Failed to load menu');
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch all profiles owned by user
                const { data: profiles } = await axios.get('http://localhost:5000/api/restaurants/my-profile', config);
                setRestaurants(profiles);

                const activeRes = profiles.length > 0 ? profiles[0] : null;
                setRestaurant(activeRes);

                // Fetch all orders for all restaurants
                const { data: ownerOrders } = await axios.get('http://localhost:5000/api/orders/owner', config);
                setAllOrders(ownerOrders);

                if (activeRes) {
                    await loadMenu(activeRes._id);
                }

            } catch (err) {
                console.error('Owner dashboard error', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();

        // Setup socket connections
        socket.connect();
        socket.on('new_order', (newOrder) => {
            setAllOrders(prev => {
                if (prev.find(o => o._id === newOrder._id)) return prev;
                return [newOrder, ...prev];
            });
        });

        socket.on('order_status_updated', (updatedOrder) => {
            setAllOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
        });

        return () => {
            socket.off('new_order');
            socket.off('order_status_updated');
            socket.disconnect();
        };
    }, [token]);

    const handleCreateProfile = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('http://localhost:5000/api/restaurants/profile', profileForm, config);

            // If editing an existing one, it returns updated. If creating new, returns new.
            // A simple refresh is easiest given multi-restaurant complexity
            window.location.reload();
        } catch (err) {
            alert('Error saving profile');
        }
    };

    const handleAddOrUpdateMenu = async (e) => {
        e.preventDefault();
        if (!restaurant) return;
        try {
            if (editingMenuId) {
                const { data } = await axios.put(`http://localhost:5000/api/restaurants/menu/${editingMenuId}`, menuForm, config);
                setMenu(menu.map(m => m._id === editingMenuId ? data : m));
                setEditingMenuId(null);
            } else {
                const { data } = await axios.post('http://localhost:5000/api/restaurants/menu', { ...menuForm, restaurantId: restaurant._id }, config);
                setMenu([...menu, data]);
            }
            setMenuForm({ name: '', description: '', price: '', image: '' });
        } catch (err) {
            alert('Error saving menu item.');
        }
    };

    const handleDeleteMenu = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this menu item?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/restaurants/menu/${itemId}`, config);
            setMenu(menu.filter(m => m._id !== itemId));
        } catch (err) {
            alert('Error deleting menu item');
        }
    };

    const updateOrderStatus = async (id, status) => {
        if (status === 'Accepted') {
            if (!window.confirm('Double Checking: Are you sure you want to accept and start this order?')) {
                return;
            }
        }
        try {
            const { data } = await axios.put(`http://localhost:5000/api/orders/${id}/status`, { status }, config);
            setAllOrders(allOrders.map(o => o._id === id ? data : o));
        } catch (err) {
            alert('Error updating status');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Dashboard...</div>;

    if (restaurants.length === 0 || isCreatingProfile) {
        return (
            <div className="card animate-fade" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {restaurants.length === 0 ? 'Create First Restaurant' : (profileForm.id ? 'Edit Restaurant' : 'Create New Restaurant')}
                    </h2>
                    {restaurants.length > 0 && <button onClick={() => setIsCreatingProfile(false)} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem' }}><X size={16} /></button>}
                </div>

                <form onSubmit={handleCreateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input type="text" placeholder="Restaurant Name" className="input-field" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
                    <input type="text" placeholder="Full Address" className="input-field" value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} required />
                    <input type="text" placeholder="Operating Hours (e.g. 10 AM - 11 PM)" className="input-field" value={profileForm.hours} onChange={e => setProfileForm({ ...profileForm, hours: e.target.value })} required />
                    <input type="text" placeholder="Banner Image URL" className="input-field" value={profileForm.banner} onChange={e => setProfileForm({ ...profileForm, banner: e.target.value })} />
                    <button type="submit" className="btn btn-primary mt-4">Save Profile</button>
                </form>
            </div>
        );
    }

    // Filter orders by currently active restaurant
    const orders = allOrders.filter(o => o.restaurant === restaurant._id || (o.restaurant && o.restaurant._id === restaurant._id));

    const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Accepted' || o.status === 'Preparing');
    const completedOrders = orders.filter(o => o.status === 'Delivered');

    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const todayRevenue = completedOrders
        .filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString())
        .reduce((sum, o) => sum + o.total, 0);

    // Calculate popular items
    const itemMap = {};
    completedOrders.forEach(order => {
        order.items.forEach(item => {
            itemMap[item.name] = (itemMap[item.name] || 0) + item.quantity;
        });
    });
    const popularItems = Object.entries(itemMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

    return (
        <div className="animate-fade">
            {/* Top Bar for Multi-Restaurant Selection */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <Building2 size={24} color="var(--primary)" />
                    <select
                        className="input-field"
                        style={{ width: 'auto', minWidth: '200px', fontWeight: 700 }}
                        value={restaurant._id}
                        onChange={(e) => {
                            const selected = restaurants.find(r => r._id === e.target.value);
                            setRestaurant(selected);
                            loadMenu(selected._id);
                        }}
                    >
                        {restaurants.map(r => (
                            <option key={r._id} value={r._id}>{r.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => {
                            setProfileForm({ id: '', name: '', address: '', hours: '', banner: '' });
                            setIsCreatingProfile(true);
                        }}
                        className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem' }}>
                        <Plus size={16} /> New Profile
                    </button>
                    <button
                        onClick={() => {
                            setProfileForm({ id: restaurant._id, name: restaurant.name, address: restaurant.address, hours: restaurant.hours, banner: restaurant.banner || '' });
                            setIsCreatingProfile(true);
                        }}
                        className="btn btn-outline" style={{ display: 'flex', gap: '0.5rem' }}>
                        <Settings size={16} /> Edit Current
                    </button>
                </div>
            </div>

            {/* Analytics Reporting Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(234,88,12,0.1), transparent)', border: '1px solid var(--primary)' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>Total Earnings</p>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>₹{totalRevenue}</h3>
                </div>
                <div className="card" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Today's Sales</p>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>₹{todayRevenue}</h3>
                </div>
                <div className="card" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Completed Orders</p>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{completedOrders.length}</h3>
                </div>
                <div className="card" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Top Item</p>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {popularItems.length > 0 ? popularItems[0][0] : 'N/A'}
                    </h3>
                </div>
            </div>

            <div className="dashboard-grid" style={{ marginTop: '0', gridTemplateColumns: 'minmax(300px, 2fr) minmax(300px, 1fr)' }}>

                {/* Active Orders Section */}
                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Active Orders ({pendingOrders.length})</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {pendingOrders.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No active orders at the moment.</p> : pendingOrders.map(order => (
                            <div key={order._id} style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>Order ID: {order._id.substring(order._id.length - 6)}</span>
                                    <span className={`badge badge-${order.status.toLowerCase().replace(' ', '')}`}>{order.status}</span>
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                    <MapPin size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span><strong>Deliver To:</strong> {order.deliveryAddress || 'Address not provided'}</span>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {order.status === 'Pending' && (
                                        <>
                                            <button onClick={() => updateOrderStatus(order._id, 'Accepted')} className="btn btn-success" style={{ flex: 1, padding: '0.4rem' }}><Check size={16} /> Accept</button>
                                            <button onClick={() => updateOrderStatus(order._id, 'Cancelled')} className="btn btn-danger" style={{ flex: 1, padding: '0.4rem' }}><X size={16} /> Reject</button>
                                        </>
                                    )}
                                    {order.status === 'Accepted' && (
                                        <button onClick={() => updateOrderStatus(order._id, 'Preparing')} className="btn btn-primary" style={{ width: '100%', padding: '0.4rem' }}>Start Preparing</button>
                                    )}
                                    {order.status === 'Preparing' && (
                                        <button onClick={() => updateOrderStatus(order._id, 'Ready for Pickup')} className="btn btn-success" style={{ width: '100%', padding: '0.4rem', background: '#eab308' }}><Truck size={16} style={{ marginRight: '0.25rem' }} /> Ready for Pickup</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Menu Management Section */}
                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Menu Management</h2>

                    <form onSubmit={handleAddOrUpdateMenu} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>{editingMenuId ? 'Edit Menu Item' : 'Add New Item'}</h3>
                            {editingMenuId && (
                                <button type="button" onClick={() => { setEditingMenuId(null); setMenuForm({ name: '', description: '', price: '', image: '' }); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel Reset</button>
                            )}
                        </div>
                        <input type="text" placeholder="Item Name" className="input-field" style={{ padding: '0.5rem' }} value={menuForm.name} onChange={e => setMenuForm({ ...menuForm, name: e.target.value })} required />
                        <input type="number" placeholder="Price (₹)" className="input-field" style={{ padding: '0.5rem' }} value={menuForm.price} onChange={e => setMenuForm({ ...menuForm, price: e.target.value })} required />
                        <input type="text" placeholder="Image URL (Optional)" className="input-field" style={{ padding: '0.5rem' }} value={menuForm.image} onChange={e => setMenuForm({ ...menuForm, image: e.target.value })} />
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem' }}>
                            {editingMenuId ? <Check size={16} style={{ marginRight: '0.25rem' }} /> : <PlusCircle size={16} style={{ marginRight: '0.25rem' }} />}
                            {editingMenuId ? 'Update Item' : 'Add to Menu'}
                        </button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                        {menu.map(item => (
                            <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px' }}>
                                <div>
                                    <span style={{ fontWeight: 600, display: 'block', fontSize: '0.9rem' }}>{item.name}</span>
                                    <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>₹{item.price}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', background: item.available ? 'var(--success)' : 'var(--danger)', padding: '0.1rem 0.5rem', borderRadius: '12px', color: 'white' }}>
                                        {item.available ? 'Avail' : 'Out'}
                                    </div>
                                    <button onClick={() => { setEditingMenuId(item._id); setMenuForm({ name: item.name, description: item.description || '', price: item.price, image: item.image || '' }); }} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.2rem' }}>
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteMenu(item._id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
