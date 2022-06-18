import { React, useState, useEffect } from "react";

import axios from "../axios.js";

export default function HomePage(props) {
	const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
	console.log(user);
	const [count, setCount] = useState(user.count || 0);

	async function incCount() {
		const token = localStorage.getItem("token");
		let res = await axios.post("/api/count", {}, { headers: { Authorization: token } });
		if (res.error) {
		} else {
			setCount(res.data.count);
			setUser((user) => {
				user.count = res.data.count;
				return user;
			});
			console.log("res.data: " + JSON.stringify(res.data));
		}
	}

	useEffect(() => {
		localStorage.setItem("user", JSON.stringify(user));
	});

	return (
		<div>
			<h2>Congratulations, you have authenticated and are logged in!</h2>
			<h1>Count:</h1>
			<p style={{ fontSize: 100 }}>{count}</p>
			<button
				onClick={() => {
					props.logout();
				}}
			>
				logout
			</button>
			<button onClick={incCount}>Click to count!</button>
		</div>
	);
}
