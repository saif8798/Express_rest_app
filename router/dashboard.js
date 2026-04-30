const express = require("express");
const router = express.Router();
const dashboardController = require("../controller/dashboard");

router.post("/summary", dashboardController.postDashboardSummary);

router.post("/summaryaudio", dashboardController.postSummaryAudio);

router.get("/kpis", dashboardController.getKpis);

router.get("/salesbyregion", dashboardController.getbyRegion);

router.get("/salesbychannel", dashboardController.getbyChannel);

router.get("/salesbycategory", dashboardController.getbyCategory);

router.get("/salesbymonth", dashboardController.getbyMonth);

router.get("/orderKpis", dashboardController.getOrderKpis);

router.get("/ordersbycategory", dashboardController.getOrdersbyCategory);

router.get(
  "/returnorderbycategory",
  dashboardController.getReturnOrdersandpercbyCategroy,
);

router.get("/avgorderbycategory", dashboardController.getAvgOrderbyCategroy);

module.exports = router;
