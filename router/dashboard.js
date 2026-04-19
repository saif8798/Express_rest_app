const express = require("express");
const router = express.Router();
const dashboardController = require("../controller/dashboard");

router.get("/salesAnalysis", dashboardController.getSalesData);

router.get("/ordersAnalysis", dashboardController.getOrdersData);

router.get("/kpis", dashboardController.getKpis);

router.get("/salesbyregion", dashboardController.getbyRegion);

router.get("/salesbychannel", dashboardController.getbyChannel);

router.get("/salesbycategory", dashboardController.getbyCategory);

router.get("/salesbymonth", dashboardController.getbyMonth);

module.exports = router;
