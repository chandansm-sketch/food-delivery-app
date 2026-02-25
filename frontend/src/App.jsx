import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Utensils, LogOut, ShoppingCart, User as UserIcon, MapPin } from 'lucide-react';
import useAuthStore from './store/useAuthStore';
import useCartStore from './store/useCartStore';
import Login from './pages/Auth/Login';
import VerifyOTP from './pages/Auth/VerifyOTP';
import CustomerOrders from './pages/Customer/Orders';

// Placeholder Pages for initial routing (will create separate files next)
import CustomerHome from './pages/Customer/Home';
import RestaurantPage from './pages/Customer/RestaurantPage';
import Checkout from './pages/Customer/Checkout';
import LiveTracking from './pages/Customer/LiveTracking';

import OwnerDashboard from './pages/Owner/Dashboard';
import DeliveryDashboard from './pages/Delivery/Dashboard';
import ActiveDelivery from './pages/Delivery/ActiveDelivery';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === 'customer') return <Navigate to="/" replace />;
    if (user.role === 'owner') return <Navigate to="/owner/dashboard" replace />;
    if (user.role === 'delivery') return <Navigate to="/delivery/dashboard" replace />;
  }
  return children;
};

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { cart } = useCartStore();
  const [showProfile, setShowProfile] = React.useState(false);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="navbar container">
      <Link to="/" className="nav-brand">
        <Utensils className="w-8 h-8 text-orange-500" />
        <span style={{ color: "var(--primary)" }}>FoodieDash</span>
      </Link>

      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {user ? (
          <>
            {user.role === 'customer' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <MapPin size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.875rem' }}>Connaught Place, New Delhi</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {user.role === 'customer' && (
                <>
                  <Link to="/" style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    Home
                  </Link>
                  <Link to="/orders" style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    My Orders
                  </Link>
                  <Link to="/checkout" style={{ position: 'relative', display: 'flex', alignItems: 'center', color: 'var(--text-light)' }}>
                    <ShoppingCart size={24} />
                    {totalItems > 0 && (
                      <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {totalItems}
                      </span>
                    )}
                  </Link>
                </>
              )}

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.75rem', borderRadius: '9999px', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}
                >
                  <UserIcon size={18} color="var(--primary)" />
                  <span className="font-medium" style={{ fontSize: '0.9rem' }}>{user.name}</span>
                </button>

                {showProfile && (
                  <div style={{ position: 'absolute', top: '120%', right: '0', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', width: '220px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 100 }}>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                      <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-light)' }}>{user.name}</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user.phone}</p>
                      <span className="badge" style={{ background: 'var(--primary)', color: 'white', display: 'inline-block', marginTop: '0.5rem' }}>{user.role}</span>
                    </div>
                    <button onClick={logout} className="btn btn-outline" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%', padding: '0.5rem', justifyContent: 'center' }}>
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary">Sign In</Link>
        )}
      </div>
    </nav>
  );
};

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <Navbar />
      <div className="container" style={{ marginTop: '2rem' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />

          {/* Customer Routes */}
          <Route path="/" element={
            <ProtectedRoute allowedRole="customer">
              <CustomerHome />
            </ProtectedRoute>
          } />
          <Route path="/restaurant/:id" element={
            <ProtectedRoute allowedRole="customer">
              <RestaurantPage />
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute allowedRole="customer">
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute allowedRole="customer">
              <CustomerOrders />
            </ProtectedRoute>
          } />
          <Route path="/tracking/:id" element={
            <ProtectedRoute allowedRole="customer">
              <LiveTracking />
            </ProtectedRoute>
          } />

          {/* Owner Routes */}
          <Route path="/owner/dashboard" element={
            <ProtectedRoute allowedRole="owner">
              <OwnerDashboard />
            </ProtectedRoute>
          } />

          {/* Delivery Routes */}
          <Route path="/delivery/dashboard" element={
            <ProtectedRoute allowedRole="delivery">
              <DeliveryDashboard />
            </ProtectedRoute>
          } />
          <Route path="/delivery/active/:id" element={
            <ProtectedRoute allowedRole="delivery">
              <ActiveDelivery />
            </ProtectedRoute>
          } />

          {/* Catch All Route depending on role */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
