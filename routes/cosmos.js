const express = require('express');
const router = express.Router();
const AzureCosmosDBController = require('../controllers/cosmosWrapper.js');

// routes
router.get('/all', AzureCosmosDBController.getItems);
router.post('/all', AzureCosmosDBController.createAllItems);
router.delete('/all', AzureCosmosDBController.deleteAllItems);

module.exports = router;