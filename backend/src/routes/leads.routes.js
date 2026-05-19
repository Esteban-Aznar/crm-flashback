const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  getLeads, getComercialesForLeads, createLead, updateLead,
  updateEstado, deleteLead, convertirLead,
} = require('../controllers/leads.controller');

router.use(authenticate);

// Specific routes before /:id
router.get('/comerciales', getComercialesForLeads);

router.get('/', getLeads);
router.post('/', createLead);
router.put('/:id', updateLead);
router.put('/:id/estado', updateEstado);
router.delete('/:id', deleteLead);
router.post('/:id/convertir', convertirLead);

module.exports = router;
