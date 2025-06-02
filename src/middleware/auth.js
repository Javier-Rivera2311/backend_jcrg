const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(403).json({ success: false, error: "Token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, 'secret-key');
    req.user = decoded; // { id: user.ID }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Token inválido" });
  }
};

export { verifyToken };