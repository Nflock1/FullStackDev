import logo from "./logo.svg";
import "./App.css";
import { React, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignUpScreen from "./screens/SignUp";
import LoginScreen from "./screens/Login";
import HomePage from "./screens/HomePage";

function App() {
	const [username, setUsername] = useState(null);
	const [email, setEmail] = useState(null);
	const [password, setPassword] = useState(null);
	const [signUp, setSignUp] = useState(false);
	const [loggedIn, setLoggedIn] = useState(
		localStorage.getItem("token") ? (localStorage.getItem("user") ? true : false) : false
	);

	function logout() {
		setLoggedIn(false);
		localStorage.removeItem("token");
		localStorage.removeItem("user");
	}

	return (
		<BrowserRouter>
			<Routes>
				{loggedIn ? (
					<Route path="/" element={<HomePage logout={logout} />} />
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
