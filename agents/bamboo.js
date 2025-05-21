
import * as THREE from 'three';

const uuid = 'bamboo-sim/bamboo-system'

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60

let counter = 0

const config = {
	matureTime: 5.0 * SECONDS_PER_YEAR,
	harvestTime: 5.0 * SECONDS_PER_YEAR,
	minClumpSeparation: 10.0,
	maxClumpRadius: 5.0,
	maxClumpCount: 99,
	maxStalkHeight: 30.0,
	minStalkRadius: 0.1,
	maxStalkRadius: 0.2,
	minStalkCount: 30,
	maxStalkCount: 50,
	minStalkSeparation: 0.1,
	co2PerStalk: 0.2, // metric tonnes
	laborPerStalk: 1000, // in a currency of seconds of work value
	revenuePerStalk: 2000, // in a currency of seconds of work value
}

const clumpPrototype = {
	clump: {
		stalks: [],
		harvestedTotal:0,
	},
	volume: {
		invisible: false,
		geometry: 'sphere',
		material: { color: 'blue', opacity:0.5, transparent:true },
		pose: {
			position: {x:0,y:0,z:0},
			scale: {
				x:config.maxClumpRadius,
				y:1,
				z:config.maxClumpRadius
			}
		}
	}
}

const stalkPrototype = {
	uuid: "plant0",
	plant: {
		kind: "giant-bamboo-stalk",
		createdTime: 0,
		ground:0,
		height:0,
		radius:0,
	},
	volume: {
		invisible: false,
		url: 'bamboo10.glb',
		instances: config.maxClumpCount * config.maxStalkCount,
		geometry: 'file',
		//geometry: 'cylinder',
		//props: [.1, .1, 1, 8], 
		//material: { color: 'green' },
		pose: { position: {x:0,y:0,z:0}, scale: {x:1,y:1,z:1} },
	}
}

//
// given a clump, reset all stalks, placement, height
//

function resetStalks(sys,clump,seconds) {

	// if not visible then simply hide
	if(clump.volume.invisible) {
		clump.clump.stalks.forEach(stalk=>{
			stalk.volume.invisible=true
			if(stalk.volume.node)stalk.volume.node.visible=false
		})
		return
	}

	const variability = config.maxStalkCount - config.minStalkCount
	const active = Math.floor( Math.random() * variability ) + config.minStalkCount

	for(let i = 0;i < active; i++) {

		// manufacture if needed
		let stalk
		if(clump.clump.stalks.length<=i) {
			stalk = clump.clump.stalks[i] = structuredClone(stalkPrototype)
			stalk.uuid = clump.uuid+"/stalk-"+(++counter)
		} else {
			stalk = clump.clump.stalks[i]
		}

		// position stalk - @todo revise this approach
		const θ = Math.random() * 2 * Math.PI
		const rr = Math.sqrt(Math.random()) * config.maxClumpRadius
		const x = stalk.volume.pose.position.x = Math.cos(θ) * rr + clump.volume.pose.position.x
		const z = stalk.volume.pose.position.z = Math.sin(θ) * rr + clump.volume.pose.position.z
		const y = stalk.volume.pose.position.y = globalThis.terrain ? globalThis.terrain.getTerrainHeightAt(x,z) : 0
		stalk.ground = y
		stalk.volume.invisible=false
		if(stalk.volume.node)stalk.volume.node.visible=true

		// reset other attributes
		stalk.plant.createdTime = seconds
		stalk.plant.height = 0
		stalk.plant.radius = config.maxStalkRadius

		console.log('placed stalk',stalk.uuid,x,y,z)
		sys(stalk)
	}

	// hide unused
	for(let i = active; i < clump.clump.stalks.length; i++) {
		const stalk = clump.clump.stalks[i]
		stalk.volume.invisible=true
		if(stalk.volume.node)stalk.volume.node.visible=false
		// sys(stalk)
	}
}

function growStalks(sys,seconds,clump) {

	// grow stalks over time
	// @todo detect collisions
	// @todo adjust growth rate so that 100 stalks show up over 5 years
	// @todo the access to elevation could be improved

	const r = config.maxClumpRadius

	// grow each stalk over seconds
	// @todo plant height and growth rate should be variable and a function of environment
	// @todo harvesting should only harvest about 20 percent; meaning there has to be variability in growth rate
	// @todo at harvest time it may make sense to log an event for statistics
	// @todo technically a cut stalk should not regrow - could reduce clump.count
	// @todo plants actually grow to full height quickly and then grow bulk

	for(let i = clump.clump.stalks.length-1; i>=0; i--) {
		const stalk = clump.clump.stalks[i]

		// how old is the stalk?
		const age = seconds - stalk.plant.createdTime

		// estimate height of stalk; this could use variable growth rate
		let t = age / config.matureTime
		if (t < 0) t = 0
		else if (t > 1) t = 1
		const ease = t * t * (3 - 2 * t)
		let height = stalk.plant.height = config.maxStalkHeight * ease
		let radius = config.maxStalkRadius

		// periodically harvest full grown stalks; should be rate limited
		if(age >= config.harvestTime && Math.random()<0.01) {
			//entity.clump.stalks.splice(i, 1) -> would have to publish to sys()
			stalk.plant.createdTime = seconds
			height = stalk.plant.height = 0
			radius = stalk.plant.radius = radius
			clump.clump.harvestedTotal++
		}



		// @todo grow radius and height in a non linear fashion
		// update actual volume pose
		stalk.volume.pose.position.y = stalk.ground
		stalk.volume.pose.scale.x = height
		stalk.volume.pose.scale.y = height
		stalk.volume.pose.scale.z = height

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
		}
	}
	return pts
}

//
// reset all clumps - typically if the configuration changes
//

function remakeClumps(sys,seconds,clumps = null) {
	if(!clumps) clumps = []
	const size = globalThis.config.terrainSize
	const spacing = config.minClumpSeparation
	const positions = generateJitteredGrid(size,size,spacing,config.minClumpSeparation/6.0)
	for(let i = 0; i < positions.length && i < config.maxClumpCount; i++) {
		let clump
		if(clumps.length<=i) {
			clump = clumps[i] = structuredClone(clumpPrototype)
			clump.uuid = "/clump-"+(++counter)
		} else {
			clump = clumps[i]
		}
		const x = clump.volume.pose.position.x = positions[i].x
		const z = clump.volume.pose.position.z = positions[i].z
		const y = clump.volume.pose.position.y = globalThis.terrain ? globalThis.terrain.getTerrainHeightAt(x,z) : 0
		console.log('placed clump',clump.uuid,x,y,z)
	}
	for(let j = 0; j<clumps.length;j++) {
		const clump = clumps[j]
		const visible = j < positions.length ? true : false
		clump.volume.invisible = !visible
		if(clump.volume.node)clump.volume.node.visible = visible
		resetStalks(sys,clump,seconds)
	}
	return clumps
}

//
// treat all of the bamboo clumps as a single system
// update all clumps and all stalks
// easiest to tackle them all together due to field positioning requirements
//

function resolve(blob,sys) {
	if (!blob.time || typeof blob.time !== 'object') return
	const seconds = blob.time.seconds

	// generate or regenerate clump and stalk placement on demand
	if(!this._clumps || !this._clumps.length) {
		this._clumps = remakeClumps(sys,seconds,this._clumps||null)
		sys(this._clumps)
	}

	// grow stalks per clump
	this._clumps.forEach(clump=>{
		growStalks(sys,seconds,clump)
	})

	// statistics logging test
	// log(sys,seconds,this._clumps)
}

export const bamboo_system = {
	uuid,
	resolve,
}

/*
///////////////////////////////////////////////////////////////////
// analytics testbed - paint analytics
// @todo - co2 sequestered should consider maturity of stalk
//				 the simulation itself may wish to do this work?
///////////////////////////////////////////////////////////////////

const records = []

function log(sys,seconds,entities) {

	const clumpsCount      = entities.length
	const stalksCurrent    = entities.reduce((sum, e) => sum + e.clump.stalks.length, 0)
	const stalksHarvested  = entities.reduce((sum, e) => sum + e.clump.harvestedTotal, 0)
	const stalksTotal      = stalksCurrent + stalksHarvested
	const co2Sequestered   = stalksTotal * config.co2PerStalk
	const laborCalories    = stalksHarvested * config.laborPerStalk
	const revenueCalories  = stalksHarvested * config.revenuePerStalk

	const datum = {
		seconds,
		clumpsCount,
		stalksCurrent,
		stalksHarvested,
		stalksTotal,
		co2Sequestered,
		laborCalories,
		revenueCalories
	}

	records.push(datum)

    // draw it
	const node = document.getElementById('stats')
	if(!node) return
    drawOverlayChart(node, records);

}

const secPerYear = 365*24*3600;

const scaleMaxima = {
  clumpsCount:    200,
  stalksCurrent:  1000,
  stalksHarvested:1000,
  stalksTotal:    1000,
  co2Sequestered: 2000,
  laborCalories:  30000,
  revenueCalories:30000
};

function drawOverlayChart(canvas, data) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  // layout
  const pad = { top:40, right:60, bottom:40, left:60 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const maxYears = 20;
  const metrics  = Object.keys(scaleMaxima);
  const colors   = ['#e41a1c','#377eb8','#4daf4a','#984ea3',
                    '#ff7f00','#ffff33','#a65628'];
  const yearTicks = [0,5,10,15,20];

  // filter to 0…20 years
  const filtered = data.filter(d=> d.seconds <= maxYears*secPerYear);
  const xs = filtered.map(d=> d.seconds/secPerYear);

  // axis transforms
  const xToPx = x => pad.left + (x/maxYears)*plotW;
  const yToPxNorm = yn => pad.top + plotH - yn*plotH;

  // draw axes
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // X‐axis
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top+plotH);
  ctx.lineTo(pad.left+plotW, pad.top+plotH);
  ctx.stroke();
  // X ticks
  yearTicks.forEach(y => {
    const px = xToPx(y);
    ctx.beginPath();
    ctx.moveTo(px, pad.top+plotH);
    ctx.lineTo(px, pad.top+plotH+6);
    ctx.stroke();
    ctx.fillText(y+'y', px, pad.top+plotH+18);
  });

  // Y‐axis and ticks at 0%, 50%, 100%
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, pad.top+plotH);
  ctx.stroke();
  ['0%','50%','100%'].forEach((lab, i) => {
    const yn = i/2;        // 0, .5, 1
    const py = yToPxNorm(yn);
    ctx.beginPath();
    ctx.moveTo(pad.left-6, py);
    ctx.lineTo(pad.left, py);
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.fillText(lab, pad.left-10, py);
  });

  // plot each metric normalized
  metrics.forEach((key, mi) => {
    const maxVal = scaleMaxima[key];
    ctx.strokeStyle = colors[mi % colors.length];
    ctx.lineWidth   = 2;
    ctx.beginPath();
    filtered.forEach((d, i) => {
      const px = xToPx(xs[i]);
      let yn = d[key] / maxVal;
      if (yn > 1) yn = 1; // clamp
      const py = yToPxNorm(yn);
      if (i===0) ctx.moveTo(px, py);
      else       ctx.lineTo(px, py);
    });
    ctx.stroke();
  });

}

////////////////////////////////////////////////////////////
// generate a legend if need be - test demo
////////////////////////////////////////////////////////////

const colorArray = [
  '#e41a1c','#377eb8','#4daf4a',
  '#984ea3','#ff7f00','#ffff33','#a65628'
];

function generateLegend(containerId="legend") {
  const container = document.getElementById(containerId);
if(!container) return
  container.innerHTML = ''; // clear any existing
  const metrics = Object.keys(scaleMaxima);
  metrics.forEach((key, i) => {
    const item = document.createElement('div');
    item.className = 'legend-item';

    const swatch = document.createElement('span');
    swatch.className = 'legend-swatch';
    swatch.style.background = colorArray[i % colorArray.length];

    const label = document.createElement('span');
    label.textContent = `${key} (max: ${scaleMaxima[key]})`;

    item.appendChild(swatch);
    item.appendChild(label);
    container.appendChild(item);
  });
}

generateLegend();
*/

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

