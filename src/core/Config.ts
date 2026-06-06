import type { GameConfigData } from './types.js';

/**
 * 游戏全局配置
 *
 * 迁移自 code/config.js，命名空间 "th" 保留，
 * thid 格式：th:xxx=yyy
 */
const Config: GameConfigData = {
  /** y 坐标倾斜角度 */
  y_tilt: Math.PI / 5,

  /** 2D 对象倾斜角度 */
  object2d_tilt: Math.PI / 5,

  /** 瓦片倾斜角度（平铺在地面上） */
  tile_tilt: Math.PI / -2,

  /** 游戏逻辑更新间隔，单位毫秒（25Hz） */
  game_tick_interval: 1000 / 25,

  /** 最大帧率，0 = 不限制 */
  max_fps: 0,

  /** 游戏长宽比 */
  game_aspect: 16 / 9,

  /** 相机距离目标的距离 */
  camera_distance: 16,

  /** 相机跟随速度，数值越大跟得越紧 */
  camera_follow_speed: 2,

  /** 是否启用阴影 */
  enable_shadows: true,
};

export { Config };
export type { GameConfigData };
