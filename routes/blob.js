const express = require("express");
const multer = require('multer');
const router = express.Router();
const AzureBlobController = require("../controllers/blobWrapper.js");
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

// routes
router.get("/all", AzureBlobController.listBlobs);
router.delete("/all", AzureBlobController.deleteAllBlobs);
router.post("/upload", upload.single("file"), AzureBlobController.uploadBlob);
router.delete("/:blobName", AzureBlobController.deleteBlob);
router.get("/:blobName", AzureBlobController.downloadBlob);
router.get("/text/:blobName", AzureBlobController.getBlobText);

module.exports = router;