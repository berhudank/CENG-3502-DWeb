// flyticket/frontend/src/components/flights/FlightSearchForm.jsx
import {useEffect, useState} from 'react';
import {apiClient} from "../../api/apiClient.js";

/**
 * PROPS: 'onSearch' is a function passed down from the parent.
 * We call this function when the user clicks submit, handing the data back up to the parent.
 */
const FlightSearchForm = ({ onSearch }) => {
    // STATE: React uses 'useState' to remember what the user types into the inputs.
    const [fromCity, setFromCity] = useState('');
    const [toCity, setToCity] = useState('');
    const [date, setDate] = useState('');

    const [cities, setCities] = useState([]);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await apiClient('/cities');
                setCities(response.data);
            } catch (error) {
                console.error('Failed to load cities', error);
            }
        };
        fetchCities();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevents the page from refreshing on submit

        // Pass the collected data back up to the parent component (Home)
        onSearch({ from_city: fromCity, to_city: toCity, date: date });
    };

    return (
        <form className="search-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label>From</label>
                <select value={fromCity} onChange={(e) => setFromCity(e.target.value)}>
                    <option value="">Any City</option>
                    {cities.map(city => <option key={`from-${city.city_id}`} value={city.city_id}>{city.city_name} ({city.city_id})</option>)}
                </select>
            </div>

            <div className="form-group">
                <label>To</label>
                <select value={toCity} onChange={(e) => setToCity(e.target.value)}>
                    <option value="">Any City</option>
                    {cities.map(city => <option key={`to-${city.city_id}`} value={city.city_id}>{city.city_name} ({city.city_id})</option>)}
                </select>
            </div>

            <div className="form-group">
                <label>Date</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>

            <div className="form-group btn-group">
                <button type="submit" className="btn btn-search">Search Flights</button>
            </div>
        </form>
    );
};

export default FlightSearchForm;