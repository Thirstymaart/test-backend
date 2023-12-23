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

const verifyVendorToken = (req, res, next) => {
    const vendorToken = req.headers.authorization;

    if (!vendorToken) {
        return res.status(403).json({ message: 'Vendor Token is missing' });
    }

    jwt.verify(vendorToken.replace('Bearer ', ''), 'AbdcshNA846Sjdfg', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid vendor token' });
        }

        req.vendorId = decoded.id; 
        next();
    });
};

const verifyUserToken = (req, res, next) => {
    const userToken = req.headers.authorization;

    if (!userToken) {
        return res.status(403).json({ message: 'User Token is missing' });
    }

    jwt.verify(userToken.replace('Bearer ', ''), 'AbdcshNA846Sjdfg', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid user token' });
        }
        console.log(decoded.id);
        req.userId = decoded.id;
        next();
    });
};


module.exports = {
    verifyAdminToken,
    verifyVendorToken,
    verifyUserToken
};
