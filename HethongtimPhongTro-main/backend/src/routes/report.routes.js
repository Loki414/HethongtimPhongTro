const express = require('express');
const reportController = require('../controllers/report.controller');

const router = express.Router();

router.get('/', ...reportController.list);
router.get('/:reportId', ...reportController.getById);
router.post('/', ...reportController.create);
router.put('/:reportId', ...reportController.update);
router.delete('/:reportId', ...reportController.remove);

module.exports = router;
