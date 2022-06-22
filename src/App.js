import "./App.css";
import { React, useState, useEffect } from "react";
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
	const [logoutModal, setLogoutModal] = useState("");

	function fatalErrorHelper(emptyString) {
		localStorage.removeItem("user");
		setLoggedIn(false);
		setLogoutModal(emptyString);
	}

	useEffect(() => {
		const getCsrfToken = async () => {
			const { data } = await axios.get("/api/csrf");
			axios.defaults.headers.common["x-csrf-token"] = data.csrfToken;
		};
		getCsrfToken();
	}, []);

	try {
		JSON.parse(tmpUser);
	} catch (error) {
		console.log("User automatically logged out due to invalid local user data.");
		logout();
	}

	function logout() {
		axios
			.delete("/api/clear_token")
			.then((res) => {
				//this route will only save a JWT error to the response. Any other errors will be thrown.
				if (res.data.error) {
					if (res.data.errorName === "JsonWebTokenError") {
						//bad JWT
						setLogoutModal(
							`A Fatal JWT Error has occurred. You have been logged out. Name: ${res.data.errorName}. Code: ${res.data.errorCode}. `
						);
					} else if (res.data.errorName === "TokenExpiredError") {
						setLogoutModal(`Your session has expired. You have been logged out.`);
					} else {
						//some other error
						setLogoutModal(
							`An error occurred while attempting to log you out. Error Name: ${
								res.data.errorName
							}. Error Code: ${res.data.errorCode || "N/A"}. Error Message: ${
								res.data.errorMessage
							}`
						);
					}
				} else {
					setLogoutModal(`You have been logged out.`);
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
								{logoutModal ? (
									<ModalWrapper setModalDescription={fatalErrorHelper}>
										<p>{logoutModal}</p>
									</ModalWrapper>
								) : null}
								{modal ? (
									<ModalWrapper setModalDescription={setModal}>
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
