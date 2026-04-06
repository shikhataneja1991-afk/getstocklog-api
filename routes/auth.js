
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

router.post("/signup", async (req, res) => {
  const { email, password, businessName, ownerName, phone, city } = req.body;
  if (!email || !password || !businessName)
    return res.status(400).json({ error: "Email, password and business name required" });
  try {
    const exists = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.rows.length > 0)
      return res.status(400).json({ error: "Email already registered" });
    const hash = await bcrypt.hash(password, 10);
    const userRes = await db.query("INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id", [email, hash]);
    const userId = userRes.rows[0].id;
    const bizRes = await db.query(
      `INSERT INTO businesses (owner_id, business_name, owner_name, phone, city) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, businessName, ownerName||"", phone||"", city||""]
    );
    const token = jwt.sign({ userId, businessId: bizRes.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { email }, business: bizRes.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });
  try {
    const userRes = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userRes.rows.length === 0) return res.status(401).json({ error: "Invalid email or password" });
    const user = userRes.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });
    const bizRes = await db.query("SELECT * FROM businesses WHERE owner_id = $1", [user.id]);
    if (bizRes.rows.length === 0) return res.status(404).json({ error: "Business not found" });
    const business = bizRes.rows[0];
    const token = jwt.sign({ userId: user.id, businessId: business.id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { email: user.email }, business });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

router.post("/staff-login", async (req, res) => {
  const { pin } = req.body;
  try {
    const result = await db.query("SELECT * FROM businesses WHERE staff_pin = $1", [pin]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Invalid PIN" });
    res.json({ business: result.rows[0] });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

module.exports = router;
