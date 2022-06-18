import "../App.css";
import { React, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalWrapper from "../components/modalWrapper";
import axios from "../axios";

export default function LoginScreen(props) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [formatError, setFormatError] = useState("");

	let navigate = useNavigate();

	async function submit() {
		if (!email) {
			setFormatError("Email address is a required field to login.");
			return;
		}
		if (!password) {
			setFormatError("Password is a required field to login.");
			return;
		}
		let res = await axios.post("/api/login", { email, password });
		localStorage.setItem("token", res.data.token);
		localStorage.setItem("user", JSON.stringify(res.data.user));
		props.setLoggedIn(true);
	}

	return (
		<div className="App">
			{formatError && (
				<ModalWrapper setFormatError={setFormatError}>
					<p>{formatError}</p>
				</ModalWrapper>
			)}
			<form>
				<header>login</header>

				<div>
					<label>
						Enter Email:
						<input type="text" value={email} onChange={(event) => setEmail(event.target.value)} />
					</label>
				</div>

				<div>
					<label>
						Enter Password:
						<input
							type="text"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
						/>
					</label>
				</div>
			</form>
			<button onClick={submit}>login</button>
			<div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
				<p style={{ margin: 5 }}>Don't have an account?</p>
				<button
					style={{ height: "50%", marginTop: "auto", marginBottom: "auto" }}
					onClick={() => navigate("../signUp")}
				>
					Sign Up{" "}
				</button>
			</div>
		</div>
	);
}
