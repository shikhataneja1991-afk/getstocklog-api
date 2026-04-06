require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/auth",      require("./routes/auth"));
app.use("/api/slabs",     require("./routes/slabs"));
app.use("/api/sales",     require("./routes/sales"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/business",  require("./routes/business"));

app.get("/", (req, res) => res.json({ status: "GetStockLog API running ✅" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`GetStockLog API running on port ${PORT}`));
