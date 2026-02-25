import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, Wallet, Banknote, ShieldCheck } from 'lucide-react';
import useCartStore from '../../store/useCartStore';
import useAuthStore from '../../store/useAuthStore';

const Checkout = () => {
    const { cart, restaurantId, clearCart } = useCartStore();
    const { token } = useAuthStore();
    const navigate = useNavigate();

    const [paymentMethod, setPaymentMethod] = useState('UPI - Google Pay');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [orderData, setOrderData] = useState(null);

    // If cart is empty, redirect
    if (cart.length === 0 && !success) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-light)', marginBottom: '1rem' }}>Cart is empty</h2>
                <button onClick={() => navigate('/')} className="btn btn-primary">Browse Restaurants</button>
            </div>
        );
    }

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const deliveryFee = 40;
    const taxes = Math.round(total * 0.05);
    const grandTotal = total + deliveryFee + taxes;

    const handleCheckout = async () => {
        const confirm1 = window.confirm(`Ready to place your order using ${paymentMethod}?`);
        if (!confirm1) return;
        const confirm2 = window.confirm(`Double Confirmation: Are you sure you want to pay ₹${grandTotal}?`);
        if (!confirm2) return;

        setLoading(true);
        setError('');

        // Simulate Payment Gateway UI delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const items = cart.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity
            }));

            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const { data } = await axios.post('https://food-delivery-app-1atr.onrender.com/api/orders', {
                restaurant: restaurantId,
                items,
                total: grandTotal,
                paymentMethod,
                deliveryAddress: deliveryAddress || 'Connaught Place, New Delhi'
            }, config);

            setOrderData(data);
            setSuccess(true);
            clearCart();
            // Automatically redirect after a longer delay allowing the user to read the receipt
            setTimeout(() => navigate(`/tracking/${data._id}`), 4000);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success && orderData) {
        return (
            <div className="animate-fade container" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '2rem' }}>
                <div style={{ display: 'inline-flex', background: 'rgba(34, 197, 94, 0.2)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                    <ShieldCheck size={56} color="var(--success)" />
                </div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--success)' }}>Order Confirmed!</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', marginBottom: '2rem' }}>Your order #{orderData._id.substring(orderData._id.length - 8)} has been placed successfully.</p>

                <div className="card text-left" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Digital Receipt</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                        {orderData.items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)' }}>
                                <span>{item.quantity}x {item.name}</span>
                                <span>₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)', borderTop: '1px dashed var(--border)', paddingTop: '1rem' }}>
                        <span>Total Paid via {orderData.paymentMethod}</span>
                        <span>₹{orderData.total}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={() => navigate(`/tracking/${orderData._id}`)} className="btn btn-primary" style={{ flex: 1 }}>Track Order Now</button>
                    <button onClick={() => navigate('/orders')} className="btn btn-outline" style={{ flex: 1 }}>View All Orders</button>
                </div>

                <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Redirecting automatically...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade dashboard-grid text-left">
            <div className="card">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Order Summary</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    {cart.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                            <div>
                                <span style={{ fontWeight: 600 }}>{item.name}</span> <span style={{ color: 'var(--text-muted)' }}>x{item.quantity}</span>
                            </div>
                            <div style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <span>Item Total</span>
                    <span>₹{total}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <span>Delivery Partner Fee</span>
                    <span>₹{deliveryFee}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <span>Taxes</span>
                    <span>₹{taxes}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>
                    <span>TO PAY</span>
                    <span>₹{grandTotal}</span>
                </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Delivery & Payment</h2>

                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-light)' }}>Delivery Address</h3>
                    <input
                        type="text"
                        placeholder="Enter full address (e.g. Flat 101, Connaught Place...)"
                        className="input-field"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        required
                    />
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-light)' }}>Payment Method</h3>

                {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: 'auto' }}>
                    <label className={`btn ${paymentMethod === 'UPI - Google Pay' ? 'btn-primary' : 'btn-outline'}`} style={{ display: 'flex', justifyContent: 'flex-start', gap: '1rem', padding: '1rem' }}>
                        <input type="radio" value="UPI - Google Pay" checked={paymentMethod === 'UPI - Google Pay'} onChange={() => setPaymentMethod('UPI - Google Pay')} style={{ display: 'none' }} />
                        <Wallet /> Google Pay
                    </label>
                    <label className={`btn ${paymentMethod === 'UPI - PhonePe' ? 'btn-primary' : 'btn-outline'}`} style={{ display: 'flex', justifyContent: 'flex-start', gap: '1rem', padding: '1rem' }}>
                        <input type="radio" value="UPI - PhonePe" checked={paymentMethod === 'UPI - PhonePe'} onChange={() => setPaymentMethod('UPI - PhonePe')} style={{ display: 'none' }} />
                        <Wallet /> PhonePe
                    </label>
                    <label className={`btn ${paymentMethod === 'UPI - Paytm' ? 'btn-primary' : 'btn-outline'}`} style={{ display: 'flex', justifyContent: 'flex-start', gap: '1rem', padding: '1rem' }}>
                        <input type="radio" value="UPI - Paytm" checked={paymentMethod === 'UPI - Paytm'} onChange={() => setPaymentMethod('UPI - Paytm')} style={{ display: 'none' }} />
                        <Wallet /> Paytm
                    </label>
                    <label className={`btn ${paymentMethod === 'Card' ? 'btn-primary' : 'btn-outline'}`} style={{ display: 'flex', justifyContent: 'flex-start', gap: '1rem', padding: '1rem' }}>
                        <input type="radio" value="Card" checked={paymentMethod === 'Card'} onChange={() => setPaymentMethod('Card')} style={{ display: 'none' }} />
                        <CreditCard /> Credit / Debit Card
                    </label>
                    <label className={`btn ${paymentMethod === 'COD' ? 'btn-primary' : 'btn-outline'}`} style={{ display: 'flex', justifyContent: 'flex-start', gap: '1rem', padding: '1rem' }}>
                        <input type="radio" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} style={{ display: 'none' }} />
                        <Banknote /> Cash on Delivery (COD)
                    </label>
                </div>

                <button onClick={handleCheckout} className="btn btn-primary" style={{ marginTop: '2rem', width: '100%', padding: '1rem', fontSize: '1.125rem' }} disabled={loading}>
                    {loading ? 'Processing Payment...' : `Pay ₹${grandTotal} & Place Order`}
                </button>
            </div>
        </div>
    );
};

export default Checkout;
