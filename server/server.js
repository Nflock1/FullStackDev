const express = require("express");
const app = express();
const session = require("express-session");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const csurf = require("csurf");
const csrfProtection = csurf({ cookie: false });

function createServer() {
	app.use(cookieParser());
	app.use(session({ resave: true, saveUninitialized: true, secret: process.env.CSURF_SECRET }));
	app.use(csrfProtection);
	app.use(express.json());
	app.use((err, req, res, next) => {
		if (err.code !== "EBADCSRFTOKEN") {
			return next(err);
		} else {
			res.status(297);
			console.log(JSON.stringify(err));
			console.log(`invalid CSRF token provided.`);
			return res.json({
				error: true,
				message: `A CSURF error has occurred. ${err.message}`,
				errorName: err.name,
				errorCode: err.code,
			});
		}
	});
	app.use(require("./routes/userAuth"));
	app.use(cors());
	return app;
}

module.exports = createServer;
