import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, MapPin, Clock } from 'lucide-react';

const Home = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    // Hardcoded mock categories/filters for UI display
    const categories = ['All', 'Pizza', 'Burger', 'Healthy', 'Indian', 'Desserts'];

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/restaurants');
                setRestaurants(data);
            } catch (error) {
                console.error('Error fetching restaurants', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRestaurants();
    }, []);

    const filteredRestaurants = restaurants.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
        // For demonstration, randomly associate categories based on name length if real tags don't exist
        const isMatchCategory = filterCategory === 'All' || r.name.length % categories.length === categories.indexOf(filterCategory);
        return matchesSearch && isMatchCategory;
    });

    return (
        <div className="animate-fade">
            {/* Search Header */}
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="input-field"
                        style={{ paddingLeft: '3rem', borderRadius: '9999px' }}
                        placeholder="Search for restaurants or cuisines..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`btn ${filterCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '0.5rem 1rem', borderRadius: '20px', whiteSpace: 'nowrap' }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Top restaurants near you</h1>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{filteredRestaurants.length} places found</span>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading amazing food...</div>
            ) : filteredRestaurants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No restaurants found.</div>
            ) : (
                <div className="dashboard-grid">
                    {filteredRestaurants.map((restaurant) => (
                        <Link to={`/restaurant/${restaurant._id}`} key={restaurant._id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: '160px', background: 'var(--border)', position: 'relative' }}>
                                {restaurant.banner ? (
                                    <img src={restaurant.banner} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(249, 115, 22, 0.1)', color: 'var(--primary)', fontWeight: 600 }}>No Image</div>
                                )}
                                <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--success)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                    OPEN
                                </div>
                                <div style={{ position: 'absolute', bottom: '0', left: '0', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', width: '100%', padding: '1rem', paddingTop: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                    <span style={{ background: 'white', color: 'black', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>★ {(4.0 + (restaurant.name.length % 10) * 0.1).toFixed(1)}</span>
                                </div>
                            </div>
                            <div style={{ padding: '1.25rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-light)' }}>{restaurant.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <MapPin size={16} /> {restaurant.address}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Clock size={16} /> {restaurant.hours}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Home;
