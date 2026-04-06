
const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");
router.use(auth);

router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM slabs WHERE business_id = $1 ORDER BY created_at", [req.user.businessId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  const { name, type, variety, finish, length, width, sqft, qty, price_per_sqft, cost_per_sqft, block, row_no, slot_no, threshold, supplier, barcode } = req.body;
  try {
    const status = qty === 0 ? "Out of Stock" : qty <= threshold ? "Low Stock" : "In Stock";
    const result = await db.query(
      `INSERT INTO slabs (business_id, name, type, variety, finish, length, width, sqft, qty, price_per_sqft, cost_per_sqft, block, row_no, slot_no, threshold, supplier, barcode, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [req.user.businessId, name, type, variety, finish, length, width, sqft, qty, price_per_sqft, cost_per_sqft, block, row_no, slot_no, threshold, supplier, barcode, status]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:id", async (req, res) => {
  const s = req.body;
  try {
    const status = s.qty === 0 ? "Out of Stock" : s.qty <= s.threshold ? "Low Stock" : "In Stock";
    const result = await db.query(
      `UPDATE slabs SET name=$1, type=$2, variety=$3, finish=$4, length=$5, width=$6, sqft=$7, qty=$8, price_per_sqft=$9, cost_per_sqft=$10, block=$11, row_no=$12, slot_no=$13, threshold=$14, supplier=$15, reserved_for=$16, status=$17 WHERE id=$18 AND business_id=$19 RETURNING *`,
      [s.name, s.type, s.variety, s.finish, s.length, s.width, s.sqft, s.qty, s.price_per_sqft, s.cost_per_sqft, s.block, s.row_no, s.slot_no, s.threshold, s.supplier, s.reserved_for||null, status, req.params.id, req.user.businessId]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM slabs WHERE id=$1 AND business_id=$2", [req.params.id, req.user.businessId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
