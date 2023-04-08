const AzureBlobStorageModel = require("../models/blobActions.js");
const azureBlobStorageModel = new AzureBlobStorageModel();

const OK = 200;
const CREATED = 201;
const CLI_ERR = 400;
const CLI_ERR_MESG = "Invalid blob data";

/**
 * Upload blob wrapper function
 * @req {object} req = request
 * @res {object} res = response
 * @req {object} next = next
 */
async function uploadBlob(req, res, next) {
  try {
    const fileContent = req.file.buffer;
    const blobName = req.file.originalname;
    if (!fileContent || !blobName) return res.status(CLI_ERR).type("text").send(CLI_ERR_MESG);
    await azureBlobStorageModel.uploadBlob(blobName, fileContent, fileContent.length);
    res.status(CREATED).type("text").send("Uploaded blob successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Delete blob wrapper function
 * @req {object} req = request
 * @res {object} res = response
 * @req {object} next = next
 */
async function deleteBlob(req, res, next) {
  try {
    const blobName = req.params.blobName;
    if (!blobName) return res.status(CLI_ERR).type("text").send(CLI_ERR_MESG);
    await azureBlobStorageModel.deleteBlob(blobName);
    res.status(OK).type("text").send("Deleted blob successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Download blob wrapper function
 * @req {object} req = request
 * @res {object} res = response
 * @req {object} next = next
 */
async function downloadBlob(req, res, next) {
  try {
    const blobName = req.params.blobName;
    if (!blobName) return res.status(CLI_ERR).type("text").send(CLI_ERR_MESG);
    const blobData = await azureBlobStorageModel.downloadBlob(blobName);
    res.status(OK).json(blobData);
  } catch (error) {
    next(error);
  }
}

/**
 * List blobs wrapper function
 * @req {object} req = request
 * @res {object} res = response
 * @req {object} next = next
 */
async function listBlobs(req, res, next) {
  try {
    const blobs = await azureBlobStorageModel.listBlobs();
    res.status(OK).json(blobs);
  } catch (error) {
    next(error);
  }
}

/**
 * Get blob text content wrapper function
 * @req {object} req = request
 * @res {object} res = response
 * @req {object} next = next
 */
async function getBlobText(req, res, next) {
  try {
    const blobName = req.params.blobName;
    if (!blobName) return res.status(CLI_ERR).type("text").send(CLI_ERR_MESG);
    const blobs = await azureBlobStorageModel.getBlobText(blobName);
    res.status(OK).type("text").send(blobs);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete all blobs wrapper function
 * @req {object} req = request
 * @res {object} res = response
 * @req {object} next = next
 */
async function deleteAllBlobs(req, res, next) {
  try {
    const result = await azureBlobStorageModel.deleteAllBlobs();
    res.status(OK).type("text").send("Deleted all blobs successfully");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadBlob,
  deleteBlob,
  downloadBlob,
  listBlobs,
  getBlobText,
  deleteAllBlobs
};