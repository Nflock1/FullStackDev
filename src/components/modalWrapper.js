import "../App.css";
export default function ModalWrapper(props) {
	return (
		<>
			<div className="darkBG" onClick={() => props.setModalDescription("")} />
			<div className="centered">
				<div className="modal">
					<div>{props.children}</div>
				</div>
			</div>
		</>
	);
}
