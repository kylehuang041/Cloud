const AzureCosmosDBModel = require('../models/cosmosActions');

const OK = 200;
const CREATED = 201;
const CLI_ERR = 400;
const CLI_ERR_MESG = "Invalid data";

/**
 * Retrieve all entities wrapper function
 * @req {object} req = request
 * @res {object} res = response
 * @req {object} next = next
 */
async function createAllItems(req, res, next) {
  try {
    const data = req.body;
    if (!data || Object.keys(data).length <= 0) return res.status(CLI_ERR).type("text").send(CLI_ERR_MESG);
    const azureCosmosDBModel = new AzureCosmosDBModel();
    await azureCosmosDBModel.createAllItems(data);
    res.status(CREATED).type("text").send("Created all items successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * Get all or some items wrapper function
 * @req {object} req = request
 * @res {object} res = response
 * @req {object} next = next
 */
async function getItems(req, res, next) {
  try {
    let lastName = req.query.last_name;
    let firstName = req.query.first_name;
    const azureCosmosDBController = new AzureCosmosDBModel();
    const result = await azureCosmosDBController.getItems(lastName, firstName);
    res.status(OK).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Delete all items wrapper function
 * @req {object} req = request
 * @res {object} res = response
 * @req {object} next = next
 */
async function deleteAllItems(req, res, next) {
  try {
    const azureCosmosDBModel = new AzureCosmosDBModel();
    await azureCosmosDBModel.deleteAllItems();
    res.status(OK).type("text").send("Deleted all items successfully");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAllItems,
  getItems,
  deleteAllItems,
};