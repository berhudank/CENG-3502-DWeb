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
    const [selectedSeat, setSelectedSeat] = useState('');
    const [takenSeats, setTakenSeats] = useState([]);
    const [bookingError, setBookingError] = useState(null);
    const [isBooking, setIsBooking] = useState(false);

    useEffect(() => {
        // Fetch the specific flight details
        const fetchFlightDetails = async () => {
            try {
                // Fetch JUST the specific flight instead of all of them!
                const flightRes = await apiClient(`/flights/${flightId}`);
                setFlight(flightRes.data);

                // Fetch taken seats for this flight
                const seatsRes = await apiClient(`/flights/${flightId}/seats`);
                if (seatsRes.success) {
                    setTakenSeats(seatsRes.data);
                }
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
        
        if (!selectedSeat) {
            setBookingError('Please select a seat to continue.');
            return;
        }

        setIsBooking(true);
        setBookingError(null);

        try {
            // Call our Ticket Controller's POST route
            const response = await apiClient('/tickets', {
                method: 'POST',
                body: JSON.stringify({
                    passenger_name: passengerName,
                    passenger_surname: passengerSurname,
                    passenger_email: passengerEmail,
                    flight_seats: [{ flight_id: flightId, seat_number: selectedSeat }]
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
                        email: passengerEmail,
                        seat_number: selectedSeat
                    }
                }
            });

        } catch (err) {
            setBookingError(err.message);
            // If the seat was taken concurrently, mark it as taken visually and unselect it
            if (err.message.includes('already taken')) {
                setTakenSeats(prev => [...prev, selectedSeat]);
                setSelectedSeat('');
            }
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

                        <div className="seat-selection-container" style={{marginBottom: '20px'}}>
                            <label style={{display: 'block', marginBottom: '10px', fontWeight: 'bold'}}>Select Your Seat</label>

                            {/* Seat legend */}
                            <div style={{display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '0.8rem'}}>
                                <span><span className="seat-btn" style={{width: '18px', height: '18px', display: 'inline-flex', fontSize: '0', verticalAlign: 'middle', marginRight: '4px'}}></span> Available</span>
                                <span><span className="seat-btn selected" style={{width: '18px', height: '18px', display: 'inline-flex', fontSize: '0', verticalAlign: 'middle', marginRight: '4px'}}></span> Selected</span>
                                <span><span className="seat-btn taken" style={{width: '18px', height: '18px', display: 'inline-flex', fontSize: '0', verticalAlign: 'middle', marginRight: '4px'}}></span> Taken</span>
                            </div>

                            {/* Airplane body — scrollable viewport */}
                            {(() => {
                                // Calculate dynamic wing position at the middle of the plane
                                const seatsPerRow = 6;
                                const totalRows = Math.ceil(flight.seats_total / seatsPerRow);
                                const fuselageHeight = Math.max(300, totalRows * 55 + 50);
                                const cockpitHeight = 130;
                                const tailHeight = 60;
                                const wingHeight = 110;
                                const totalPlaneHeight = cockpitHeight + fuselageHeight + tailHeight;
                                const wingTop = (totalPlaneHeight / 2) - (wingHeight / 2);

                                return (
                            <div className="airplane-container">
                                <div className="fuselage-wrapper">
                                    {/* Wings & engines — positioned at the middle of the plane */}
                                    <div className="wings-layer" style={{ top: `${wingTop}px` }}>
                                        <div className="wing left"><div className="engine"></div></div>
                                        <div className="wing right"><div className="engine"></div></div>
                                    </div>

                                    {/* Nose cone */}
                                    <div className="cockpit">
                                        <div className="cockpit-window"></div>
                                    </div>

                                    {/* Fuselage body with seats */}
                                    <div className="fuselage">
                                        {/* Seat rows — 6 seats per row (3 + aisle + 3) */}
                                        {(() => {
                                            const seatsPerRow = 6;
                                            const totalRows = Math.ceil(flight.seats_total / seatsPerRow);
                                            const rows = [];

                                            for (let r = 0; r < totalRows; r++) {
                                                const leftGroup = [];
                                                const rightGroup = [];

                                                for (let c = 0; c < seatsPerRow; c++) {
                                                    const seatNum = r * seatsPerRow + c + 1;
                                                    if (seatNum > flight.seats_total) break;

                                                    const isTaken = takenSeats.includes(seatNum.toString());
                                                    const isSelected = selectedSeat === seatNum.toString();

                                                    const btn = (
                                                        <button
                                                            key={seatNum}
                                                            type="button"
                                                            disabled={isTaken}
                                                            className={`seat-btn${isSelected ? ' selected' : ''}${isTaken ? ' taken' : ''}`}
                                                            onClick={() => setSelectedSeat(seatNum.toString())}
                                                            title={`Seat ${seatNum}`}
                                                        >
                                                            {seatNum}
                                                        </button>
                                                    );

                                                    if (c < 3) leftGroup.push(btn);
                                                    else rightGroup.push(btn);
                                                }

                                                rows.push(
                                                    <div className="seat-row" key={r}>
                                                        <div className="seat-group">{leftGroup}</div>
                                                        <div className="aisle"></div>
                                                        <div className="seat-group">{rightGroup}</div>
                                                    </div>
                                                );
                                            }
                                            return rows;
                                        })()}
                                    </div>

                                    {/* Tail */}
                                    <div className="tail"></div>
                                </div>
                            </div>
                                );
                            })()}

                            <p style={{fontSize: '0.85rem', color: '#666', marginTop: '8px', textAlign: 'center'}}>
                                Selected Seat: <strong>{selectedSeat || 'None'}</strong>
                            </p>
                        </div>

                        <button type="submit" className="btn btn-book" disabled={isBooking || !selectedSeat}>
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