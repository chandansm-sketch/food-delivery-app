import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Clock, MapPin, Plus, Minus, ShoppingCart } from 'lucide-react';
import useCartStore from '../../store/useCartStore';

const RestaurantPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState({ restaurant: null, menu: [] });
    const [loading, setLoading] = useState(true);

    const { cart, addToCart, removeFromCart } = useCartStore();

    useEffect(() => {
        const fetchRestaurantInfo = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/restaurants/${id}`);
                setData(response.data);
            } catch (error) {
                console.error('Error fetching restaurant', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRestaurantInfo();
    }, [id]);

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading menu...</div>;
    if (!data.restaurant) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Restaurant not found.</div>;

    const { restaurant, menu } = data;
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalCartPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <div className="animate-fade" style={{ paddingBottom: '5rem' }}>
            {/* Back Button */}
            <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ marginBottom: '1.5rem', display: 'inline-flex', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                <ArrowLeft size={16} /> Back
            </button>

            {/* Restaurant Header */}
            <div className="card" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-light)' }}>{restaurant.name}</h1>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(249, 115, 22, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'var(--primary)' }}>
                        <MapPin size={20} /> <strong style={{ color: 'var(--text-light)' }}>Address:</strong> {restaurant.address}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem' }}><Clock size={18} /> Hours: {restaurant.hours}</span>
                </div>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Menu Options</h2>

            {/* Menu Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {menu.filter(m => m.available).map((item) => {
                    const cartItem = cart.find(i => i._id === item._id);
                    const quantity = cartItem ? cartItem.quantity : 0;

                    return (
                        <div key={item._id} className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>{item.name}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{item.description || 'Delicious food item'}</p>
                                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{item.price}</div>
                            </div>

                            <div style={{ width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                {/* Mock Image Box */}
                                <div style={{ width: '100%', height: '90px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>No Image</div>
                                    )}
                                </div>

                                {/* Add/Remove Controls */}
                                {quantity === 0 ? (
                                    <button onClick={() => addToCart(item, restaurant._id)} className="btn btn-outline" style={{ width: '100%', padding: '0.25rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                                        ADD
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'var(--primary)', borderRadius: '8px', padding: '0.25rem 0.5rem', color: 'white' }}>
                                        <button onClick={() => removeFromCart(item._id)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Minus size={16} /></button>
                                        <span style={{ fontWeight: 600 }}>{quantity}</span>
                                        <button onClick={() => addToCart(item, restaurant._id)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Plus size={16} /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Floating Cart Bar */}
            {totalItems > 0 && (
                <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '800px', zIndex: 50 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--success)', color: 'white', padding: '1rem 1.5rem', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(34,197,94,0.5)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <ShoppingCart size={24} />
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{totalItems} item{totalItems > 1 ? 's' : ''}</div>
                                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total: ₹{totalCartPrice}</div>
                            </div>
                        </div>
                        <button onClick={() => navigate('/checkout')} className="btn" style={{ background: 'white', color: 'var(--success)', fontWeight: 700, border: 'none' }}>
                            Checkout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestaurantPage;
