const jwt = require("jsonwebtoken");
async function verifyUser(req, res, next) {
  const token = req.headers.authorization;
  console.log(token);
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, "APP_SECRET");
    console.log(decoded);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    } else {
      req.user = decoded;
      next();
    }
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
module.exports = verifyUser;
