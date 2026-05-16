// flyticket/frontend/src/components/flights/FlightCard.jsx
import { useNavigate } from 'react-router-dom';

/**
 * PROPS: 'flight' is an object containing all the details for a single flight.
 * This is passed down from the parent (Home) component.
 */
const FlightCard = ({ flight }) => {
    // useNavigate allows us to programmatically change the URL when a button is clicked
    const navigate = useNavigate();

    const handleBookClick = () => {
        // Send the user to the booking page, passing the flight ID in the URL
        navigate(`/book/${flight.flight_id}`);
    };

    // Format the date strings to look nicer (e.g., extracting just the time)
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flight-card">
            <div className="flight-card-route">
                <div className="city-time">
                    <h3>{flight.from_city_name} ({flight.from_city})</h3>
                    <p>{formatTime(flight.departure_time)}</p>
                </div>
                <div className="flight-duration">
                    <span>✈️</span>
                </div>
                <div className="city-time">
                    <h3>{flight.to_city_name} ({flight.to_city})</h3>
                    <p>{formatTime(flight.arrival_time)}</p>
                </div>
            </div>

            <div className="flight-card-details">
                <div className="price-seats">
                    <p className="price">₺{flight.price}</p>
                    <p className="seats">
                        {flight.seats_available} / {flight.seats_total} seats left
                    </p>
                </div>
                <button
                    className="btn"
                    onClick={handleBookClick}
                    disabled={flight.seats_available <= 0}
                >
                    {flight.seats_available > 0 ? 'Book Ticket' : 'Sold Out'}
                </button>
            </div>
        </div>
    );
};

export default FlightCard;