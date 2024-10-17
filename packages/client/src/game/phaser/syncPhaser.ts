import { coordToKey, getCenterPixelCoord } from "@smallbraingames/small-phaser";
import { debounceTime } from "rxjs";
import { completedMoveAnimation } from "../../utils/animations";
import { getPlayerId } from "../../utils/getPlayerId";
import { type Api, Direction } from "../createApi";
import type { PhaserGame } from "../phaser/create/createPhaserGame";
import type { Coord, TileWithCoord } from "../store";
import useStore, { NEXT_MOVE_TIME_MILLIS } from "../store";
import { PLAYER_CONFIG } from "./../../../player.config";
import phaserConfig from "./create/phaserConfig";
import { getSurroundingCoordinates } from "../../utils/getSurroundingCoordinates";
import { createTileFetcher } from "./create/createTileFetcher";

const initializeGrid = (size: number) => {
	const grid = new Map();
	for (let x = 0; x < size; x++) {
		for (let y = 0; y < size; y++) {
			const coordKey = coordToKey({ x, y });
			grid.set(coordKey, {
				coord: { x, y },
				entity_type: { val: "None" },
				fetchedAt: 0,
				isShown: false,
			});
		}
	}
	return grid;
};

// Pure fn to update the grid with the new visible tiles
const getUpdatedGrid = ({
	grid,
	viewportCoords,
	newTiles,
}: {
	grid: Map<number, TileWithCoord>;
	viewportCoords: Coord[];
	newTiles: TileWithCoord[];
}) => {
	const newGrid = new Map(grid);

	// Reset all tiles to unseen for now
	newGrid.forEach((value, key) => {
		newGrid.set(key, {
			...value,
			isShown: false, // Set isShown to false for all tiles
		});
	});
	// set all the view port tiles to shown
	viewportCoords.forEach((coord) => {
		const coordKey = coordToKey(coord);
		if (newGrid.has(coordKey)) {
			newGrid.set(coordKey, {
				...newGrid.get(coordKey),
				isShown: true,
			});
		}
	});

	newTiles.forEach((tile) => {
		const coordKey = coordToKey(tile.coord);

		// Update the grid with the newly fetched tile value (overrides the isShown: false set above)
		if (newGrid.has(coordKey)) {
			newGrid.set(coordKey, {
				...tile,
				isShown: true,
			});
		}
	});

	return newGrid;
};

const syncPhaser = async (game: PhaserGame, api: Api) => {
	const players = new Map<number, Phaser.GameObjects.Image>();
	const items = new Map<number, Phaser.GameObjects.Image>();
	const selectedPlayerId = Number(getPlayerId());
	// TODO: look into why the actual rendered grid by phase is 32 when config is 64
	let grid = initializeGrid(32);
	const initialViewportCoords = getSurroundingCoordinates(
		PLAYER_CONFIG[selectedPlayerId],
	);
	let moveMarker: Phaser.GameObjects.Image | null = null;

	const drawTiles = ({
		tiles,
		viewportCoords,
	}: {
		tiles: TileWithCoord[];
		viewportCoords: Coord[];
	}) => {
		grid = getUpdatedGrid({
			grid,
			viewportCoords,
			newTiles: tiles,
		});

		console.log("GRID", grid);

		grid.forEach((tile) => {
			if (tile.isShown) {
				game.tilemap.removeFogAt(tile.coord);
				if (!tile.fetchedAt) {
					game.tilemap.putFogAt(tile.coord, 0.3);
				}
				// if the tile was last fetched more than 3 seconds ago
				if (tile.fetchedAt && tile.fetchedAt < Date.now() - 2500) {
					game.tilemap.putFogAt(tile.coord, 0.1);
				}
			} else {
				game.tilemap.putFogAt(tile.coord);
			}
			if (tile.entity_type.val && tile.entity_id?.val !== undefined) {
				if (tile.entity_type.val === "Item") {
					const itemGameObject = addItem(tile.coord);
					items.set(tile.entity_id.val, itemGameObject);
				}
				if (tile.entity_type.val === "Player") {
					const id = tile.entity_id.val;
					const playerImg = players.get(id);
					if (playerImg) {
						playerImg.destroy();
					}
					const playerGameObject = addPlayer({
						playerId: id,
						coord: tile.coord,
					});
					players.set(id, playerGameObject);
					useStore.getState().addPlayer({
						id,
						hp: tile.hp.val,
						atk: tile.atk.val,
						coord: tile.coord,
					});
				}
				if (tile.entity_type.val === "None") {
					// remove image at coord
					const id = coordToKey(tile.coord);
					const image = players.get(id) || items.get(id);
					if (image) {
						image.destroy();
					}
				}
			}
		});
	};

	const tileFetcher = createTileFetcher({
		initialCoordinates: initialViewportCoords,
		batchSize: 5,
		playerId: selectedPlayerId,
		onSuccessfulFetch: drawTiles,
	});

	const addPlayer = ({
		coord,
	}: {
		playerId: number;
		coord: Coord;
	}): Phaser.GameObjects.Image => {
		const pixelCoord = getCenterPixelCoord(
			coord,
			phaserConfig.tilemap.tileWidth,
			phaserConfig.tilemap.tileHeight,
		);
		const go = game.mainScene.add.image(
			pixelCoord.x,
			pixelCoord.y,
			phaserConfig.assetKeys.frog,
		);
		go.setSize(
			phaserConfig.tilemap.tileWidth,
			phaserConfig.tilemap.tileHeight,
		);
		go.setDisplaySize(
			phaserConfig.tilemap.tileWidth,
			phaserConfig.tilemap.tileHeight,
		);
		go.setDepth(1);
		// if (selectedPlayerId === playerId) {
		// 	// Define the triangle's points
		// 	const triangleSize = 10; // Adjust this size as needed
		// 	const triangleX = go.x;
		// 	const triangleY = 25; // Position above the image

		// 	// Add the triangle above the image
		// 	const triangle = game.mainScene.add.triangle(
		// 		triangleX,
		// 		triangleY,
		// 		0,
		// 		triangleSize, // Point 1 (top)
		// 		-triangleSize,
		// 		-triangleSize, // Point 2 (bottom left)
		// 		triangleSize,
		// 		-triangleSize, // Point 3 (bottom right)
		// 		0xffd700, // Yellow color in hex
		// 	);

		// 	// Set the origin to center the triangle
		// 	triangle.setDepth(2);
		// 	triangle.setOrigin(0.5, 0.5);
		// }
		return go;
	};

	const handleMovePlayer = async (direction: Direction) => {
		const selectedPlayer = players.get(selectedPlayerId);
		if (!selectedPlayer) return;
		// record a move was made
		useStore.getState().setLastMoveTimeStamp(Date.now());
		// stop the fetcher so we can show the pending move
		tileFetcher.stop();

		const tileWidth = phaserConfig.tilemap.tileWidth;
		const tileHeight = phaserConfig.tilemap.tileHeight;

		let newX = selectedPlayer.x;
		let newY = selectedPlayer.y;

		switch (direction) {
			case Direction.LEFT:
				newX -= tileWidth;
				break;
			case Direction.RIGHT:
				newX += tileWidth;
				break;
			case Direction.UP:
				newY -= tileHeight;
				break;
			case Direction.DOWN:
				newY += tileHeight;
				break;
		}

		// Add the marker at the new position
		const nextMoveMarker = game.mainScene.add.image(
			newX,
			newY,
			phaserConfig.assetKeys.arrow,
		);
		nextMoveMarker.setSize(tileWidth, tileHeight);
		nextMoveMarker.setDisplaySize(tileWidth * 0.7, tileHeight * 0.7);
		nextMoveMarker.setDepth(0);

		const rotation = {
			[Direction.LEFT]: Math.PI,
			[Direction.RIGHT]: 0,
			[Direction.UP]: (3 * Math.PI) / 2,
			[Direction.DOWN]: Math.PI / 2,
		};

		nextMoveMarker.setRotation(rotation[direction]);
		moveMarker = nextMoveMarker;

		const moveResponse = await api.move(selectedPlayerId, direction);
		if (moveResponse?.my_new_coords) {
			const newCoord = {
				x: moveResponse.my_new_coords.x.val,
				y: moveResponse.my_new_coords.y.val,
			};
			const newViewportCoords = getSurroundingCoordinates(newCoord);

			if (selectedPlayer) {
				const pixelCoord = getCenterPixelCoord(
					newCoord,
					phaserConfig.tilemap.tileWidth,
					phaserConfig.tilemap.tileHeight,
				);
				const x = pixelCoord.x;
				const y = pixelCoord.y;
				game.mainScene.tweens.add({
					targets: selectedPlayer,
					x,
					y,
					duration: 200,
					ease: "Power2",
					onComplete: () => {
						game.mainScene.cameras.main.centerOn(x, y);
						completedMoveAnimation(selectedPlayer);
						if (moveMarker) {
							moveMarker.destroy();
							moveMarker = null;
						}
						tileFetcher.updateCoordinates(newViewportCoords);
					},
				});
			}
		}
	};

	const addItem = (coord: Coord): Phaser.GameObjects.Image => {
		const pixelCoord = getCenterPixelCoord(
			coord,
			phaserConfig.tilemap.tileWidth,
			phaserConfig.tilemap.tileHeight,
		);
		const go = game.mainScene.add.image(
			pixelCoord.x,
			pixelCoord.y,
			phaserConfig.assetKeys.item,
		);
		go.setSize(
			phaserConfig.tilemap.tileWidth,
			phaserConfig.tilemap.tileHeight,
		);
		go.setDisplaySize(
			phaserConfig.tilemap.tileWidth,
			phaserConfig.tilemap.tileHeight,
		);
		return go;
	};

	tileFetcher.start();

	game.input.keyboard$.subscribe(async (key) => {
		const lastMoveTime = useStore.getState().lastMoveTimeStamp;
		const now = Date.now();
		const canMove =
			!lastMoveTime || now - lastMoveTime >= NEXT_MOVE_TIME_MILLIS;
		if (!canMove) {
			return;
		}
		if (key.keyCode === Phaser.Input.Keyboard.KeyCodes.LEFT) {
			handleMovePlayer(Direction.LEFT);
		} else if (key.keyCode === Phaser.Input.Keyboard.KeyCodes.RIGHT) {
			handleMovePlayer(Direction.RIGHT);
		} else if (key.keyCode === Phaser.Input.Keyboard.KeyCodes.UP) {
			handleMovePlayer(Direction.UP);
		} else if (key.keyCode === Phaser.Input.Keyboard.KeyCodes.DOWN) {
			handleMovePlayer(Direction.DOWN);
		}
	});
};

export default syncPhaser;
