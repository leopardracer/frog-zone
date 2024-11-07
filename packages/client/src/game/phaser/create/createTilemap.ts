<<<<<<< HEAD
import { awaitTween, createTilemap as createPhaserTilemap } from "@smallbraingames/small-phaser";
import type { Coord, TerrainType } from "../../store";
import config from "./phaserConfig";
=======
import {
	awaitTween,
	createTilemap as createPhaserTilemap,
} from "@smallbraingames/small-phaser";
import type { Coord } from "../../store";
>>>>>>> 3999995 (chore(client): lint)
import useStore from "../../store";
import config from "./phaserConfig";

const createTilemap = (scene: Phaser.Scene) => {
	const {
		tilemap: { tileWidth, tileHeight, gridSize },
		assetKeys: { tileset: tilesetAssetKey },
	} = config;
	const tilemap = createPhaserTilemap(scene, tileWidth, tileHeight, gridSize);

	const tileset = tilemap.addTilesetImage(
		tilesetAssetKey,
		tilesetAssetKey,
		tileWidth,
		tileHeight,
	);
	if (!tileset) {
		throw Error("[createTilemap] tileset is null");
	}
	const startX = -gridSize / 2;
	const startY = startX;
	const layer = tilemap.createBlankLayer(
		tilesetAssetKey,
		tileset,
		startX * tileWidth,
		startY * tileHeight,
		gridSize,
		gridSize,
	);

	if (!layer) {
		throw Error("[createTilemap] layer is null");
	}

	const putTileAt = (tile: number, tileCoord: Coord) => {
		layer.putTileAt(
			tile,
			tileCoord.x + gridSize / 2,
			tileCoord.y + gridSize / 2,
		);
		putHoverTileAt(tileCoord);
	};

	const removeTileAt = (tileCoord: Coord) => {
		layer.removeTileAt(tileCoord.x + gridSize / 2, tileCoord.y + gridSize / 2);
	};

	const getTileAt = (tileCoord: Coord) => {
		return layer.getTileAt(
			tileCoord.x + gridSize / 2,
			tileCoord.y + gridSize / 2,
		);
	};

	// Create a fog map to store the fog overlays for each tile
	const fogMap: { [key: string]: Phaser.GameObjects.Graphics } = {};
	// Create map to store the tiles
	const waterMap: { [key: string]: Phaser.GameObjects.Graphics } = {};
	const grassMap: { [key: string]: Phaser.GameObjects.Graphics } = {};
	const sandMap: { [key: string]: Phaser.GameObjects.Graphics } = {};
	const rockMap: { [key: string]: Phaser.GameObjects.Graphics } = {};
	const iceMap: { [key: string]: Phaser.GameObjects.Graphics } = {};

	// Create a hover map to store the hover tiles
	const hoverMap: { [key: string]: Phaser.GameObjects.Graphics } = {};

	const putHoverTileAt = (tileCoord: Coord) => {
		const tileX = (tileCoord.x + gridSize / 2) * tileWidth + startX * tileWidth;
		const tileY =
			(tileCoord.y + gridSize / 2) * tileHeight + startY * tileHeight;

		const key = `${tileCoord.x},${tileCoord.y}`;
		if (hoverMap[key]) {
			removeHoverTileAt(tileCoord);
		}

		const hoverTile = scene.add.graphics();

		hoverTile.fillStyle(0xeee, 0);
		hoverTile.setDepth(2);
		hoverTile.fillRect(tileX, tileY, tileWidth, tileHeight);
		hoverTile.setInteractive(
			new Phaser.Geom.Rectangle(tileX, tileY, tileWidth, tileHeight),
			Phaser.Geom.Rectangle.Contains,
		);
		hoverTile.on("pointerover", () => {
			useStore.getState().setHoverTile(tileCoord);
		});
		hoverTile.on("pointerout", () => {
			useStore.getState().setHoverTile(null);
		});
		hoverMap[key] = hoverTile;
	};

	const removeHoverTileAt = (tileCoord: Coord) => {
		const key = `${tileCoord.x},${tileCoord.y}`;
		const hoverTile = hoverMap[key];
		if (hoverTile) {
			hoverTile.destroy();
			delete hoverMap[key];
		}
	};

<<<<<<< HEAD
	const putFogAt = (tileCoord: Coord, opacity: number = 0.5) => {
		const tileX =
			(tileCoord.x + gridSize / 2) * tileWidth + startX * tileWidth;
=======
	const putFogAt = (tileCoord: Coord, opacity = 0.7) => {
		const tileX = (tileCoord.x + gridSize / 2) * tileWidth + startX * tileWidth;
>>>>>>> 3999995 (chore(client): lint)
		const tileY =
			(tileCoord.y + gridSize / 2) * tileHeight + startY * tileHeight;

		const key = `${tileCoord.x},${tileCoord.y}`;

		// if fog already exists, update it
		if (fogMap[key]) {
			awaitTween({
				targets: fogMap[key],
				alpha: opacity,
				duration: config.animationDuration,
			});
			return;
		}
		const fogOverlay = scene.add.graphics();
<<<<<<< HEAD
		fogOverlay.fillStyle(0xffffff, 0);
    fogOverlay.setAlpha(0);
=======
		fogOverlay.fillStyle(0xffffff, 1);
		fogOverlay.setAlpha(0);
>>>>>>> 3999995 (chore(client): lint)
		fogOverlay.fillRect(tileX, tileY, tileWidth, tileHeight);
		fogMap[key] = fogOverlay;
		awaitTween({
			targets: fogOverlay,
			alpha: opacity,
			duration: config.animationDuration,
		});
	};

	const removeFogAt = (tileCoord: Coord) => {
		const key = `${tileCoord.x},${tileCoord.y}`;
		const fogOverlay = fogMap[key];
		if (fogOverlay) {
			fogOverlay.destroy(); // Destroy the fog graphics for this tile
			delete fogMap[key]; // Remove the entry from the map
		}
	};

	for (let x = 0; x < gridSize; x++) {
		for (let y = 0; y < gridSize; y++) {
			putTileAt(0, { x, y });
		}
	}

<<<<<<< HEAD
  const terrainTypeToColor = (terrainType: TerrainType): number => {
    if (terrainType === "ICE") return 0xbcd9ee;
    if (terrainType === "WATER") return 0x3fafe4;
    if (terrainType === "SAND") return 0xfff3bf;
    if (terrainType === "ROCK") return 0x7e4328;
    if (terrainType === "GRASS") return 0x68be64;
    return 0xffffff;
  }
=======
	const putLandAt = (tileCoord: Coord) => {
		const tileX = (tileCoord.x + gridSize / 2) * tileWidth + startX * tileWidth;
		const tileY =
			(tileCoord.y + gridSize / 2) * tileHeight + startY * tileHeight;
>>>>>>> 3999995 (chore(client): lint)

	const putTileWithTerrainAt = (tileCoord: Coord, terrainType: TerrainType) => {
  	const tileX =
  		(tileCoord.x + gridSize / 2) * tileWidth + startX * tileWidth;
  	const tileY =
  		(tileCoord.y + gridSize / 2) * tileHeight + startY * tileHeight;

<<<<<<< HEAD
  	const key = `${tileCoord.x},${tileCoord.y}`;
  	const overlay = scene.add.graphics();
    const color = terrainTypeToColor(terrainType);
  	overlay.fillStyle(color, 1);
  	overlay.fillRect(tileX, tileY, tileWidth, tileHeight);
  	overlay.lineStyle(5, 0xffffff, 0.2);
  	overlay.strokeRect(tileX, tileY, tileWidth, tileHeight);
    if (terrainType === "ICE") iceMap[key] = overlay;
    if (terrainType === "WATER") waterMap[key] = overlay;
    if (terrainType === "SAND") sandMap[key] = overlay;
    if (terrainType === "ROCK") rockMap[key] = overlay;
    if (terrainType === "GRASS") grassMap[key] = overlay;
	}
=======
	const putWaterAt = (tileCoord: Coord) => {
		const tileX = (tileCoord.x + gridSize / 2) * tileWidth + startX * tileWidth;
		const tileY =
			(tileCoord.y + gridSize / 2) * tileHeight + startY * tileHeight;

		const key = `${tileCoord.x},${tileCoord.y}`;
		const waterOverlay = scene.add.graphics();
		waterOverlay.fillStyle(0x035797, 1);
		waterOverlay.fillRect(tileX, tileY, tileWidth, tileHeight);
		waterOverlay.lineStyle(5, 0xffffff, 0.2);
		waterOverlay.strokeRect(tileX, tileY, tileWidth, tileHeight);
		waterMap[key] = waterOverlay;
	};

	const putShallowWaterAt = (tileCoord: Coord) => {
		const tileX = (tileCoord.x + gridSize / 2) * tileWidth + startX * tileWidth;
		const tileY =
			(tileCoord.y + gridSize / 2) * tileHeight + startY * tileHeight;

		const key = `${tileCoord.x},${tileCoord.y}`;
		const waterOverlay = scene.add.graphics();
		waterOverlay.fillStyle(0x047dd9, 1);
		waterOverlay.fillRect(tileX, tileY, tileWidth, tileHeight);
		waterOverlay.lineStyle(5, 0xffffff, 0.2);
		waterOverlay.strokeRect(tileX, tileY, tileWidth, tileHeight);
		waterMap[key] = waterOverlay;
	};
>>>>>>> 3999995 (chore(client): lint)

	return {
		tilemap,
		layer,
		putTileAt,
		removeTileAt,
		getTileAt,
		putFogAt,
		removeFogAt,
		putTileWithTerrainAt,
		...config.tilemap,
	};
};

export default createTilemap;
