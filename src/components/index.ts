/**
 * 组件统一导出 + 副作用导入（触发注册）
 *
 * 导入此文件即可自动注册所有组件到 Component.registry。
 */

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
export { DamageComponent } from "./DamageComponent.js";