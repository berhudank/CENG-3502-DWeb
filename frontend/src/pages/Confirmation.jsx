// flyticket/frontend/src/pages/Confirmation.jsx
import { useLocation, useNavigate } from 'react-router-dom';

const Confirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Extract the state we passed from the FlightDetail page
    const bookingData = location.state;

    // If a user navigates to /confirmation directly without booking, send them home
    if (!bookingData) {
        return (
            <div className="container text-center">
                <h2>No booking found.</h2>
                <button className="btn" onClick={() => navigate('/')}>Return Home</button>
            </div>
        );
    }

    const { booking_id, flight, passenger } = bookingData;

    return (
        <div className="confirmation-page text-center">
            {/* Success badge as requested in the assignment details */}
            <div className="success-badge">
                <h1>✅ Booking Successful!</h1>
                <p>Your ticket has been reserved securely.</p>
            </div>

            <div className="ticket-receipt">
                <h2>E-Ticket Overview</h2>
                <p className="booking-ref"><strong>Booking ID:</strong> {booking_id}</p>

                <div className="receipt-grid">
                    <div className="receipt-section">
                        <h3>Passenger Details</h3>
                        <p>{passenger.name} {passenger.surname}</p>
                        <p>{passenger.email}</p>
                    </div>

                    <div className="receipt-section">
                        <h3>Flight Details</h3>
                        <p><strong>Flight:</strong> {flight.flight_id}</p>
                        <p><strong>Route:</strong> {flight.from_city_name} ({flight.from_city}) ➔ {flight.to_city_name} ({flight.to_city})</p>
                        <p><strong>Date:</strong> {new Date(flight.departure_time).toLocaleDateString('tr-TR')}</p>
                    </div>
                </div>

                <div className="receipt-actions">
                    <button className="btn" onClick={() => navigate('/')}>Search More Flights</button>
                    {/* Optional feature placeholder */}
                    <button className="btn btn-secondary" onClick={() => window.print()}>Print E-Ticket</button>
                </div>
            </div>
        </div>
    );
};

export default Confirmation;