const express = require("express");
const User = require("../models/user.js");
const userRoutes = express.Router();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const argon2 = require("argon2");
const { authenticator } = require("otplib");
const QRCode = require("qrcode");
require("dotenv").config();
//reqire("cookie-parser");

//CORS configuration to allow http requests from the listed domains
//would need to be changes and expanded along with the server to make a "live" version

userRoutes.use((req, res, next) => {
	res.header("Origin", "http://localhost:3000");
	res.header("Access-Control-Allow-Origin", "http://localhost:3000");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept, Authorization"
	);
	res.header("Access-Control-Allow-Credentials", "true");
	next();
});

/*
 * NOTE ON STATUS CODES: status codes used here stay within the 200's or else Axios comandeers the response object and creates it's own error messages.
 * to avoid unexpected response structures and to provide clarity in errors, a custom system of coding is used where:
 * used here <->  standard
 * 298       <->  400
 * 299       <->  401
 * 200       <->  200
 */

/*
 *   This route accomodates the creation of a new user within the MongoDB database
 *
 *   Reqruired Fields in req.body: username, password, email
 */
userRoutes.post("/api/signUp", async (req, res) => {
	const username = req.body.username;
	const password = await bcrypt.hash(req.body.password, 10);
	const email = req.body.email;
	let counter = 0;
	const secret = authenticator.generateSecret();
	try {
		let response = await User.create({
			username,
			email,
			password,
			counter,
			secret,
		});
		QRCode.toDataURL(authenticator.keyuri(email, "FullStackDev", secret), (err, url) => {
			if (err) {
				console.log("Error Name: " + err.name + "; Error Message: " + err.message);
				res.status(298);
				res.json({
					message: "Something went wrong when generating a QR code for 2fa.",
					errName: err.name,
					errcode: err.code,
					message: err.message,
					error: true,
				});
			} else {
				res.status(200);
				res.json({ qr: url, message: "User has been sucessfully created." });
			}
		});
	} catch (error) {
		//need to handle more broadly
		console.log(error.message);
		res.status(298);
		res.json({
			error: true,
			message: "Something went wrong when trying to create your account.",
			errorCode: error.code,
			errorMessage: error.message,
		});
	}
});

/*
 *   This route is used to verify that the login info provided
 *   by the user matches an account on the server and then provides
 *   a data/access token to the client for the user to use to access
 *   secure routes.
 *
 *   Reqruired Fields in req.body: password, email
 */
userRoutes.post("/api/login", async (req, res) => {
	try {
		let user = await User.findOne({ email: req.body.email });
		if (user) {
			if (await bcrypt.compare(req.body.password, user.password)) {
				// the username, password combination is successful
				const token = jwt.sign(
					{
						id: user._id,
						email: user.email,
					},
					process.env.JWT_SECRET
				);
				res.status(200);
				//for additional security
				res.cookie("token", "Bearer " + token, { httpOnly: true });
				return res.json({
					message: "login and JWT generation was sucessful.",
					user: { count: user.counter, username: user.username, email: user.email },
				});
			}
			res.status(298);
			res.json({ message: "Incorrect password." });
		} else {
			res.status(298);
			res.json({ message: "Email not associated with any user." });
		}
	} catch (error) {
		console.log(error.name + " : " + error.message);
		res.status(298);
		res.json({
			error: true,
			message: "Something went wrong when trying to log your account in.",
			errorCode: error.code,
			errorMessage: error.message,
		});
	}
});

function verifyJWT(req, res, next) {
	const bearerToken = req.cookies.token;
	if (bearerToken) {
		//remove 'bearer: ' schema
		let token = bearerToken.slice(7);
		jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] }, (err, decoded) => {
			if (err) {
				console.log(
					"Error Name: " + err.name + "; Code: " + err.code + "; Message: " + err.message
				);
				res.status(299);
				res.json({
					//need to account for wrong token given back
					name: err.name,
					message:
						"Something went wrong when trying to verify the token provided by client. " +
						err.name +
						" : " +
						err.message,
				});
			}
			req.user = {};
			req.user.id = decoded.id;
			req.user.email = decoded.email;
			next();
		});
	} else {
		res.status(299);
		res.json({ message: "No access token was given" });
	}
}

userRoutes.post("/api/count", verifyJWT, async (req, res) => {
	try {
		let response = await User.findOneAndUpdate({ email: req.user.email }, { $inc: { counter: 1 } });
		if (response) {
			res.status(200);
			res.json({ message: "count has been incremented", count: response.counter + 1 });
		}
	} catch (err) {
		console.log("Error Name: " + err.name + "; Code: " + err.code + "; Message: " + err.message);
		res.status(299);
		res.json({
			//fix this
			message: "Something went wrong when trying to count. " + err.name + " : " + err.message,
			error: true,
		});
	}
});

userRoutes.get("/api/user", verifyJWT, async (req, res) => {
	console.log("if this doesn't run, delete");
	try {
		let response = await User.findOne({ email: req.user.email });
		if (response) {
			res.status(200);
			res.json({
				message: "user was found",
				user: { email: response.email, count: response.counter, username: response.username },
			});
		} else {
			res.status(298);
			res.json({ message: "user was not found" });
		}
	} catch (error) {
		console.log("an error has occurred when finding a user: " + error.name + " : " + error.message);
	}
});

userRoutes.post("/api/code", verifyJWT, async (req, res) => {
	try {
		let response = await User.findOne({ email: req.user.email });
		if (response) {
			res.status(200);
			res.json({
				message: "code was found",
				user: { code: response.secret },
			});
		} else {
			res.status(298);
			res.json({ message: "user was not found" });
		}
	} catch (error) {
		console.log("an error has occurred when finding a user: " + error.name + " : " + error.message);
	}
});
module.exports = userRoutes;
