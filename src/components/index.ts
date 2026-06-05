/**
 * 组件统一导出 + 副作用导入（触发注册）
 *
 * 导入此文件即可自动注册所有组件到 Component.registry。
 */

// 副作用导入（模块顶层执行 Component.register()）
import './HealthyComponent.js';
import './SpeedComponent.js';
import './HitboxComponent.js';
import './MaxLifeTimeComponent.js';
import './FamilyComponent.js';
import './PlayerControlsComponent.js';
import './BulletComponent.js';

// 类型导出
export { HealthyComponent } from './HealthyComponent.js';
export type { HealthData } from './HealthyComponent.js';
export { SpeedComponent } from './SpeedComponent.js';
export { HitboxComponent } from './HitboxComponent.js';
export type { HitboxData, HitboxCircle, HitboxBox } from './HitboxComponent.js';
export { MaxLifeTimeComponent } from './MaxLifeTimeComponent.js';
export { FamilyComponent } from './FamilyComponent.js';
export { PlayerControlsComponent } from './PlayerControlsComponent.js';
export { BulletComponent } from './BulletComponent.js';
