const { CosmosClient } = require("@azure/cosmos");

const key = process.env.AZURE_COSMOS_KEY;
const endpoint = process.env.AZURE_COSMOS_ENDPOINT;
const databaseName = process.env.AZURE_COSMOS_DB_NAME;
const containerName = process.env.AZURE_COSMOS_CONT_NAME;

/**
 * CosmosDB database Model
 * @brief Interacts with the storage to perform CRUD operations using resources
 *        on data
 */
class AzureCosmosDBModel {
  constructor() {
    this.cosmosClient = new CosmosClient({ endpoint, key });
    this.createDatabaseAndContainer();
    this.database = this.cosmosClient.database(databaseName);
    this.container = this.database.container(containerName);
  }

  /**
   * Create database and container
   */
  async createDatabaseAndContainer() {
    const { database } = await this.cosmosClient.databases.createIfNotExists({ id: databaseName });
    const containerProperties = {
      id: containerName,
      partitionKey: { paths: ['/last_name'] },
      uniqueKeyPolicy: {
        uniqueKeys: [
          {
            paths: ['/last_name', '/first_name']
          }
        ]
      }
    };
    await database.containers.createIfNotExists(containerProperties);
  }

  /**
   * Create item into db
   * @param {jsonObject} data data = [ {...}, {...}, ...]
   */
  async createAllItems(data) {
    for (const entry in data) {
      try {
        await this.container.items.upsert(data[entry]);
      } catch (err) {
        continue;
      }
    }
  }

  /**
   * Get all or some items
   * @param {string} last_name = last name
   * @param {string} first_name = first name
   */
  async getItems(lastName, firstName) {
    let querySpec = {
      query: "",
      parameters: []
    };

    let isAll = false;

    // make query to filter data with last name and first name
    if (lastName && firstName) {
      querySpec.query += "SELECT c.id FROM c WHERE c.last_name = @last_name AND c.first_name = @first_name";
      querySpec.parameters.push({name: "@last_name", value: lastName});
      querySpec.parameters.push({ name: "@first_name", value: firstName });
    // make query to filter data only with last name
    } else if (lastName) {
      querySpec.query += "SELECT c.id FROM c WHERE c.last_name = @last_name";
      querySpec.parameters.push({ name: "@last_name", value: lastName });
    // make query to filter data only with first name
    } else if (firstName) {
      querySpec.query += "SELECT c.id FROM c WHERE c.first_name = @first_name";
      querySpec.parameters.push({ name: "@first_name", value: firstName });
    // make query to get all data
    } else {
      querySpec.query += "SELECT * FROM c";
      isAll = true;
    }

    let { resources } = await this.container.items.query(querySpec).fetchAll();
    if (!isAll) resources = resources.map(obj => obj.id);
    return resources;
  }

  /**
   * Delete all items
   */
  async deleteAllItems() {
    const querySpec = "SELECT * FROM c";
    const items = this.container.items.query(querySpec);
    while (items.hasMoreResults()) {
      const { resources } = await items.fetchNext();
      for (const item of resources) {
        await this.container.item(item.id, item.last_name).delete();
      }
    }
  }
}

module.exports = AzureCosmosDBModel;