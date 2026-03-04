const express = require('express');
const router = express.Router();
const orcamentosController = require('../controllers/orcamentosController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware, adminOnly);

router.get('/', orcamentosController.listarOrcamentos);
router.get('/:id', orcamentosController.buscarOrcamento);
router.post('/', orcamentosController.criarOrcamento);
router.put('/:id/efetivar', orcamentosController.efetivarOrcamento);
router.put('/:id/cancelar', orcamentosController.cancelarOrcamento);
router.delete('/:id', orcamentosController.excluirOrcamento);

module.exports = router;
