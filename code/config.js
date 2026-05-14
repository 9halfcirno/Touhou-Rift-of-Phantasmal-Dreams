let con = {
	"y_tilt": Math.PI / 5,           // y坐标倾斜角度
	"object2d_tilt": Math.PI / 5,    // 2D对象倾斜角度
	"tile_tilt": Math.PI / -2,       // 瓦片倾斜角度（平铺在地面上）

	"game_tick_interval": 1000 / 20, // 游戏逻辑更新间隔，单位毫秒
	"max_fps": 120,

	"camera_distance": 16,           // 相机距离目标的距离
	"camera_follow_speed": 1.5,        // 相机跟随速度，数值越大跟得越紧

	"enable_shadows": false,          // 是否启用阴影
}

export {
	con as Config
}