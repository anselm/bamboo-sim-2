
import * as THREE from 'three';

const uuid = 'bamboo-sim/bamboo-system'
let DEBUG_LIMIT_CLUMPS = false
let MAX_STALK_COUNT = 100
let counter = 0

////////////////////////////////////////////////////////////////////////////

//
// the data flow architecture of orbital is intended to separate data from views
// this is a view generator that paints bamboo clumps
// if the bamboo clump does not have an associated visualization then it is generated
// otherwise the visualization is updated to match the data
//

function bamboo_clump_renderer(sys,surface,entity,delta) {

	// initialize?
	let bamboo = entity.volume.node
	if(!bamboo) {
		const c  = new THREE.CylinderGeometry(1, 1, 1, 8, 1, false)
		const m  = new THREE.MeshBasicMaterial({ color: 0x228B22 })
		bamboo = entity.volume.node = new THREE.InstancedMesh(c, m, MAX_STALK_COUNT)
		surface.scene.add(bamboo)
	}

	// update

	const matrix = new THREE.Matrix4()
	for(let i = 0; i < entity._stalks.length; i++) {
		const stalk = entity._stalks[i]
		const h = stalk.plant.height
		const r = stalk.plant.radius
		const x = stalk.volume.pose.position.x
		const y = stalk.volume.pose.position.y + h*0.5
		const z = stalk.volume.pose.position.z
		matrix.set(
			r, 0, 0, x,
			0, h, 0, y,
			0, 0, r, z,
			0, 0, 0, 1
		);
		bamboo.setMatrixAt(i,matrix)
	}
	entity.volume.node.count = entity._stalks.length
	bamboo.instanceMatrix.needsUpdate = true
}



////////////////////////////////////////////////////////////////////////////


/* test code to avoid overlaps - replace

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

*/

///////////////////////////////////////////////////////////////////////////////

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60

const stalkPrototype = {
	uuid: "plant0",
	plant: {
		kind: "giant-bamboo-stalk",
		matureTime: 5.0 * SECONDS_PER_YEAR,
		harvestTime: 5.0 * SECONDS_PER_YEAR,
		maxHeight: 30.0,
		maxClumpRadius: 5.0,
		maxStalkRadius: 0.1,
		maxStalkCount: MAX_STALK_COUNT,
		minStalkSeparation: 0.1,
		minClumpSeparation: 10.0,
		createdTime: 0,
		ground:0,
		height:0,
	},
	volume: {
		geometry: 'bamboo-stalk',
		props: [.1, .1, 1, 8], 
		material: { color: 'green' },
		pose: { position:{x:0,y:0,z:0}, scale: {x:1,y:1,z:1} }
	}
}

function generateJitteredGrid(width, depth, spacing, jitter = 0.1) {
	const pts = [];
	const cols = Math.floor(width  / spacing);
	const rows = Math.floor(depth  / spacing);
	for (let ix = 1; ix < cols; ix++) {
		for (let iz = 1; iz < rows; iz++) {
			const x0 = ix * spacing;
			const z0 = iz * spacing;
			const x = x0 + (Math.random() * 2 - 1) * jitter;
			const z = z0 + (Math.random() * 2 - 1) * jitter;
			pts.push({ x, z });
			if(DEBUG_LIMIT_CLUMPS)return pts
		}
	}
	return pts;
}

//
// treat all of the bamboo clumps as a single system
// update all clumps and all stalks
// easiest to tackle them all together due to field positioning requirements
//

function resolve(blob,sys) {
	if (!blob.time || typeof blob.time !== 'object') return
	const time = blob.time.seconds

	// once only - initialize the field with bamboo clumps

	if(!this._clumps) {
		const clumps = this._clumps = []
		const size = globalThis.config.terrainSize
		const spacing = stalkPrototype.plant.minClumpSeparation
		const points = generateJitteredGrid(size,size,spacing,0.1)
		points.forEach(point=>{
			const x = point.x
			const z = point.z
			const _stalks = []
			const clump = {
				uuid: "/clump-"+(++counter),
				_stalks,
				volume: {
					geometry: 'bamboo-clump',
					handler: bamboo_clump_renderer,
					props: [.1, .1, 1, 8], 
					material: { color: 'green' },
					pose: { position:{x,y:0,z}, scale: {x:1,y:1,z:1} },
					_stalks,
				}
			}
			clumps.push(clump)
		})
		sys(clumps)
	}

	// periodically register new baby bamboo colm stalks with the system over time as they are born
	// @todo detect collisions
	// @todo adjust growth rate so that 100 stalks show up over 5 years
	// @todo the access to elevation could be improved

	const r = stalkPrototype.plant.maxClumpRadius

	this._clumps.forEach(clump=>{
		if( Math.random() > 0.01) return
		if(clump._stalks.length >= MAX_STALK_COUNT) return

		const θ = Math.random() * 2 * Math.PI
		const rr = Math.sqrt(Math.random()) * r
		const x = Math.cos(θ) * rr + clump.volume.pose.position.x
		const z = Math.sin(θ) * rr + clump.volume.pose.position.z
		const y = globalThis.terrain ? globalThis.terrain.getTerrainHeightAt(x,z) : 0

		let entity = structuredClone(stalkPrototype)
		entity.uuid = clump.uuid+"/stalk-"+(++counter)
		entity.plant.createdTime = time
		entity.plant.height = 0
		entity.plant.radius = stalkPrototype.plant.maxStalkRadius
		entity.plant.ground = y
		entity.volume.pose.position.x = x
		entity.volume.pose.position.y = y
		entity.volume.pose.position.z = z

		//console.log(entity.uuid,y)

		//entity.volume.handler = handler
		entity.plant.clump = clump

		clump._stalks.push(entity)

		// for now don't register in system
		// later it makes sense mostly for collision detection
		// these do not have an associated volume renderer
		// sys(stalk)

	})

	// grow each stalk over time
	// @todo plant height and growth rate should be variable and a function of environment
	// @todo harvesting should only harvest about 20 percent; meaning there has to be variability in growth rate
	// @todo at harvest time it may make sense to log an event for statistics
	// @todo technically a cut stalk should not regrow - could reduce clump.count
	// @todo plants actually grow to full height quickly and then grow bulk

	this._clumps.forEach(clump=>{
		clump._stalks.forEach(entity=>{

			// how old is the stalk?
			const age = time - entity.plant.createdTime

			// estimate height of stalk; this could use variable growth rate
			let t = age / entity.plant.matureTime
			if (t < 0) t = 0
			else if (t > 1) t = 1
			const ease = t * t * (3 - 2 * t)
			let height = entity.plant.maxHeight * ease

			// periodically harvest full grown stalks; should be rate limited
			if(age >= entity.plant.harvestTime) {
				if(Math.random()<0.1)
//				if(height >= entity.plant.maxHeight * 0.9)
				{
					entity.plant.createdTime = time
					height = 0
				}
			}

			// set height - used later by renderer
			entity.plant.height = height
		})
	})

}

export const bamboo_system = {
	uuid,
	resolve,
}
