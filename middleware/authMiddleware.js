const jwt = require('jsonwebtoken');

const verifyAdminToken = (req, res, next) => {
    // Assuming your admin token is stored in a different header, e.g., 'Admin-Authorization'
    const adminToken = req.headers['authorization'];

    if (!adminToken) {
        return res.status(403).json({ message: 'Admin Token is missing' });
    }

    jwt.verify(adminToken.replace('Bearer ', ''), 'admin_secret_key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid admin token' });
        }

        req.admin = decoded;
        next();
    });
};

module.exports = {
    verifyAdminToken,
};
