import "../App.css";
import { React, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalWrapper from "../components/modalWrapper";
import axios from "../axios";

let sucessText = "Enter your 2fa code below.";
export default function LoginScreen(props) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [formatError, setFormatError] = useState("");
	const [QR, setQR] = useState(null);
	const [code, setCode] = useState(0);
	const [modal, setModal] = useState("");

	let navigate = useNavigate();

	async function login() {
		let res = await axios.post("/api/2fa_login", { email, password, code }).catch((error) => {
			if (error.code === "ERR_NETWORK") {
				setFormatError(
					"Due to some network error, we are unable to connect you to the server right now. Please ensure the server is running and that your internet connection is stable."
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
			localStorage.setItem("user", JSON.stringify(res.data.user));
			props.setLoggedIn(true);
			// '../' is the route for homepage when logged in
			navigate("../");
		} else if (res.data.error) {
			//server error but it cant be jwt error
			setFormatError(
				`An error occurred while trying to log your account in. Name: ${res.data.errorName}. Code: ${res.data.errorCode}.`
			);
			console.log(res.data.message);
		} else {
			//other reason for route failing
			setFormatError(res.data.message);
		}
	}

	async function submit() {
		//field checking
		if (!email) {
			setFormatError("Email address is a required field to login.");
			return;
		}
		if (!password) {
			setFormatError("Password is a required field to login.");
			return;
		}

		//complete 1st level of authentication and store the QR code
		let response = await axios.post("/api/verify_login", { email, password }).catch((error) => {
			if (error.code === "ERR_NETWORK") {
				setModal(
					"Due to some network error, we are unable to connect you to the server right now. Please ensure the server is running and that your internet connection is stable."
				);
				return;
			}
			setModal(
				`An error has occurred while validating your password. Name: ${error.name}. Code: ${error.code}.`
			);
			console.log(
				`Error when validating provided email and password: Error Name: ${
					error.name
				}. Error Code: ${error.code || "N/A"}. Error Message: ${error.message}`
			);
		});

		//no response
		if (response === undefined) {
			return;
		}
		if (response.status === 200) {
			if (response.data.qr) {
				setQR(response.data.qr);
			}
			setFormatError(sucessText);
		} else {
			//error in server
			if (response.data.error) {
				setFormatError(
					`An error occurred while verifying your password. Name: ${response.data.errorName}. Code: ${response.data.errorCode}.`
				);
				console.log(response.data.message);
			} else {
				//fail for other reason
				setFormatError(response.data.message);
			}
		}
	}

	return (
		<div className="App">
			{formatError ? (
				formatError === sucessText ? (
					<ModalWrapper setModalDescription={setFormatError}>
						<p>{formatError}</p>
						{QR ? <img src={QR} alt="Scannable QR Code" /> : null}
						<form>
							<label>
								code: <input type="text" onChange={(event) => setCode(event.target.value)}></input>
							</label>
						</form>
						<button onClick={login}>submit</button>
					</ModalWrapper>
				) : (
					<ModalWrapper setModalDescription={setFormatError}>
						<p>{formatError}</p>
					</ModalWrapper>
				)
			) : null}
			{modal ? (
				<ModalWrapper setModalDescription={setModal}>
					<p>{modal}</p>
				</ModalWrapper>
			) : null}
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
