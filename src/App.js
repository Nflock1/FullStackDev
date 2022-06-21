import "./App.css";
import { React, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignUpScreen from "./screens/SignUp";
import LoginScreen from "./screens/Login";
import HomePage from "./screens/HomePage";
import ModalWrapper from "./components/modalWrapper";
import axios from "./axios";

function App() {
	let tmpUser = localStorage.getItem("user");
	const [loggedIn, setLoggedIn] = useState(tmpUser ? true : false);
	const [modal, setModal] = useState("");

	function fatalErrorHelper(emptyString) {
		setLoggedIn(false);
		setModal(emptyString);
	}

	try {
		JSON.parse(tmpUser);
	} catch (error) {
		console.log("User automatically logged out due to invalid local user data.");
		logout();
	}

	function logout() {
		localStorage.removeItem("user");
		console.log("b4 axios");
		axios
			.delete("/api/clear_token")
			.then((res) => {
				//this route will only save a JWT error to the response. Any other errors will be thrown.
				if (res.data.error) {
					if (res.data.errorName === "JsonWebTokenError") {
						setModal(
							`A Fatal JWT Error has occurred. You have been logged out. Name: ${res.data.errorName}. Code: ${res.data.errorCode}. `
						);
					}
				}
			})
			.catch((error) => {
				if (error.code === "ERR_NETWORK") {
					setModal(
						"Due to some network error, we are unable to connect you to the server right now. Please ensure the server is running and that your internet connection is stable."
					);
					return;
				}
				console.log(
					`An error occurred while trying to clear your access token. Error Name - ${
						error.name
					} | Error Code - ${error.code || "N/A"} | Error Message - ${error.message}`
				);
			});
	}

	return (
		<BrowserRouter>
			<Routes>
				{loggedIn ? (
					<Route
						path="/"
						element={
							<>
								{modal ? (
									<ModalWrapper setModalDescription={fatalErrorHelper}>
										<p>{modal}</p>
									</ModalWrapper>
								) : null}
								<HomePage logout={logout} />
							</>
						}
					/>
				) : (
					<Route path="/">
						<Route index element={<LoginScreen setLoggedIn={setLoggedIn} />} />
						<Route path="/signUp" element={<SignUpScreen setLoggedIn={setLoggedIn} />} />
					</Route>
				)}
			</Routes>
		</BrowserRouter>
	);
}

export default App;
