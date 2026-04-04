// flyticket/frontend/src/App.jsx

// Import React Router components. 
// BrowserRouter: Keeps your UI in sync with the URL.
// Routes: Looks through its child 'Route' components and renders the first one that matches the current URL.
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import FlightDetail from './pages/FlightDetail';
import Confirmation from './pages/Confirmation';

// We will create these Page components in the next step!
// For now, we use simple placeholder inline-components just to ensure the routing works.
const AdminLogin = () => <div><h2>Admin Login</h2></div>;
const AdminDashboard = () => <div><h2>Admin Dashboard</h2></div>;

function App() {
  return (
      // The BrowserRouter wraps our entire application
      <BrowserRouter>
        {/* A simple responsive navigation bar (to be moved to a separate component later) */}
        <nav style={{ padding: '16px', backgroundColor: '#fff', borderBottom: '1px solid #ccc' }}>
          <h1 style={{ color: '#0056b3' }}>FlyTicket ✈️</h1>
        </nav>

        <main className="container">
          {/* Routes act like a switch statement for our URLs */}
          <Routes>
            {/* Customer Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/book/:flightId" element={<FlightDetail />} />
            <Route path="/confirmation" element={<Confirmation />} />

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