// flyticket/frontend/src/App.jsx

// Import React Router components. 
// BrowserRouter: Keeps your UI in sync with the URL.
// Routes: Looks through its child 'Route' components and renders the first one that matches the current URL.
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import Home from './pages/Home';
import FlightDetail from './pages/FlightDetail';
import Confirmation from './pages/Confirmation';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import CheckTicket from './pages/CheckTicket';

function App() {
  return (
      // The BrowserRouter wraps our entire application
      <BrowserRouter>
          {/* Updated Navigation Bar */}
          <nav className="navbar">
              <Link to="/" className="nav-logo">
                  FlyTicket ✈️
              </Link>
              <div className="nav-links">
                  <Link to="/check-ticket" className="btn btn-secondary nav-btn" style={{marginRight: '10px'}}>
                      Check Ticket
                  </Link>
                  <Link to="/admin/dashboard" className="btn btn-secondary nav-btn">
                      Admin Portal
                  </Link>
              </div>
          </nav>

        <main className="container">
          {/* Routes act like a switch statement for our URLs */}
          <Routes>
            {/* Customer Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/book/:flightId" element={<FlightDetail />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/check-ticket" element={<CheckTicket />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>
      </BrowserRouter>
  );
}

// In React, components must be exported so other files can import and use them
export default App;