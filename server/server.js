const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");

function createServer() {
	app.use(cookieParser());
	app.use(express.json());
	app.use(require("./routes/userAuth"));
	app.use(cors());
	return app;
}

module.exports = createServer;
