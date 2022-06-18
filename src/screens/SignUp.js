import "../App.css";
import { React, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalWrapper from "../components/modalWrapper";
import axios from "../axios";

let sucessText = "User has been sucessfully created.";

export default function SignUpScreen(props) {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const [ModalDescription, setModalDescription] = useState("");

	let navigate = useNavigate();

	async function login() {
		//need to try catch this
		let res = await axios.post("http://localhost:5000/api/login", { email, password });
		if (res.data.token) {
			localStorage.setItem("token", res.data.token);
			localStorage.setItem("user", JSON.stringify(res.data.user));
			props.setLoggedIn(true);
			// '../' becomes homepage route when user is logged in
			returnToLogin();
			setModalDescription("");
		} else if (res.data.error) {
			setModalDescription(res.data.message);
		} else {
			//may make more user friendly?
			setModalDescription(res.data.message);
		}
	}

	async function submit() {
		if (!username) {
			setModalDescription("No username was provided when signing up");
			return;
		}
		if (!email) {
			setModalDescription("No email was provided when signing up.");
			return;
		}
		if (!password || !passwordConfirm) {
			setModalDescription(
				"At least one password entry was not provided when signing up (2 are required to confirm)."
			);
			return;
		}
		if (password !== passwordConfirm) {
			setModalDescription("passwords provided when signing up did not match");
			return;
		}
		//sign up information should be "valid" text at this point so a post is made
		let res = await axios
			.post("http://localhost:5000/api/signUp", {
				username: username,
				email: email,
				password: password,
			})
			.catch((error) => {
				if (error.code === "ERR_NETWORK") {
					setModalDescription(
						"Due to some network error, we are unable to connect you to the server right now. Please ensure the server is running and that your internet connection is stable."
					);
				} else {
					//so that unexpected errors are still provided in a useful way
					setModalDescription(
						res.data.message + " Error Code " + res.data.errorCode + ": " + res.data.errorMessage
					);
				}
			});
		if (ModalDescription !== "") {
			//if an error occurs, this should run no further
			return;
		}
		setModalDescription(res.data.message);
	}

	function returnToLogin() {
		navigate("../");
	}

	return (
		<div className="App">
			{!ModalDescription ? null : ModalDescription === sucessText ? ( //user has been sucessfully registered
				<ModalWrapper setModalDescription={setModalDescription} button={true}>
					<p>Your account has been sucessully created.</p>
					<button onClick={login}>Continue to Home Page</button>
				</ModalWrapper>
			) : (
				//there is some modal to be rendered, but it is not sucessful
				<ModalWrapper setModalDescription={setModalDescription}>
					<p>{ModalDescription}</p>
				</ModalWrapper>
			)}

			<form>
				<header>SignUp</header>

				<div>
					<label>
						Enter Username:
						<input
							type="text"
							value={username}
							onChange={(event) => setUsername(event.target.value)}
						/>
					</label>
				</div>

				<div>
					<label>
						Enter Email address:
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

				<div>
					<label>
						Confirm Password:
						<input
							type="text"
							value={passwordConfirm}
							onChange={(event) => setPasswordConfirm(event.target.value)}
						/>
					</label>
				</div>
			</form>
			<button style={{ margin: 5 }} onClick={returnToLogin}>
				return to login
			</button>
			<button style={{ margin: 5 }} onClick={submit}>
				sign up
			</button>
		</div>
	);
}
