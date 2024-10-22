import React from "react";
import useStore from "../store";
import { updateGameStatus } from "../../utils/updateGameStatus";

const ForceStartButton: React.FC = () => {
	const gameId = useStore((state) => state.game?.gameId);
	const handleForceStart = async () => {
		if (gameId) {
			const data = await updateGameStatus({ gameId, status: "ongoing" });
			if (data.success && data.game) {
				useStore.getState().setGame(data.game);
			}
		}
	};

	return (
		<button
			onClick={handleForceStart}
			style={{
				background: "blue",
				color: "white",
				fontFamily: "monospace",
				borderRadius: "5px",
				padding: "10px 15px",
				border: "none",
			}}
		>
			Start Anyway
		</button>
	);
};

export default ForceStartButton;
