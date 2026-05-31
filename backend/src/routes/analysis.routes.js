const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysis.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', analysisController.getByPaper);
router.post('/auto-extract', analysisController.autoExtract);
router.post('/', analysisController.create);
router.put('/:id', analysisController.update);
router.delete('/:id', analysisController.remove);

module.exports = router;
