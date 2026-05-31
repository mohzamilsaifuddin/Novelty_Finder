const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/excel', exportController.exportExcel);
router.get('/pdf', exportController.exportPdf);

module.exports = router;
