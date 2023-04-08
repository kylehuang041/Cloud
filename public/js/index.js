/**
 * @file index.js
 * @author Kyle Huang
 * @date 2/25/2023
 * Interactivity of webpage
 */

(function() {
  window.addEventListener("load", init);

  const URI_PEOPLE_API = "https://s3-us-west-2.amazonaws.com/css490/input.txt";
  const PATH_BLOB = "/blob";
  const PATH_COSMOS = "/cosmos";
  const PATH_BLOB_ALL = `${PATH_BLOB}/all`;
  const PATH_BLOB_TEXT = PATH_BLOB + "/text/";
  const PATH_BLOB_UPLOAD = `${PATH_BLOB}/upload`;
  const PATH_COSMOS_ALL = `${PATH_COSMOS}/all`;

  // main function: initialization
  function init() {
    let loadBtn = document.querySelector("#load-btn");
    let clearBtn = document.querySelector("#clear-btn");
    let queryBtn = document.querySelector("#query-btn");
    let result = document.querySelector("#result");
    let lastNameInput = document.querySelector("#last-name");
    let firstNameInput = document.querySelector("#first-name");

    result.classList.add("hidden"); // hide results from start
    loadData(); // load data from start

    // buttons
    loadBtn.addEventListener("click", loadData);
    clearBtn.addEventListener("click", clearData);
    queryBtn.addEventListener("click", queryData);

    setFooterDate(); // set footer content
  }

  /**
   * Sends query resource to Azure CosmosDB container
   * @param {object} ev = event
   */
  async function queryData(ev) {
    try {
      ev.preventDefault();
      // get last name and first name from form input elements
      lastNameInput = document.querySelector("#last-name");
      firstNameInput = document.querySelector("#first-name");
      if (!lastNameInput && !firstNameInput) return;
      let last_name = lastNameInput.value;
      let first_name = firstNameInput.value;

      // add the last name and first name into query string from URI
      let tempURI = PATH_COSMOS_ALL + "?";
      if (last_name && first_name) tempURI += `last_name=${last_name}&first_name=${first_name}`;
      else if (last_name) tempURI += `last_name=${last_name}`;
      else tempURI += `first_name=${first_name}`;

      // send query request to node web service
      let res = await fetch(tempURI);
      await checkStatus(res);
      let data = await res.json();
      processQuery(data); // filter contents on webpage
    } catch (err) {
      handleError(err);
    }
  }

  /**
   * Filters out data from query response data on webpage
   * @param {object} data = query response data
   */
  function processQuery(data) {
    let resultCont = document.querySelector("#result-container");
    for (const item of resultCont.children) {
      let itemId = item.getAttribute("id");
      let realId = itemId.replace(`item-`, "");
      // If matches, then display item content
      if (data.includes(realId)) {
        document.querySelector(`#${itemId}`).classList.remove("hidden");
      // If no match, then do not display item content
      } else {
        document.querySelector(`#${itemId}`).classList.add("hidden");
      }
    }
    clearFormInputs()
  }

  /**
   * Loads data onto webpage by fetching text file from API, converting it into blob,
   * sending blob to Azure Blob storage container, receiving the blob data from
   * Azure blob storage, converting it into an object, sending the object to Azure
   * CosmosDB database container, and finally gets all items from Azure CosmosDB
   * container (very wasteful xD)
   * @param {ev} ev = event
   */
  async function loadData(ev = null) {
    if (ev) ev.preventDefault();
    let res = await getData();
    let fileName = res[0];
    let text = res[1];
    let blob = new Blob([text], { type: 'text/plain' });
    await sendBlob(fileName, blob);
    text = await getBlobText(fileName);
    await sendObject(text);
    let data = await getAllItems();
    clearFormInputs()
    processObject(data);
  }

  /**
   * Get blob text from Azure Blob container
   * @param {string} fileName = file/blob name
   */
  async function getBlobText(fileName) {
    try {
      let res = await fetch(PATH_BLOB_TEXT + fileName);
      await checkStatus(res);
      let data = res.text();
      return data;
    } catch (err) {
      handleError(err);
    }
  }

  /**
   * Send object to Azure CosmosDB container
   * @param {string} text = text
   */
  async function sendObject(text) {
    try {
      let data = convertTextToObj(text); // convert text to object
      let res = await fetch(PATH_COSMOS_ALL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      await checkStatus(res);
    } catch (err) {
      handleError(err);
    }
  }

  /**
   * Get all items from Azure CosmosDB container
   */
  async function getAllItems() {
    try {
      let res = await fetch(PATH_COSMOS_ALL);
      await checkStatus(res);
      let data = await res.json();
      return data;
    } catch (err) {
      handleError(err);
    }
  }

  /**
   * Displays the data object onto webpage
   * @param {object} data = data
   */
  function processObject(data) {
    let result = document.querySelector("#result");
    let resultCont = result.querySelector("#result-container");
    if (!Array.isArray(data) || data.length <= 0) return; // if empty data, exit function
    result.classList.remove("hidden"); // show result element

    // IDs of data content on webpage
    let itemIds = Array.from(resultCont.children).map(item => item.getAttribute("id"));
    for (let item of data) {
      // If item is on the webpage already, then make it visible and skip it
      if (itemIds.includes(`item-${item.id}`)) {
        let target = document.getElementById(`item-${item.id}`);
        target.classList.remove("hidden");
        continue;
      }

      // Create new data content of item onto webpage
      let itemDiv = document.createElement("div");
      itemDiv.classList.add("result-items");
      itemDiv.setAttribute("id", `item-${item.id}`);
      for (let attribute in item) {
        if (!attribute.startsWith("_")) {
          let paragraph = document.createElement("p");
          paragraph.textContent = attribute + ": " + item[attribute];
          itemDiv.appendChild(paragraph);
        }
      }
      resultCont.appendChild(itemDiv);
    }
  }

  /**
   * Convert text into object
   * @param {string} text =  text
   */
  function convertTextToObj(text) {
    let array = [];
    text = text.split("\n"); // split text into individual data

    // create object from text
    text.forEach(entry => {
      let subarr = entry.split(/\s+/);
      let obj = {};
      for (let i = 0; i < subarr.length; ++i) {
        let attribute = subarr[i];
        if (attribute.includes("=")) {
          let parts = attribute.split("=");
          obj[parts[0]] = parts[1];
        } else {
          if (i === 0) obj["last_name"] = attribute;
          else if (i === 1) obj["first_name"] = attribute;
        }
      }
      array.push(obj);
    });
    return array;
  }

  /**
   * Remove extra spaces from text
   * @param {string} text = text
   */
  function removeExtraSpaces(text) {
    let regex = /( )( +)/g;
    return text.trim().replace(regex, "$2");;
  }

  /**
   * Retrieve text file from API
   */
  const getData = async () => {
    try {
      const response = await fetch(URI_PEOPLE_API);
      const fileName = response.url.split("/").pop();
      await checkStatus(response);
      const text = await response.text();
      return [fileName, removeExtraSpaces(text)];
    } catch (err) {
      handleError(err);
    }
  };

  /**
   * Send blob to Azure Blob storage to save
   * @param {string} fileName = file name
   * @param {object} blob = blob object
   */
  const sendBlob = async (fileName, blob) => {
    try {
      const formData = new FormData();
      formData.append('file', blob, fileName);
      const response = await fetch(PATH_BLOB_UPLOAD, {method: 'POST', body: formData});
      await checkStatus(response);
    } catch (err) {
      handleError(err);
    }
  };

  /**
   * Send delete request to both Azure blob storage and cosmosdb container and
   * delete all data content on webpage
   * @param {object} ev = event
   */
  async function clearData(ev) {
    ev.preventDefault();
    let result = document.getElementById("result");
    let resultCont = result.querySelector("#result-container");
    result.classList.add("hidden");
    resultCont.innerHTML = "";
    try {
      await fetch(PATH_BLOB_ALL, { method: "DELETE" });
      await fetch(PATH_COSMOS_ALL, { method: "DELETE" });
    } catch (err) {
      handleError(err);
    }
    clearFormInputs();
  }

  function clearFormInputs() {
    lastNameInput = document.querySelector("#last-name");
    firstNameInput = document.querySelector("#first-name");
    lastNameInput.value = "";
    firstNameInput.value = "";
  }

  /**
   * Set year in footer
   */
  function setFooterDate() {
    let footer = document.querySelector("footer");
    let date = new Date();
    footer.textContent += ' ' + date.getFullYear();
  } 

  /**
   * Check if response is valid
   * @param {object} res = response
   */
  async function checkStatus(res) {
    if (!res.ok) return new Error(await res.text());
    return res;
  }

  /**
   * Print error
   */
  function handleError(err) {
    console.error(err);
  }
})();