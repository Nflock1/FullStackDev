import "../App.css";
import { React, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalWrapper from "../components/modalWrapper";
import axios from "../axios";

export default function SignUpScreen(props) {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const [ModalDescription, setModalDescription] = useState("");
	const [QR, setQR] = useState(null);
	const [code, setCode] = useState(0);
	const [modal, setModal] = useState("");
	let navigate = useNavigate();

	async function login() {
		let res = await axios.post("/api/2fa_login", { email, password, code }).catch((error) => {
			if (error.code === "ERR_NETWORK") {
				setModalDescription(
					"Due to some network error, we are unable to connect you to the server right now. Please ensure the server is running and that your internet connection is stable. Refreshing the page may also help."
				);
				return;
			}
			setModal(
				`An error has occurred while processing your 2fa login. Name: ${error.name}. Code: ${error.code}.`
			);
			console.log(
				`Error when processing 2nd layer of authentication: Error Name: ${
					error.name
				}. Error Code: ${error.code || "N/A"}. Error Message: ${error.message}`
			);
		});
		if (res.status === 200) {
			props.setLoggedIn(true);
			returnToLogin();
			localStorage.setItem("user", JSON.stringify(res.data.user));
		} else if (res.data.error) {
			setModal(
				`An error has occurred while processing your 2fa login. Name: ${res.data.errorName}. Code: ${res.data.errorCode}.`
			);
			console.log(res.data.message);
		} else {
			//api responses are user friendly enough for this
			setModal(res.data.message);
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
		} else if (!email.includes("@") || !email.includes(".")) {
			setModalDescription("Please provide a valid email address.");
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
			.post("/api/signUp", {
				username: username,
				email: email,
				password: password,
			})
			.catch((error) => {
				if (error.code === "ERR_NETWORK") {
					setModalDescription(
						"Due to some network error, we are unable to connect you to the server right now. Please ensure the server is running and that your internet connection is stable. Refreshing the page may also help."
					);
					return;
				}
				//so that unexpected errors are still provided in a useful way
				setModalDescription(
					`An error occurred while attempting to sign you up. Error Name: ${error.name}. Error Code: ${error.code}`
				);
				console.log(
					`Error when processing 2nd layer of authentication: Error Name: ${
						error.name
					}. Error Code: ${error.code || "N/A"}. Error Message: ${error.message}`
				);
			});
		if (ModalDescription !== "") {
			//if an error occurs, this should run no further
			return;
		}
		if (res.status === 200) {
			//correct password has been entered at this point (new account), now we do 2nd factor
			setQR(res.data.qr);
			setModalDescription("enter code:  ");
		} else {
			let condText = "";
			if (res.data.errorName === "Duplicate Account") {
				condText =
					" Please login to the account associated with the email you provided or select a new username and email.";
			}
			setModal(res.data.message + condText);
		}
	}

	function returnToLogin() {
		navigate("../");
	}

	return (
		<div className="App">
			{!ModalDescription ? null : QR ? ( //QR code popup
				<ModalWrapper setModalDescription={setModalDescription}>
					<h3>
						Your account has been sucessfully created. To finish logging in, you must setup 2fa by
						scanning the QR code below with a 2fa compatible app like Google Authenticator, Duo
						mobile, etc.
					</h3>
					<img src={QR} alt="Scannable QR Code" />
					<form>
						<div>
							<label>
								{ModalDescription}
								<input type="text" onChange={(event) => setCode(event.target.value)} />
							</label>
						</div>
					</form>
					<button onClick={login}>submit</button>
				</ModalWrapper>
			) : (
				//there is some modal to be rendered, but it is not sucessful
				<ModalWrapper setModalDescription={setModalDescription}>
					<p>{ModalDescription}</p>
				</ModalWrapper>
			)}

			{modal ? (
				<ModalWrapper setModalDescription={setModal}>
					<p>{modal}</p>
				</ModalWrapper>
			) : null}
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
