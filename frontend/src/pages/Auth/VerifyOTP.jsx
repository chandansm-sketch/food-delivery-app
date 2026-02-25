import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Lock } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const VerifyOTP = () => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const location = useLocation();
    const login = useAuthStore(state => state.login);

    // Parse phone from query params
    const queryParams = new URLSearchParams(location.search);
    const phone = queryParams.get('phone');

    useEffect(() => {
        if (!phone) {
            navigate('/login');
        }
    }, [phone, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('OTP must be 6 digits');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const { data } = await axios.post('http://localhost:5000/api/auth/verify-otp', {
                phone,
                otp
            });

            // Valid response => update Zustand store
            login({ _id: data._id, name: data.name, phone: data.phone, role: data.role }, data.token);

            // Route depending on role
            switch (data.role) {
                case 'owner':
                    navigate('/owner/dashboard');
                    break;
                case 'delivery':
                    navigate('/delivery/dashboard');
                    break;
                case 'customer':
                default:
                    navigate('/');
                    break;
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card animate-fade" style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                        <Lock size={32} style={{ color: 'var(--primary)' }} />
                    </div>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>
                    Verify OTP
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
                    We've sent a 6-digit code to <strong>{phone}</strong>.<br /><br />
                    <span style={{ color: 'var(--success)' }}>(Mock Hint: Use <strong>123456</strong>)</span>
                </p>

                {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}

                <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Enter OTP</label>
                        <input
                            type="text"
                            maxLength="6"
                            className="input-field"
                            style={{ fontSize: '1.5rem', letterSpacing: '0.5em', textAlign: 'center' }}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
                    <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                        Change phone number?
                    </button>
                </p>
            </div>
        </div>
    );
};

export default VerifyOTP;
