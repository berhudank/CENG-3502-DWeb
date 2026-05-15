# FlyTicket Flight Booking System

FlyTicket is a full-stack web application designed for booking and managing flight tickets. The system features a public-facing customer interface for searching and booking flights, as well as a secured administrative dashboard for managing flight schedules.

## Technologies Used

### Frontend
*   **React**: Core library for building the user interface.
*   **Vite**: Frontend build tool and development server.
### Backend
*   **Node.js**: JavaScript runtime environment for the server.
*   **Express**: Web application framework for routing and middleware management.
*   **MySQL**: Relational database for storing cities, flights, bookings, and admin credentials.

## How to Run the Project

### 1. Database Configuration
1. Ensure you have an active MySQL server instance running locally or remotely.
2. Execute the `backend/schema.sql` script in your MySQL environment. This will automatically:
   * Create the `flyticket_db` database.
   * Initialize all required tables.
   * Insert the base data, including all 81 city codes and the default administrative account.
3. Open the backend configuration file (e.g., `backend/src/config/db.js` or your `.env` file) and verify that the database connection parameters (host, user, password, database) match your MySQL instance.

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install the necessary Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the backend server
   ```bash
   node src/index.js
   ```

### 3. Access Frontend

1. Open a separate terminal window and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the required dependencies:
   ```bash
   npm install
   ```
#### &ensp; With Vite Dev Server  
3. You will need to insert your own backend server's IP address and port number to the `BASE_URL` variable in the `frontend/src/api/apiClient.js` file.

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Access the home page via the local URL provided by Vite in your terminal.
6. You will also need to stop serving frontend files by removing these lines from `backend/index.js` as they are not needed when using Vite:
   ```javascript
   ...

   app.use(express.static(path.join(__dirname, 'public')));
  
   ...
   
   app.get(/.*/, (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
   });

   ...
   ```
#### &ensp; With Backend's Endpoint
1. You can access the home page directly via your backend's URL `http://[IP_ADDRESS]:[PORT]/`. The compiled frontend files are stored in the `backend/public/` directory and served by the backend.
2. When you make changes to frontend files in the `frontend` directory, you need to re-compile the frontend files by running `npm run build` in the `frontend` directory.

## Admin Login Credentials

A default administrative account is automatically generated when executing the `schema.sql` script. You can access the Admin Portal using the following credentials:

*   **Username**: admin
*   **Password**: supersecretpassword


