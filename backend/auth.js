const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'claims_secret_key';

function generateToken(userId, username, role) {
  return jwt.sign({ userId, username, role }, JWT_SECRET, { expiresIn: '1h' });
}

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader)
    return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(401).json({ error: 'Invalid token format' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err)
      return res.status(403).json({ error: 'Token is invalid or expired' });
    req.user = decoded;
    next();
  });
}

function verifyAdmin(req, res, next) {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required' });
  next();
}

module.exports = { generateToken, verifyToken, verifyAdmin };