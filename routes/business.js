
const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");
router.use(auth);

router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM businesses WHERE id=$1", [req.user.businessId]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/", async (req, res) => {
  const { business_name, owner_name, phone, city, staff_pin } = req.body;
  try {
    const result = await db.query(
      `UPDATE businesses SET business_name=$1, owner_name=$2, phone=$3, city=$4, staff_pin=$5 WHERE id=$6 RETURNING *`,
      [business_name, owner_name, phone, city, staff_pin, req.user.businessId]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
