
import * as THREE from 'three';

////////////////////////////////////////////////////////////////////////////


function bambooGenerateGroup(scene,N=200) {

	const cylGeo  = new THREE.CylinderGeometry(1, 1, 1, 8, 1, false);
	const cylMat  = new THREE.MeshBasicMaterial({ color: 0x228B22 });
	const bamboo  = new THREE.InstancedMesh(cylGeo, cylMat, N);
	scene.add(bamboo);

	// — Per‐instance data arrays —
	const posX          = new Float32Array(N);
	const posZ          = new Float32Array(N);
	const targetHeights = new Float32Array(N);
	const currentHeights= new Float32Array(N);
	const radii         = new Float32Array(N);

	// helper object to build matrices
	const tmp = new THREE.Object3D();

	// Growth timing
	const growthDuration = 4.0; // seconds to full height
	const clock = new THREE.Clock();

	// — Initialize each stalk at height ≈ 0 —
	for (let i = 0; i < N; i++) {
		// scatter in XZ
		const a = Math.random() * Math.PI * 2;
		const d = Math.random() * 6;
		posX[i] = Math.cos(a) * d;
		posZ[i] = Math.sin(a) * d;

		// pick a random final height & radius
		targetHeights[i]  = 2 + Math.random() * 6;      // [2–8]
		radii[i]          = 0.05 + Math.random() * 0.1; // [0.05–0.15]
		currentHeights[i] = 0;

		// build the first instance matrix (nearly zero height)
		tmp.position.set(posX[i], 0, posZ[i]);
		tmp.scale.set(radii[i], 0.0001, radii[i]);  // tiny Y so it's not degenerate
		tmp.updateMatrix();
		bamboo.setMatrixAt(i, tmp.matrix);
	}
	bamboo.instanceMatrix.needsUpdate = true;

	const update = () => {

		const dt = clock.getDelta();
		let needUpdate = false;

		for (let i = 0; i < N; i++) {
			if (currentHeights[i] < targetHeights[i]) {
				// grow this stalk
				currentHeights[i] = Math.min(
					targetHeights[i],
					currentHeights[i] + (targetHeights[i] / growthDuration) * dt
				);

				// rebuild its matrix
				const h = currentHeights[i];
				tmp.position.set(posX[i], h * 0.5, posZ[i]);  // lift so base is at y=0
				tmp.scale.set(radii[i], h, radii[i]);
				tmp.updateMatrix();
				bamboo.setMatrixAt(i, tmp.matrix);

				needUpdate = true;
			}
		}

		if (needUpdate) {
			bamboo.instanceMatrix.needsUpdate = true;
		}
	}

	return update
}



////////////////////////////////////////////////////////////////////////////

const xsize = globalThis.config.size
const zsize = globalThis.config.size

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60

const bambooPrototype = {
	uuid: "plant0",
	plant: {
		kind: "giant_bamboo",
		createdTime: 0,
		matureTime: 5.0 * SECONDS_PER_YEAR,
		harvestTime: 5.0 * SECONDS_PER_YEAR,
		maximumHeight: 30.0,
		maximumRadius: 5.0,
		maximumClumpCount: 100,
		minimumStalkSeparation: 0.1,
		minimumClumpSeparation: 30.0, // 10
		parts: [0,0,0,0,0,0,0],
		reset: 0,
	},
	volume: {
		geometry: 'cylinder', 
		props: [.1, .1, 1, 8], 
		material: { color: 'green' },
		pose: { position:{x:0,y:0,z:0}, scale: {x:1,y:1,z:1} }
	}
}

function estimateHeight(seconds, matureTime, maximumHeight) {
	// normalized time, clamped [0..1]
	let t = seconds / matureTime
	if (t < 0) t = 0
	else if (t > 1) t = 1
	// cubic “smoothstep” ease-in-out: f(0)=0, f(1)=1, slopes zero at both ends
	const ease = t * t * (3 - 2 * t)
	return maximumHeight * ease
}

function generateClumpSpacing(n,r,d,maxTries=30) {
	const pts = []
	const d2 = d * d
	for (let i = 0; i < n; i++) {
		let attempt = 0
		let p
		OUTER: while (attempt++ < maxTries) {
			const θ = Math.random() * 2 * Math.PI
			const rr = Math.sqrt(Math.random()) * r
			p = { x: Math.cos(θ) * rr, z: Math.sin(θ) * rr }
			for (const q of pts) {
				const dx = p.x - q.x, dz = p.z - q.z;
				if (dx*dx + dz*dz < d2) continue OUTER
			}
			break
		}
		pts.push(p);
	}
	return pts
}

let counter = 0

function generateClump() {

	const spacing = generateClumpSpacing(
		bambooPrototype.plant.maximumClumpCount,
		bambooPrototype.plant.maximumRadius,
		bambooPrototype.plant.minimumStalkSeparation
		)

	const bamboos = []

	for(let i = 0; i < spacing.length; i++) {
		let copy = structuredClone(bambooPrototype)
		copy.uuid = "bamboo"+counter
		counter++
		copy.volume.pose.position.x = spacing[i].x
		copy.volume.pose.position.y = 0
		copy.volume.pose.position.z = spacing[i].z
		bamboos.push(copy)
	}

	return bamboos
}

function generateJitteredGrid(width, depth, spacing, jitter = 0.1) {
	const pts = [];
	const cols = Math.floor(width  / spacing);
	const rows = Math.floor(depth  / spacing);
	for (let ix = 1; ix <= cols; ix++) {
		for (let iz = 1; iz <= rows; iz++) {
			const x0 = ix * spacing;
			const z0 = iz * spacing;
			const x = x0 + (Math.random() * 2 - 1) * jitter;
			const z = z0 + (Math.random() * 2 - 1) * jitter;
			pts.push({ x, z });
		}
	}
	return pts;
}

function generateClumps(width=100,depth=100) {
	const spacing=bambooPrototype.plant.minimumClumpSeparation
	const points = generateJitteredGrid(width,depth,spacing,0.1)

	const candidates = []
	points.forEach(point => {
		const clump = generateClump()
		clump.forEach(bamboo=>{
			bamboo.volume.pose.position.x += point.x
			bamboo.volume.pose.position.z += point.z

			const x = bamboo.volume.pose.position.x
			const z = bamboo.volume.pose.position.z
			const y = globalThis.terrain ? globalThis.terrain.getTerrainHeightAt(x,z) : 0
			bamboo.volume.pose.position.y = bamboo.volume.ground = y
		})
		candidates.push(...clump)
	})

	return candidates
}

// @todo use a spawner rather than generating one hectare
const bamboos = generateClumps()

function updateOne(entity,time,sys) {

	const age = time - entity.plant.createdTime

	// what is the height?
	const height = estimateHeight(age,entity.plant.matureTime,entity.plant.maximumHeight)

	// periodically harvest
	if(!entity.plant.reset || age >= entity.plant.harvestTime) {
		entity.plant.reset++
		entity.plant.age = time
	}

	// @todo i feel like if i am using a shader that this is probably wrong
	// @todo should be on the ground globalThis.terrain.getTerrainHeightAt

	entity.volume.pose.scale.y = height
	entity.volume.pose.position.y = height / 2 + entity.volume.ground

}

/*
function resolve(blob,sys) {

	if (!blob.time || typeof blob.time !== 'object') return

	// @todo not really the best way
	const volume = sys.volume

	// update all plants
	volume.query({
		filter:{plant:true},
		callback:(entity)=>{
			updateOne(entity,blob.time.seconds,sys)
		}
	})
}
*/

let updater = null

function handler(sys,surface) {
	if(updater) updater()
	else {
		updater = bambooGenerateGroup(surface.scene)
	}
}

/*

to switch to shader

	 const bamboos = generateClumps()




*/

///////////////////////////////////////////////////////////////////////////////


export const bamboo_system = {
	volume: {
		geometry: 'bamboo',
		handler,
	}
}
