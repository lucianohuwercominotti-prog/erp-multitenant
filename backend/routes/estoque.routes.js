const express = require('express');
const router = express.Router();
const estoqueController = require('../controllers/estoqueController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware, adminOnly);

router.get('/', estoqueController.visaoGeralEstoque);
router.get('/ajustes', estoqueController.historicoAjustes);
router.post('/ajustes', estoqueController.registrarAjuste);

module.exports = router;
