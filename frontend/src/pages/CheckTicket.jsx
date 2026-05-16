// flyticket/frontend/src/pages/CheckTicket.jsx
import { useState } from 'react';
import { apiClient } from '../api/apiClient';

const CheckTicket = () => {
    const [bookingId, setBookingId] = useState('');
    const [bookingDetails, setBookingDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!bookingId.trim()) return;
        
        setLoading(true);
        setError(null);
        setBookingDetails(null);

        try {
            const response = await apiClient(`/tickets/booking/${bookingId}`);
            setBookingDetails(response.data);
        } catch (err) {
            setError(err.message || 'Ticket not found.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="check-ticket-page">
            <h2>Check Your Ticket</h2>
            <form onSubmit={handleSearch} className="search-form">
                <div className="form-group">
                    <label>Booking ID (e.g., BKG-XXXX)</label>
                    <input 
                        type="text" 
                        value={bookingId} 
                        onChange={(e) => setBookingId(e.target.value.toUpperCase())} 
                        required 
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Searching...' : 'Search Ticket'}
                </button>
            </form>

            {error && <p className="error-text">{error}</p>}

            {bookingDetails && bookingDetails.length > 0 && (
                <div className="ticket-details card">
                    <h3>Booking Summary</h3>
                    <p><strong>Booking ID:</strong> {bookingDetails[0].booking_id}</p>
                    <p><strong>Passenger:</strong> {bookingDetails[0].passenger_name} {bookingDetails[0].passenger_surname}</p>
                    <p><strong>Email:</strong> {bookingDetails[0].passenger_email}</p>
                    <p><strong>Booking Date:</strong> {new Date(bookingDetails[0].booking_date).toLocaleString('tr-TR')}</p>
                    
                    <h4>Flight Segments</h4>
                    <div className="flight-list">
                        {bookingDetails.map((segment) => (
                            <div key={segment.ticket_id} className="flight-card">
                                <div className="route-info">
                                    <span className="city">{segment.from_city_name} ({segment.from_city})</span>
                                    <span className="arrow">➔</span>
                                    <span className="city">{segment.to_city_name} ({segment.to_city})</span>
                                </div>
                                <div className="time-info">
                                    <p><strong>Departure:</strong> {new Date(segment.departure_time).toLocaleString('tr-TR')}</p>
                                    <p><strong>Arrival:</strong> {new Date(segment.arrival_time).toLocaleString('tr-TR')}</p>
                                </div>
                                <p><strong>Price:</strong> ₺{segment.price}</p>
                                <p><strong>Flight ID:</strong> {segment.flight_id}</p>
                                <p><strong>Seat:</strong> {segment.seat_number}</p>
                                <p><strong>Ticket ID:</strong> {segment.ticket_id}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckTicket;
