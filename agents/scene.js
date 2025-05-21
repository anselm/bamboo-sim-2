
import { configwrapper } from './config.js'
const size = configwrapper.config.sceneSize

export const aaa_scene = {
	uuid:'/agents/scene',
	volume: {
		geometry: 'scene',
		near: 1,
		far: size*4,
		alpha: 1,
		background: 0xffffff
	}
}

export const aab_camera001 = {
	volume: {
		geometry: 'camera',
		cameraMin: 1,
		cameraMax: size*2,
		pose:{
			position:[size/2,size/2,size],
			love:[size/4,0,size/4]
			// @todo may want a smarter center estimation
		}
	}
}


export const pointLight = {
	uuid: '/light/point',
	volume: {
		geometry: 'light',
		light: 'pointLight',
		color: 0xffffff,
		intensity: 1,
		pose: {
			position: { x: size/2 , y: 100, z: size/2 },
			rotation: { x: 0, y: 0, z: 0 },
		},
	},
}

// a general ambient light
export const ambientLight = {
	uuid: '/light/ambient',
	volume: {
		geometry: 'light',
		light: 'ambientLight',
		color: 0xffffff,
		intensity: 0.5,
		pose: {
			position: { x: size/2, y: 0, z: size/2 },
		},
	},
}

