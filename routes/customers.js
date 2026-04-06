
const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");
router.use(auth);

router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM customers WHERE business_id=$1 ORDER BY name", [req.user.businessId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  const { name, phone, email, type, gst_no, credit_limit, notes } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO customers (business_id, name, phone, email, type, gst_no, credit_limit, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.businessId, name, phone||"", email||"", type||"Contractor", gst_no||"", credit_limit||0, notes||""]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM customers WHERE id=$1 AND business_id=$2", [req.params.id, req.user.businessId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
