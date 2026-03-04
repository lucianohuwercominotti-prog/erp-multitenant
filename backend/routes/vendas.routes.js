const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const vendasController = require('../controllers/vendasController');

// Aplicar middleware em todas as rotas
router.use(authMiddleware);
router.use(adminOnly);

// Rotas de vendas
router.get('/', vendasController.listarVendas);
router.get('/:id', vendasController.buscarVenda);
router.post('/', vendasController.criarVenda);
router.put('/:id/efetivar', vendasController.efetivarVenda);
router.put('/:id/cancelar', vendasController.cancelarVenda);

module.exports = router;