const { BlobServiceClient } = require('@azure/storage-blob');
require("dotenv").config();

const connectionString = process.env.AZURE_BLOB_CONNECTION_STRING;
const containerName = process.env.AZURE_BLOB_CONTAINER_NAME;

/**
 * Azure Blob Storage Model
 * @brief Interacts with the storage to perform CRUD operations using resources
 *        on data
 */
class AzureBlobStorageModel {
  constructor() {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(containerName);
    this.containerClient.createIfNotExists();
  }

  /**
   * Upload blob
   * @param {string} blobName blob name
   * @param {string} blob blob object
   * @param {number} length blob size
   */
  async uploadBlob(blobName, blob, length) {
    await this.containerClient.createIfNotExists();
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const uploadResponse = await blockBlobClient.upload(blob, length);
    return uploadResponse;
  }

  /**
   * Delete blob
   * @param {string} blobName blob name
   */
  async deleteBlob(blobName) {
    const blobClient = this.containerClient.getBlobClient(blobName);
    const deleteResponse = await blobClient.delete();
    return deleteResponse;
  }

  /**
   * Download blob
   * @param {string} blobName blob name
   */
  async downloadBlob(blobName) {
    const blobClient = this.containerClient.getBlobClient(blobName);
    const downloadResponse = await blobClient.download();
    return downloadResponse;
  }

  /**
   * Get all blobs
   */
  async listBlobs() {
    const blobs = [];
    for await (const blob of this.containerClient.listBlobsFlat()) {
      const content = await this.getBlobText(blob.name);
      blobs.push({
        name: blob.name,
        content: content
      });
    }
    return blobs;
  }

  /**
   * Get blob text content
   * @param {string} blobName blob name
   */
  async getBlobText(blobName) {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    const stream = downloadBlockBlobResponse.readableStreamBody;
    stream.setEncoding('utf8');
    let data = '';
    for await (const chunk of stream) data += chunk;
    return data;
  }

  /**
   * Delete all blobs
   */
  async deleteAllBlobs() {
    for await (const blob of this.containerClient.listBlobsFlat()) {
      this.deleteBlob(blob.name);
    }
  }
}

module.exports = AzureBlobStorageModel;