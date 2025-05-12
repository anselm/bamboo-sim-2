
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
	for(let i = 0; i < entity.clump.stalks.length; i++) {
		const stalk = entity.clump.stalks[i]
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
	entity.volume.node.count = entity.clump.stalks.length
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
		maxStalkRadius: 0.2,
		maxStalkCount: MAX_STALK_COUNT,
		minStalkSeparation: 0.1,
		minClumpSeparation: 10.0,
		co2PerStalk: 0.2, // metric tonnes
		laborPerStalk: 1000, // in a currency of seconds of work value
		revenuePerStalk: 2000, // in a currency of seconds of work value

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
	const seconds = blob.time.seconds

	// once only - initialize the field with bamboo clumps

	if(!this._clumps) {
		const clumps = this._clumps = []
		const size = globalThis.config.terrainSize
		const spacing = stalkPrototype.plant.minClumpSeparation
		const points = generateJitteredGrid(size,size,spacing,0.1)
		points.forEach(point=>{
			const x = point.x
			const z = point.z
			const stalks = []
			const entity = {
				uuid: "/clump-"+(++counter),
				clump: {
					stalks,
					stalksToday:0,
					stalksTotal:0,
					harvestedToday:0,
					harvestedTotal:0,
				},
				volume: {
					geometry: 'bamboo-clump',
					handler: bamboo_clump_renderer,
					props: [.1, .1, 1, 8], 
					material: { color: 'green' },
					pose: { position:{x,y:0,z}, scale: {x:1,y:1,z:1} },
				}
			}
			clumps.push(entity)
		})
		sys(clumps)
	}

	// periodically register new baby bamboo colm stalks with the system over time as they are born
	// @todo detect collisions
	// @todo adjust growth rate so that 100 stalks show up over 5 years
	// @todo the access to elevation could be improved
	// @todo bamboo don't grow in the same spot; or right away - should delete

	const r = stalkPrototype.plant.maxClumpRadius

	this._clumps.forEach(entity=>{
		entity.clump.stalksToday = 0
	})

	this._clumps.forEach(entity=>{
		if( Math.random() > 0.01) return
		if(entity.clump.stalks.length >= MAX_STALK_COUNT) return

		const θ = Math.random() * 2 * Math.PI
		const rr = Math.sqrt(Math.random()) * r
		const x = Math.cos(θ) * rr + entity.volume.pose.position.x
		const z = Math.sin(θ) * rr + entity.volume.pose.position.z
		const y = globalThis.terrain ? globalThis.terrain.getTerrainHeightAt(x,z) : 0

		let entity2 = structuredClone(stalkPrototype)
		entity2.uuid = entity.uuid+"/stalk-"+(++counter)
		entity2.plant.createdTime = seconds
		entity2.plant.height = 0
		entity2.plant.radius = stalkPrototype.plant.maxStalkRadius
		entity2.plant.ground = y
		entity2.volume.pose.position.x = x
		entity2.volume.pose.position.y = y
		entity2.volume.pose.position.z = z
		entity.clump.stalks.push(entity2)

		entity.clump.stalksToday = entity.clump.stalks.length
		entity.clump.stalksTotal++

		// for now don't register individual stalks in system
		// later it makes sense mostly for collision detection
		// these do not have an associated volume renderer
		// sys(entity2)

	})

	// grow each stalk over seconds
	// @todo plant height and growth rate should be variable and a function of environment
	// @todo harvesting should only harvest about 20 percent; meaning there has to be variability in growth rate
	// @todo at harvest time it may make sense to log an event for statistics
	// @todo technically a cut stalk should not regrow - could reduce clump.count
	// @todo plants actually grow to full height quickly and then grow bulk

	this._clumps.forEach(entity=>{

		entity.clump.harvestedToday = 0

		for(let i = entity.clump.stalks.length-1; i>=0; i--) {
			const entity2 = entity.clump.stalks[i]

			// how old is the stalk?
			const age = seconds - entity2.plant.createdTime

			// estimate height of stalk; this could use variable growth rate
			let t = age / entity2.plant.matureTime
			if (t < 0) t = 0
			else if (t > 1) t = 1
			const ease = t * t * (3 - 2 * t)
			let height = entity2.plant.height = entity2.plant.maxHeight * ease

			// periodically harvest full grown stalks; should be rate limited
			if(age >= entity2.plant.harvestTime && Math.random()<0.1) {
				entity.clump.stalks.splice(i, 1)
				entity.clump.harvestedToday++
				entity.clump.harvestedTotal++
			}
		}
	})

	// statistics logging

	logStats(seconds,this._clumps)
}

export const bamboo_system = {
	uuid,
	resolve,
}

///////////////////////////////////////////////////////////////////
// analytics
// @todo - co2 sequestered should consider maturity of stalk

const records = []

function logStats(seconds,entities) {

	const clumpsCount      = entities.length
	const stalksCurrent    = entities.reduce((sum, e) => sum + e.clump.stalks.length, 0)
	const stalksHarvested  = entities.reduce((sum, e) => sum + e.clump.harvestedTotal, 0)
	const stalksTotal      = stalksCurrent + stalksHarvested
	const co2Sequestered   = stalksTotal * stalkPrototype.plant.co2PerStalk
	const laborCalories    = stalksHarvested * stalkPrototype.plant.laborPerStalk
	const revenueCalories  = stalksHarvested * stalkPrototype.plant.revenuePerStalk

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
    drawOverlayChart(document.getElementById('stats'), records);

}

const secPerYear = 365*24*3600;


/*
for (let d=0; d<=365*20; d+=30) {
  records.push({
    seconds: d*24*3600,
    clumpsCount:    3 + Math.sin(d/200)*0.3,
    stalksCurrent:  50 + d/10,
    stalksHarvested: Math.max(0, Math.sin(d/180)*20),
    stalksTotal:    70 + d/8,
    co2Sequestered: (70 + d/8) * 0.02,
    laborCalories:  Math.max(0, Math.sin(d/180)*20) * 2,
    revenueCalories: Math.max(0, Math.sin(d/180)*20) * 10
  });
}
*/



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


    ////////////////////////////////

  const colorArray = [
    '#e41a1c','#377eb8','#4daf4a',
    '#984ea3','#ff7f00','#ffff33','#a65628'
  ];

  function generateLegend(containerId="legend") {
    const container = document.getElementById(containerId);
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

