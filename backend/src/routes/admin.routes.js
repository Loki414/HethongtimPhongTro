const express = require('express');
const adminDashboardController = require('../controllers/adminDashboard.controller');

const router = express.Router();

router.get('/dashboard', ...adminDashboardController.dashboard);

module.exports = router;
