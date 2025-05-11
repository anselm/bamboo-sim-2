
function emit(sys,entity) {

	// get emitter component
	const emitter = entity.emitter

	// if the emitter is done then exit
	if(emitter.latched) {
		return
	}

	// maximum to create
	let limit = emitter.quantity || 100

	emitter.latched = true

	// if the emitter does not have a rate then it is a one shot
	if(!emitter.rate) {
		emitter.latched = true
	}

	// otherwise there may still be a ceiling on the total number spawned
	else {
		let candidates = sys.volume.query({filter:emitter.filter})
		limit = emitter.quantity - candidates.length
		if(limit<=0) return
		//console.log(candidates.length,limit,emitter.quantity)
	}

	// a callback that is supplied a location to create a new entity on demand at
	const createEntities = (position,index) => {
		var duplicated = JSON.parse(JSON.stringify(emitter.spawn))

		if(!duplicated.volume.pose) duplicated.volume.pose = {}
		duplicated.volume.pose.position = {
			x: position.x,
			y: position.y,
			z: position.z
		}

		const blob = {
			...duplicated,
			uuid: `${entity.uuid}/${index}`
		}
		sys.resolve(blob)
	}

	// query spatial volume for a collection of valid positions to create entities at and pass these to callback above
	sys.volume.query({
		minElevation:emitter.range[0] || 0,
		maxElevation:emitter.range[1] || Infinity,
		limit,
		callback : createEntities,
	})
}

function resolve(blob,sys) {

	// ignore all events except time events
	if(!blob.time || typeof blob.time !== 'object') return

	// reduce the call frequency - @todo improve
	if(Math.random() > 0.1) return

	// invoke all emitters
	sys.volume.query({filter:{emitter:true},callback:(entity)=>{
		emit(sys,entity)
	}})

}

export const emitter = {
	uuid:'/agents/emitter',
	resolve
}

// @todo revisit emitter concept
// - if i want to only run once then i set a rate of 0
// - if i want to run on ticks then i think i have to scour for emitters


