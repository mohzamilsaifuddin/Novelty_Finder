const express = require('express');
const router = express.Router();
const paperController = require('../controllers/paper.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/search', paperController.searchAndStore);
router.get('/', paperController.getByProject);
router.get('/:id', paperController.getOne);
router.delete('/:id', paperController.remove);
router.delete('/project/:projectId', paperController.clearProject);

module.exports = router;
