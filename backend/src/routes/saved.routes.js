const express = require('express');
const router = express.Router();
const savedController = require('../controllers/saved.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', savedController.getAll);
router.post('/', savedController.save);
router.put('/:id', savedController.updateNotes);
router.delete('/:id', savedController.remove);

module.exports = router;
