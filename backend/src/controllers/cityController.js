const pool = require('../config/db');

const getAllCities = async (req, res, next) => {
    try {
        const [cities] = await pool.query('SELECT * FROM Cities ORDER BY city_name ASC');
        res.status(200).json({ success: true, data: cities });
    } catch (error) { next(error); }
};

module.exports = { getAllCities };