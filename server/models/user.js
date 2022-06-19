const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
	{
		username: { type: String, required: true },
		email: { type: String, required: true },
		password: { type: String, required: true },
		secret: { type: String },
		counter: { type: Number, required: true },
	},
	{ collection: "users" }
);

const model = mongoose.model("UserSchema", UserSchema);
module.exports = model;