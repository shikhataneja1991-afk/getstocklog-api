
const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");
router.use(auth);

router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM sales WHERE business_id = $1 ORDER BY created_at DESC", [req.user.businessId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  const { slab_id, slab_name, sqft_sold, price_per_sqft, cost_per_sqft, wastage, customer, phone, gst_no, invoice_no, paid_amount, payment_mode } = req.body;
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const slabRes = await client.query("SELECT qty, threshold FROM slabs WHERE id=$1 AND business_id=$2", [slab_id, req.user.businessId]);
    if (slabRes.rows.length === 0) throw new Error("Slab not found");
    const slab = slabRes.rows[0];
    const newQty = slab.qty - sqft_sold;
    if (newQty < 0) throw new Error("Not enough stock");
    const status = newQty === 0 ? "Out of Stock" : newQty <= slab.threshold ? "Low Stock" : "In Stock";
    await client.query("UPDATE slabs SET qty=$1, status=$2 WHERE id=$3", [newQty, status, slab_id]);
    const today = new Date().toISOString().split("T")[0];
    const result = await client.query(
      `INSERT INTO sales (business_id, slab_id, slab_name, date, sqft_sold, price_per_sqft, cost_per_sqft, wastage, customer, phone, gst_no, invoice_no, delivery_status, paid_amount, payment_mode) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'Pending',$13,$14) RETURNING *`,
      [req.user.businessId, slab_id, slab_name, today, sqft_sold, price_per_sqft, cost_per_sqft, wastage||0, customer||"Walk-in", phone||"", gst_no||"", invoice_no, paid_amount||0, payment_mode||"Cash"]
    );
    await client.query("COMMIT");
    res.json({ sale: result.rows[0], newQty, status });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

router.put("/:id/payment", async (req, res) => {
  const { paid_amount, payment_mode } = req.body;
  try {
    const result = await db.query("UPDATE sales SET paid_amount=$1, payment_mode=$2 WHERE id=$3 AND business_id=$4 RETURNING *", [paid_amount, payment_mode, req.params.id, req.user.businessId]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
