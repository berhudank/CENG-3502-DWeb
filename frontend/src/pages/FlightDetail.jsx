// flyticket/frontend/src/pages/FlightDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

const FlightDetail = () => {
    // useParams grabs dynamic pieces of the URL (like the :flightId we defined in App.jsx)
    const { flightId } = useParams();
    const navigate = useNavigate();

    // State for the flight data and UI
    const [flight, setFlight] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the passenger form
    const [passengerName, setPassengerName] = useState('');
    const [passengerSurname, setPassengerSurname] = useState('');
    const [passengerEmail, setPassengerEmail] = useState('');
    const [bookingError, setBookingError] = useState(null);
    const [isBooking, setIsBooking] = useState(false);

    useEffect(() => {
        // Fetch the specific flight details
        const fetchFlightDetails = async () => {
            try {
                // Fetch JUST the specific flight instead of all of them!
                const response = await apiClient(`/flights/${flightId}`);
                setFlight(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFlightDetails();
    }, [flightId]);

    const handleBookTicket = async (e) => {
        e.preventDefault();
        setIsBooking(true);
        setBookingError(null);

        try {
            // Call our Ticket Controller's POST route [cite: 83]
            const response = await apiClient('/tickets', {
                method: 'POST',
                body: JSON.stringify({
                    passenger_name: passengerName,
                    passenger_surname: passengerSurname,
                    passenger_email: passengerEmail,
                    flight_ids: [flightId] // Future-proofed array!
                })
            });

            // Navigate to the confirmation page, passing along the success data invisibly
            navigate('/confirmation', {
                state: {
                    booking_id: response.booking_id,
                    flight: flight,
                    passenger: {
                        name: passengerName,
                        surname: passengerSurname,
                        email: passengerEmail
                    }
                }
            });

        } catch (err) {
            setBookingError(err.message);
        } finally {
            setIsBooking(false);
        }
    };

    if (loading) return <div className="container"><p>Loading flight details...</p></div>;
    if (error) return <div className="container"><p className="error-text">{error}</p></div>;

    return (
        <div className="booking-page">
            <h2>Complete Your Booking</h2>

            <div className="booking-layout">
                {/* Left Side: The Form */}
                <div className="booking-form-container">
                    <h3>Passenger Information</h3>
                    {bookingError && <p className="error-text">{bookingError}</p>}

                    <form className="booking-form" onSubmit={handleBookTicket}>
                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                type="text"
                                required
                                value={passengerName}
                                onChange={(e) => setPassengerName(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                required
                                value={passengerSurname}
                                onChange={(e) => setPassengerSurname(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                required
                                value={passengerEmail}
                                onChange={(e) => setPassengerEmail(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-book" disabled={isBooking}>
                            {isBooking ? 'Processing...' : 'Confirm Booking'}
                        </button>
                    </form>
                </div>

                {/* Right Side: Summary Card */}
                <div className="flight-summary-card">
                    <h3>Flight Summary</h3>
                    <div className="summary-details">
                        <p><strong>From:</strong> {flight.from_city}</p>
                        <p><strong>To:</strong> {flight.to_city}</p>
                        <p><strong>Departure:</strong> {new Date(flight.departure_time).toLocaleString('tr-TR')}</p>
                        <p><strong>Arrival:</strong> {new Date(flight.arrival_time).toLocaleString('tr-TR')}</p>
                        <hr />
                        <p className="summary-price">Total Price: ₺{flight.price}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlightDetail;