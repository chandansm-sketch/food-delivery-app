import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Phone, Users, ChefHat, Bike } from 'lucide-react';

const Login = () => {
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('customer');
    const [name, setName] = useState(''); // Only required for new users technically, but we collect it to be safe
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }
        const fullPhone = '+91' + phone;
        setError('');
        setLoading(true);
        try {
            // For development, assuming backend is on 5000
            await axios.post('http://localhost:5000/api/auth/request-otp', {
                phone: fullPhone,
                role,
                name: name || 'User'
            });
            // Route to verifyOTP state
            navigate(`/verify-otp?phone=${encodeURIComponent(fullPhone)}`);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card animate-fade" style={{ width: '100%', maxWidth: '420px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                    Welcome to FoodieDash
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Log in or sign up to continue.
                </p>

                {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}

                <form onSubmit={handleRequestOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Select Role</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" onClick={() => setRole('customer')} className={`btn ${role === 'customer' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, padding: '0.5rem', gap: '0.25rem' }}>
                                <Users size={16} /> User
                            </button>
                            <button type="button" onClick={() => setRole('owner')} className={`btn ${role === 'owner' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, padding: '0.5rem', gap: '0.25rem' }}>
                                <ChefHat size={16} /> Owner
                            </button>
                            <button type="button" onClick={() => setRole('delivery')} className={`btn ${role === 'delivery' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, padding: '0.5rem', gap: '0.25rem' }}>
                                <Bike size={16} /> Delivery
                            </button>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Full Name (for new users)</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. Rahul Sharma"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Phone Number</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <div style={{ position: 'absolute', left: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                <Phone size={18} />
                                <span style={{ fontWeight: 600, color: 'var(--text-light)' }}>+91</span>
                            </div>
                            <input
                                type="tel"
                                className="input-field"
                                style={{ paddingLeft: '5rem' }}
                                placeholder="9876543210"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} disabled={loading}>
                        {loading ? 'Sending OTP...' : 'Get OTP'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2rem' }}>
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
};

export default Login;
