const express = require('express');
const router = express.Router();
const noveltyController = require('../controllers/novelty.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/analyze', noveltyController.analyze);
router.get('/', noveltyController.getByProject);

module.exports = router;
