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

//CORS configuration to allow http requests from the listed domains
//would need to be changed and expanded along with the server to make a "live" version
userRoutes.use((req, res, next) => {
	res.header("Origin", "http://localhost:3000");
	res.header("Access-Control-Allow-Origin", "http://localhost:3000");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept, Authorization, x-csrf-token"
	);
	res.header("Access-Control-Allow-Credentials", "true");
	res.header("Access-Control-Allow-Methods", "GET,POST,DELETE");
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
 *   and generates a QR code from the user's email and secret as well as the name of
 *   the app and provides that QR code in the response to set up the second half of 2fa
 *   Reqruired Fields in req.body: username, password, email
 */
userRoutes.post("/api/signUp", async (req, res) => {
	const username = req.body.username;
	const password = await bcrypt.hash(req.body.password, 10);
	const email = req.body.email;
	let counter = 0;
	let mfaFlag = false;
	const secret = authenticator.generateSecret();
	try {
		let response = await User.create({
			username,
			email,
			password,
			secret,
			counter,
			mfaFlag,
		});
		QRCode.toDataURL(authenticator.keyuri(email, "FullStackDev", secret), (err, url) => {
			if (err) {
				let m = `The following error occurred when trying to create a 2fa QR code for (${email}): Error Name - ${
					error.name
				} | Error Code - ${error.code || "N/A"} | Error Message - ${error.message}`;
				console.log(m + ` | Error Path: /api/signup:1`);
				res.status(298);
				res.json({
					error: true,
					message: m,
					errorName: error.name,
					errorCode: error.code || "N/A",
				});
			} else {
				res.status(200);
				res.json({ qr: url, message: "User has been sucessfully created." });
				console.log(`(${email}) has been sucessfully registered in the database.`);
			}
		});
	} catch (error) {
		//need to handle more broadly
		if (error.code === 11000) {
			if (error.message.includes("username")) {
				res.status(298);
				res.json({
					error: true,
					message: "The provided username is already in use.",
					errorName: error.name,
					errorCode: error.code || "N/A",
				});
			} else {
				res.status(298);
				res.json({
					error: true,
					message: "The provided email is already in use.",
					errorName: error.name,
					errorCode: error.code || "N/A",
				});
			}
		} else {
			let m = `The following error occurred when trying to create new account: Error Name - ${
				error.name
			} | Error Code - ${error.code || "N/A"} | Error Message - ${error.message}`;
			console.log(m + ` | Error Path: /api/signup:2`);
			res.status(298);
			res.json({
				error: true,
				message: m,
				errorName: error.name,
				errorCode: error.code || "N/A",
			});
		}
	}
});

/*
 *   This route is used to verify that the login info provided
 *   by the user matches an account on the server and then provides
 *   a data/access token to the client for the user to use to access
 *   secure routes.
 *
 *   Reqruired Fields in req.body: password, email, code
 */
userRoutes.post("/api/2fa_login", async (req, res) => {
	try {
		let user = await User.findOne({ email: req.body.email });
		if (user) {
			//verify this for a second time
			if (await bcrypt.compare(req.body.password, user.password)) {
				// the username, password combination is successful
				const token = jwt.sign(
					{
						id: user._id,
						email: user.email,
					},
					process.env.JWT_PRIVATE,
					{
						algorithm: "RS256",
						expiresIn: "1h",
						issuer: "Full Stack Dev Demo Server",
						subject: user.email,
					}
				);
				if (authenticator.check(req.body.code, user.secret)) {
					res.status(200);
					//for additional security store in httpOnly cookie
					res.cookie("token", "Bearer " + token, { httpOnly: true });
					res.json({
						message: "login and JWT generation was sucessful.",
						user: { count: user.counter, username: user.username, email: user.email },
					});
					await User.findOneAndUpdate({ email: user.email }, { mfaFlag: true });
					console.log(
						`(${user.email}) has sucessfully logged in with the second layer of 2fa authentication.`
					);
				} else {
					res.status(298);
					res.json({ message: "The provided 6-digit 2FA code is incorrect." });
				}
			} else {
				res.status(298);
				res.json({ message: "The provided password is incorrect." });
			}
		} else {
			res.status(298);
			res.json({ message: "The Provided email is not associated with any user." });
		}
	} catch (error) {
		let m = `The following error occurred when trying to login the user associated with ${
			req.body.email
		}: Error Name - ${error.name} | Error Code - ${error.code || "N/A"} | Error Message - ${
			error.message
		}`;
		console.log(m + ` | Error Path: /api/2fa_login:1`);
		res.status(298);
		res.json({
			error: true,
			message: m,
			errorName: error.name,
			errorCode: error.code || "N/A",
		});
	}
});

/*
 *  This route handles the first level of authentication where
 *  the provided password is verified against the hashed password
 *  stored on the server.
 *
 *  Reqruired Fields in req.body: password, email
 */
userRoutes.post("/api/verify_login", async (req, res) => {
	try {
		let user = await User.findOne({ email: req.body.email });
		if (user) {
			if (await bcrypt.compare(req.body.password, user.password)) {
				//generate a new secret for a user if they haven't finished setting up 2fa yet
				if (!user.mfaFlag) {
					const secret = user.secret;
					//authenticator.generateSecret();
					await User.updateOne({ email: req.body.email }, { secret: secret });
					//create QR code from email, name of app, and secret
					QRCode.toDataURL(
						authenticator.keyuri(req.body.email, "FullStackDev", secret),
						(err, url) => {
							if (err) {
								let m = `The following error occurred when trying to create a 2fa QR code for (${
									req.body.email
								}): Error Name - ${error.name} | Error Code - ${
									error.code || "N/A"
								} | Error Message - ${error.message}`;
								console.log(m + ` | Error Path: /api/verify_login:1`);
								res.status(298);
								res.json({
									error: true,
									message: m,
									errorName: error.name,
									errorCode: error.code || "N/A",
								});
							} else {
								res.status(200);
								res.json({
									qr: url,
									message: "Password is correct and a new QR code was generated.",
								});
								console.log(
									`(${user.email}) has sucessfully logged in with the first layer of 2fa authentication.`
								);
							}
						}
					);
				} else {
					res.status(200);
					res.json({ message: "Password is correct." });
					console.log(
						`(${user.email}) has sucessfully logged in with the first layer of 2fa authentication.`
					);
				}
			} else {
				res.status(298);
				res.json({ message: "Incorrect password." });
			}
		} else {
			res.status(298);
			res.json({ message: "Email not associated with any user." });
		}
	} catch (error) {
		let m = `The following error occurred when trying to verify the password for (${
			req.body.email
		}): Error Name - ${error.name} | Error Code - ${error.code || "N/A"} | Error Message - ${
			error.message
		}`;
		console.log(m + ` | errorPath: /api/verify_login:2`);
		res.status(298);
		res.json({
			error: true,
			message: m,
			errorName: error.name,
			errorCode: error.code || "N/A",
		});
	}
});

/*
 *  This function authenticates JWT tokens provided as access tokend by the client.
 *
 *  Reqruired Fields in req.body: none since token is stored in an HTTPOnly cookie
 *  which is automatically included in api requests (see 'src/axios.js')
 */
function verifyJWT(req, res, next) {
	const bearerToken = req.cookies.token;
	if (bearerToken) {
		//remove 'bearer: ' schema
		let token = bearerToken.slice(7);
		jwt.verify(
			token,
			process.env.JWT_PUBLIC,
			{ algorithms: ["HS256"], maxAge: "1h", issuer: "Full Stack Dev Demo Server" },
			(err, decoded) => {
				if (err) {
					let m = `The following error occurred when trying to verify the provided token: Error Name - ${
						err.name
					} | Error Code - ${err.code || "N/A"} | Error Message - ${err.message}`;
					console.log(m + ` | Error Path: verifyJWT:1`);
					res.status(401);
					return res.json({
						error: true,
						message: m,
						errorName: err.name,
						errorCode: err.code || "N/A",
						loggedOut: true,
					});
				} else {
					//store decoded parameters in request for use in authenticzated routes
					req.user = {};
					req.user.id = decoded.id;
					req.user.email = decoded.email;
					next();
				}
			}
		);
	} else {
		res.status(299);
		return res.json({ message: "No access token was given", loggedOut: true });
	}
}

/*
 *  This route handles the first level of authentication where
 *  the provided password is verified against the hashed password
 *  stored on the server.
 *
 *  Reqruired Fields in req.body: none since only the email is needed,
 *  which is stored in the access token provided by the client and is
 *  accessible after authentication by verifyJWT
 */
userRoutes.post("/api/count", verifyJWT, async (req, res) => {
	try {
		let response = await User.findOneAndUpdate({ email: req.user.email }, { $inc: { counter: 1 } });
		if (response) {
			res.status(200);
			res.json({ message: "count has been incremented", count: response.counter + 1 });
			console.log(`(${req.user.email})'s count has been increased`);
		}
	} catch (err) {
		let m = `The following error occurred when trying to update (${
			req.user.email
		})'s count in the database: Error Name - ${err.name} | Error Code - ${
			err.code || "N/A"
		} | Error Message - ${err.message}`;
		console.log(m + ` | Error Path: /api/count:1`);
		res.status(298);
		res.json({
			error: true,
			message: m,
			errorName: err.name,
			errorCode: err.code || "N/A",
		});
	}
});

/*
 * This route aids in clearing the JWT from the browser cookies, where it is stored
 *
 * required fields for req.body: none
 */
userRoutes.delete("/api/clear_token", verifyJWT, (req, res) => {
	res.clearCookie("token");
	res.status(200);
	return res.json({ message: "token has been cleared" });
});

userRoutes.get("/api/csrf", (req, res) => {
	res.json({ csrfToken: req.csrfToken() });
});

module.exports = userRoutes;
