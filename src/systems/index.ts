/**
 * 系统统一导出 + 副作用导入（触发 System.register()）
 */

import './MovementSystem.js';
import './BulletMovementSystem.js';
import './MaxLifeTimeSystem.js';
import './HealthySystem.js';
import './CollisionSystem.js';
import './PlayerControlsSystem.js';

export { MovementSystem } from './MovementSystem.js';
export { BulletMovementSystem } from './BulletMovementSystem.js';
export { MaxLifeTimeSystem } from './MaxLifeTimeSystem.js';
export { HealthySystem } from './HealthySystem.js';
export { CollisionSystem } from './CollisionSystem.js';
export { PlayerControlsSystem } from './PlayerControlsSystem.js';
