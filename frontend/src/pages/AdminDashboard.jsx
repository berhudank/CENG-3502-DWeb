// flyticket/frontend/src/pages/AdminDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('flights'); // 'flights' or 'bookings'

    // Data State
    const [flights, setFlights] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [cities, setCities] = useState([]);
    const [error, setError] = useState(null);

    // Form State for Add/Edit
    const [showForm, setShowForm] = useState(false);
    const [editingFlightId, setEditingFlightId] = useState(null);
    const [formData, setFormData] = useState({
        from_city: '', to_city: '', departure_time: '', arrival_time: '', price: '', seats_total: ''
    });

    // 1. Wrap fetchData in useCallback to cache it and satisfy React's dependency rules
    const fetchData = useCallback(async () => {
        try {
            if (activeTab === 'flights') {
                const response = await apiClient('/flights');
                setFlights(response.data);
            } else if (activeTab === 'bookings') {
                const response = await apiClient('/admin/bookings');
                setBookings(response.data);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load data: ' + err.message);
        }
    }, [activeTab]); // It will re-create the function ONLY if activeTab changes

    // 2. Safely call it inside useEffect
    useEffect(() => {
        const initializeDashboard = async () => {
            // STEP 1: Verify Session
            try {
                //console.log("CHECK-SESSION IS ABOUT TO BE CALLED");
                await apiClient('/admin/check-session');
            } catch {
                // If this fails, they are not logged in. Kick them out instantly.
                navigate('/admin/login');
                return; // CRITICAL: Stop the function here so we don't try to fetch data
            }
            // STEP 2: Fetch Data (Only runs if Step 1 succeeded)
            fetchData();
            
            // STEP 3: Fetch Cities
            try {
                const response = await apiClient('/cities');
                setCities(response.data);
            } catch (err) {
                console.error("Failed to load cities", err);
            }
        };

        initializeDashboard();
    }, [navigate, fetchData]); // We add fetchData to the dependencies safely now



    // 3. Handle Flight Deletion
    const handleDeleteFlight = async (flightId) => {
        if (!window.confirm('Are you sure you want to delete this flight?')) return;

        try {
            await apiClient(`/flights/${flightId}`, { method: 'DELETE' });
            alert('Flight deleted successfully.');
            fetchData(); // Refresh the table
        } catch (err) {
            alert(err.message); // e.g., "Cannot delete flight. Active bookings exist."
        }
    };

    // 4. Handle Form Submission (Create or Update)
    const handleFlightSubmit = async (e) => {
        e.preventDefault();
        
        if (parseFloat(formData.price) < 0) {
            alert('Price cannot be negative.');
            return;
        }
        
        const now = new Date();
        const depTime = new Date(formData.departure_time);
        const arrTime = new Date(formData.arrival_time);
        
        if (depTime < now || arrTime < now) {
            alert('Cannot select a past date or time.');
            return;
        }
        
        if (arrTime <= depTime) {
            alert('Arrival time must be after departure time.');
            return;
        }

        try {
            if (editingFlightId) {
                // Update existing
                await apiClient(`/flights/${editingFlightId}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                alert('Flight updated successfully!');
            } else {
                // Create new
                await apiClient('/flights', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                alert('Flight created successfully!');
            }
            setShowForm(false);
            setEditingFlightId(null);
            fetchData();
        } catch (err) {
            alert('Error: ' + err.message); // Will show our strict runway rule errors
        }
    };

    const openEditForm = (flight) => {
        setFormData({
            from_city: flight.from_city,
            to_city: flight.to_city,
            // Format datetime correctly for HTML5 datetime-local input
            departure_time: flight.departure_time.replace(' ', 'T').slice(0, 16),
            arrival_time: flight.arrival_time.replace(' ', 'T').slice(0, 16),
            price: flight.price,
            seats_total: flight.seats_total
        });
        setEditingFlightId(flight.flight_id);
        setShowForm(true);
    };

    const handleLogout = async () => {
        await apiClient('/admin/logout', { method: 'POST' });
        navigate('/admin/login');
    };

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h2>Admin Dashboard</h2>
                <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
            </div>

            <div className="dashboard-tabs">
                <button className={`tab-btn ${activeTab === 'flights' ? 'active' : ''}`} onClick={() => {setActiveTab('flights'); setError(null);} }>
                    Manage Flights
                </button>
                <button className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => {setActiveTab('bookings'); setError(null);}}>
                    View All Bookings
                </button>
            </div>

            {error && <p className="error-text">{error}</p>}

            {/* --- FLIGHTS TAB --- */}
            {activeTab === 'flights' && (
                <div className="dashboard-content">
                    <div className="action-bar">
                        <h3>Flight Management</h3>
                        <button className="btn" onClick={() => {
                            setFormData({ from_city: '', to_city: '', departure_time: '', arrival_time: '', price: '', seats_total: ''});
                            setEditingFlightId(null);
                            setShowForm(!showForm);
                        }}>
                            {showForm ? 'Cancel' : '+ Add New Flight'}
                        </button>
                    </div>

                    {showForm && (
                        <form className="admin-form" onSubmit={handleFlightSubmit}>
                            <div className="form-row">
                                <div className="form-group"><label>From City</label>
                                    <select value={formData.from_city} onChange={e => setFormData({...formData, from_city: e.target.value})} required>
                                        <option value="" disabled>Select City</option>
                                        {cities.map(city => <option key={city.city_id} value={city.city_id}>{city.city_id} - {city.city_name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group"><label>To City</label>
                                    <select value={formData.to_city} onChange={e => setFormData({...formData, to_city: e.target.value})} required>
                                        <option value="" disabled>Select City</option>
                                        {cities.map(city => <option key={city.city_id} value={city.city_id}>{city.city_id} - {city.city_name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Departure Time</label><input type="datetime-local" value={formData.departure_time} onChange={e => setFormData({...formData, departure_time: e.target.value})} min={new Date().toISOString().slice(0, 16)} required /></div>
                                <div className="form-group"><label>Arrival Time</label><input type="datetime-local" value={formData.arrival_time} onChange={e => setFormData({...formData, arrival_time: e.target.value})} min={new Date().toISOString().slice(0, 16)} required /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Price (₺)</label><input type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required /></div>
                                <div className="form-group"><label>Total Seats</label><input type="number" min="1" value={formData.seats_total} onChange={e => setFormData({...formData, seats_total: e.target.value})} disabled={!!editingFlightId} required /></div>
                            </div>
                            <button type="submit" className="btn btn-save">{editingFlightId ? 'Update Flight' : 'Save New Flight'}</button>
                        </form>
                    )}

                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th>Flight ID</th><th>Route</th><th>Departure</th><th>Arrival</th><th>Price</th><th>Seats</th><th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {flights.map(flight => (
                                <tr key={flight.flight_id}>
                                    <td>{flight.flight_id}</td>
                                    <td>{flight.from_city_name} ({flight.from_city}) ➔ {flight.to_city_name} ({flight.to_city})</td>
                                    <td>{flight.departure_time}</td>
                                    <td>{flight.arrival_time}</td>
                                    <td>₺{flight.price}</td>
                                    <td>{flight.seats_available}/{flight.seats_total}</td>
                                    <td className="action-buttons">
                                        <button className="btn-sm btn-edit" onClick={() => openEditForm(flight)}>Edit</button>
                                        <button className="btn-sm btn-delete" onClick={() => handleDeleteFlight(flight.flight_id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- BOOKINGS TAB --- */}
            {activeTab === 'bookings' && (
                <div className="dashboard-content">
                    <h3>System Bookings Overview</h3>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th>Booking ID</th><th>Passenger Name</th><th>Email</th><th>Flight ID</th><th>Booking Date</th>
                            </tr>
                            </thead>
                            <tbody>
                            {bookings.map(b => (
                                <tr key={b.ticket_id}>
                                    <td>{b.booking_id}</td>
                                    <td>{b.passenger_name} {b.passenger_surname}</td>
                                    <td>{b.passenger_email}</td>
                                    <td>{b.flight_id} ({b.from_city_name} ➔ {b.to_city_name})</td>
                                    <td>{new Date(b.booking_date).toLocaleString('tr-TR')}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;