import * as THREE from 'three';


// Simple Perlin noise implementation
class PerlinNoise {
	constructor() {
	this.permutation = [];
	for (let i = 0; i < 256; i++) {
		this.permutation[i] = Math.floor(Math.random() * 256);
	}
	// Extend the permutation to avoid overflow
	this.permutation = this.permutation.concat(this.permutation);
	}

	fade(t) {
	return t * t * t * (t * (t * 6 - 15) + 10);
	}

	lerp(t, a, b) {
	return a + t * (b - a);
	}

	grad(hash, x, y, z) {
	const h = hash & 15;
	const u = h < 8 ? x : y;
	const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
	return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
	}

	noise(x, y, z = 0) {
	const X = Math.floor(x) & 255;
	const Y = Math.floor(y) & 255;
	const Z = Math.floor(z) & 255;

	x -= Math.floor(x);
	y -= Math.floor(y);
	z -= Math.floor(z);

	const u = this.fade(x);
	const v = this.fade(y);
	const w = this.fade(z);

	const A = this.permutation[X] + Y;
	const AA = this.permutation[A] + Z;
	const AB = this.permutation[A + 1] + Z;
	const B = this.permutation[X + 1] + Y;
	const BA = this.permutation[B] + Z;
	const BB = this.permutation[B + 1] + Z;

	return this.lerp(w,
		this.lerp(v,
		this.lerp(u,
			this.grad(this.permutation[AA], x, y, z),
			this.grad(this.permutation[BA], x - 1, y, z)
		),
		this.lerp(u,
			this.grad(this.permutation[AB], x, y - 1, z),
			this.grad(this.permutation[BB], x - 1, y - 1, z)
		)
		),
		this.lerp(v,
		this.lerp(u,
			this.grad(this.permutation[AA + 1], x, y, z - 1),
			this.grad(this.permutation[BA + 1], x - 1, y, z - 1)
		),
		this.lerp(u,
			this.grad(this.permutation[AB + 1], x, y - 1, z - 1),
			this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1)
		)
		)
	);
	}
}

// TerrainComponent handles terrain-specific functionality
class TerrainComponent {

	constructor(terrainSize = 100, terrainResolution = 100, terrainHeightScale = 10) {
		this.width = this.depth = this.TERRAIN_SIZE = terrainSize;
		this.TERRAIN_RESOLUTION = terrainResolution;
		this.TERRAIN_HEIGHT_SCALE = terrainHeightScale;
		this.terrain = null;
		this.terrainData = null;
		
		// Initialize the terrain data
		this.initTerrainData();
	}
	
	// Get terrain height at a specific x,z position
	getTerrainHeightAt(x, z) {
		const gridX = Math.floor((x / this.TERRAIN_SIZE) * this.TERRAIN_RESOLUTION)
		const gridZ = Math.floor((z / this.TERRAIN_SIZE) * this.TERRAIN_RESOLUTION)
		
		// Ensure coordinates are within bounds
		if (gridX >= 0 && gridX <= this.TERRAIN_RESOLUTION && 
			gridZ >= 0 && gridZ <= this.TERRAIN_RESOLUTION) {
			return this.terrainData[gridX][gridZ];
		}
		
		// Return 0 for out of bounds
		return 0;
	}
	
	// Initialize the terrain elevation data
	initTerrainData() {
		// Create Perlin noise generator
		const perlin = new PerlinNoise();
		
		// Create a 2D array to store elevation data
		this.terrainData = new Array(this.TERRAIN_RESOLUTION + 1);
		
		// Fill with Perlin noise values
		for (let i = 0; i <= this.TERRAIN_RESOLUTION; i++) {
			this.terrainData[i] = new Array(this.TERRAIN_RESOLUTION + 1);
			for (let j = 0; j <= this.TERRAIN_RESOLUTION; j++) {
				// Convert grid coordinates to normalized coordinates
				const x = i / this.TERRAIN_RESOLUTION;
				const y = j / this.TERRAIN_RESOLUTION;
				
				// Generate multi-octave noise for more natural terrain
				let elevation = 0;
				let frequency = 5;
				let amplitude = 1;
				const octaves = 4;
				
				for (let k = 0; k < octaves; k++) {
					elevation += perlin.noise(x * frequency, y * frequency) * amplitude;
					amplitude *= 0.5;
					frequency *= 2;
				}
				
				// Normalize and scale the elevation
				elevation = (elevation + 1) / 2; // Normalize to 0-1
				this.terrainData[i][j] = elevation * this.TERRAIN_HEIGHT_SCALE;
			}
		}
	}
	 
	createTerrain() {

		const geometry = new THREE.PlaneGeometry(
			this.TERRAIN_SIZE, 
			this.TERRAIN_SIZE, 
			this.TERRAIN_RESOLUTION, 
			this.TERRAIN_RESOLUTION
		);
		geometry.rotateX(-Math.PI / 2); // Rotate to be horizontal
		
		this.updateTerrainGeometry(geometry);
		
		const material = new THREE.MeshStandardMaterial({
			color: 0x964B00,
			side: THREE.DoubleSide,
			flatShading: true,
			wireframe: false,
			transparent: true,
			opacity: 0.7
		});
		
		this.terrain = new THREE.Mesh(geometry, material);
		this.terrain.receiveShadow = true;

		this.terrain.position.x += this.TERRAIN_SIZE / 2
		this.terrain.position.z += this.TERRAIN_SIZE / 2
			 
		const gridHelper = new THREE.GridHelper(this.TERRAIN_SIZE, 10, 0x555555, 0x555555);
		this.terrain.add(gridHelper);

		return this.terrain
	}
	
	// Update terrain geometry based on elevation data
	updateTerrainGeometry(geometry) {
		const positions = geometry.attributes.position.array;
		
		// Update each vertex position based on terrain data
		for (let i = 0, j = 0; i < positions.length; i += 3, j++) {
			const x = Math.floor(j % (this.TERRAIN_RESOLUTION + 1));
			const z = Math.floor(j / (this.TERRAIN_RESOLUTION + 1));
			
			// Set the y-coordinate (height) from terrain data
			positions[i + 1] = this.terrainData[x][z];
		}
		
		geometry.attributes.position.needsUpdate = true;
		geometry.computeVertexNormals();
	}
}

let t = null

function handler(sys,surface,entity,delta) {
	if(entity.volume.node) return
	const t = new TerrainComponent()
	entity.volume.node = t.createTerrain()
	surface.scene.add(entity.volume.node)
	globalThis.terrain = t
}

const size = globalThis.config.terrainSize

export const entity = {
	uuid: '/agents/terrain-system/001',
	volume: {
		geometry: 'terrain',
		handler,
		size,
		props: [size, size, size - 1, size - 1],
		material: { color: 0x83b6e3, wireframe: false },
	}
}

