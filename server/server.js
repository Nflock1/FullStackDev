const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

function createServer() {
	app.use(express.json());
	app.use(require("./routes/userAuth"));
	app.use(cors({ AccessControlAllowOrigin: "http:localhost:3000" }));
	return app;
}

module.exports = createServer;
