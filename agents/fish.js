
const waterLevel = globalThis.config.waterLevel

const fish = {
	fish: {
		species: 'tuna',
	},
	organism: {
		range: [0, waterLevel-1 ],
		searchRadius: 20,
		consumes: 'phytoplankton',
		spawnHints: {
			fish: {
				species: 'tuna',
			},
			volume: {
				geometry: 'cylinder', 
				props: [0.5, 2, 5, 8], 
				material: { color: 'black' },
				pose: { scale: {x:3,y:3,z:3}}
			}			
		}
	},
	volume: {
		geometry: 'cylinder', 
		props: [0.5, 2, 5, 8], 
		material: { color: 'black' },
		pose: { scale: {x:3,y:3,z:3} }
	}
}

export const fish_spawner = {
	uuid: `/agents/fishes`,
	volume: {
		geometry: 'cube',
		material: { color: 'black' },
		pose: { scale: {x:10,y:10,z:10 }}
	},
	emitter: {
		range: [ 0, waterLevel-1 ],
		quantity: 10,
		spawn: fish
	}
}






