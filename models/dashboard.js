const mongoose = require("mongoose");

const factSalesSchema = new mongoose.Schema({}, { strict: false });
module.exports = mongoose.model("fact_sales", factSalesSchema);