// flyticket/frontend/src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import FlightSearchForm from '../components/flights/FlightSearchForm';
import FlightCard from '../components/flights/FlightCard';

const Home = () => {
    // STATE for the page
    const [flights, setFlights] = useState([]); // Holds the array of flights from the DB
    const [loading, setLoading] = useState(false); // Shows a loading spinner/text
    const [error, setError] = useState(null); // Holds any error messages

    // Function to fetch flights from our Express backend
    const fetchFlights = async (searchParams = {}) => {
        setLoading(true);
        setError(null);

        try {
            // Construct the query string (e.g., ?from_city=IST&to_city=ANK)
            const query = new URLSearchParams(searchParams).toString();
            const endpoint = query ? `/flights?${query}` : '/flights';

            // Use our native fetch helper!
            const response = await apiClient(endpoint);
            setFlights(response.data);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // useEffect runs code automatically when the component first appears on the screen.
    // We use it to load ALL flights initially.
    useEffect(() => {
        fetchFlights();
    }, []); // The empty array [] means "only run this once when the page loads"

    return (
        <div className="home-page">
            <section className="hero-section">
                <h2>Find Your Next Destination</h2>
                {/* Render the search form, passing down our fetch function as a prop */}
                <FlightSearchForm onSearch={fetchFlights} />
            </section>

            <section className="results-section">
                <h3>Available Flights</h3>

                {/* Display loading state, errors, or the results */}
                {loading && <p>Loading flights...</p>}
                {error && <p className="error-text">{error}</p>}

                {!loading && !error && flights.length === 0 && (
                    <p>No flights found for your search criteria.</p>
                )}

                <div className="flight-list">
                    {/* .map() is how we loop over arrays in React to render multiple components */}
                    {flights.map((flight) => (
                        <FlightCard key={flight.flight_id} flight={flight} />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;