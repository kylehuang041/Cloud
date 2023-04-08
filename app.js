const express = require("express");
const app = express();

const { appName } = require("./config/app.config");
const blobRouter = require("./routes/blob.js");
const cosmosRouter = require("./routes/cosmos.js");

const OK = 200;
const SERV_ERR = 500;
const SERV_ERR_MESG = "Something went wrong with the server";

app.set("view engine", "ejs"); // set ejs template engine

// middlewares
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(errorHandler);
app.use("/blob", blobRouter);
app.use("/cosmos", cosmosRouter);

// get home page
app.get("/", (req, res) => {
  res.status(OK).render("index", { appName: appName });
});

/**
 * if error, it sends it back to the client
 * @err error
 * @req request
 * @res response
 * @next next
 */
function errorHandler(err, req, res, next) {
  console.log(err);
  res.status(SERV_ERR).type("text").send(SERV_ERR_MESG);
}

// apply public folder as public and make server listen on port
app.use(express.static(__dirname + "/public"));
const PORT = process.env.PORT || 4321;
app.listen(PORT, () => console.log(`server listening on port ${PORT}`));