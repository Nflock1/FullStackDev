require("dotenv").config();
const mongoose = require("mongoose");
const createServer = require("./server.js");
const app = createServer();

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true }).then(() => {
	app.listen(process.env.port, () => {
		console.log(`server has started on port: ${process.env.port}`);
	});
});
