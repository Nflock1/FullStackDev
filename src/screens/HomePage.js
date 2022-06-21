import { React, useState, useEffect } from "react";

import axios from "../axios.js";
import ModalWrapper from "../components/modalWrapper.js";

export default function HomePage(props) {
	const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
	const [count, setCount] = useState(user.count || 0);
	const [modal, setModal] = useState("");

	useEffect(() => {
		localStorage.setItem("user", JSON.stringify(user));
	});

	async function incCount() {
		const token = localStorage.getItem("token");
		let res = await axios
			.post("/api/count", {}, { headers: { Authorization: token } })
			.catch((error) => {
				if (error.code === "ERR_NETWORK") {
					setModal(
						"Due to some network error, we are unable to connect you to the server right now. Please ensure the server is running and that your internet connection is stable."
					);
					return;
				}
				setModal(
					`An error has occurred while incrementing your count. Name: ${error.name}. Code: ${error.code}.`
				);
				console.log(
					`Error when incrementing the user's count: Error Name: ${error.name}. Error Code: ${
						error.code || "N/A"
					}. Error Message: ${error.message}`
				);
			});
		//handle fatal errors and errors and update user data
		if (res.data.loggedOut) {
			console.log("logout in homepage");
			props.logout();
		} else if (res.data.error) {
			setModal(
				`An error occurred while trying to increment your count. Name: ${res.data.errorName}. Code: ${res.data.errorCode}.`
			);
			console.log(res.data.message);
		} else {
			setCount(res.data.count);
			setUser((user) => {
				user.count = res.data.count;
				return user;
			});
		}
	}

	return (
		<div>
			{modal ? (
				<ModalWrapper setModalDescription={setModal}>
					<p>{modal}</p>
				</ModalWrapper>
			) : null}
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
