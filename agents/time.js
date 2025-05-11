

const time = globalThis.time = {

	seconds: 0,
	hours: 0,
	days: 0,
	months: 0,
	years: 0,

	secondOfDay: 0,
	hourOfDay: 0,
	monthOfYear: 0,
	dayOfYear: 0,

	secondsStepRate: 86400,
	secondsPerHour: 3600,
	secondsPerDay: 86400,
	secondsPerYear: 86400 * 12,
	hoursPerDay: 24,
	daysPerYear: 12,
	daysStepRate: 30,
	morningSeconds: 3600 * 8,
	eveningSeconds: 3600 * 16,
}

const FRAMERATE = 1000/100

async function run(sys) {

	time.seconds += time.secondsStepRate
	time.hours = Math.floor(time.seconds / time.secondsPerHour )
	time.days = Math.floor(time.seconds / time.secondsPerDay )
	time.years = Math.floor(time.seconds / time.secondsPerYear )

	time.secondOfDay = time.seconds % time.secondsPerDay
	time.hourOfDay = time.hours % time.hoursPerDay
	time.dayOfYear = time.days % time.daysPerYear

	const begin = performance.now()
	await sys.resolve({time})
	const duration = performance.now() - begin
	const delay = duration < FRAMERATE ? (FRAMERATE-duration) : 0
	setTimeout( ()=>{
		run(sys)
	} , delay)
}

function resolve(blob,sys) {

	// use a latch so that resolve is run once only; @todo introduce an initialization concept?
	if(time.latch) return
	time.latch = true

	run(sys)
}

export const time_support = {
	uuid:'/agents/time',
	resolve
}




