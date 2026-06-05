/**
 * 共享类型定义 —— 整个引擎的基础类型契约
 *
 * 命名空间 "th" 保留为游戏主命名空间，所有 thid 前缀不变：
 *   - th:entity=xxx   实体定义
 *   - th:system=xxx   系统注册
 *   - th:texture=xxx  纹理资源
 *   - th:map=xxx      地图定义
 *   - th:hp, th:speed, th:hitbox ...  组件类型
 */

import type * as THREE from 'three';
import { type Game } from './Game';
import { type GameMap } from '@/map';
import { type Entity } from '@/ecs';

// ─── THID ────────────────────────────────────────────

/** 解析后的 thid 结构（thid 命名空间保留为 "th"） */
export interface ParsedTHID {
  namespace: string;
  type: string;
  id: string;
}

// ─── 坐标与向量 ──────────────────────────────────────

/**
 * 游戏内 2D 旋转（x = yaw 水平, y = pitch 垂直）
 * 直接复用 THREE.Vector2 保持兼容
 */
export type GameRotation = THREE.Vector2;

// ─── 组件类型映射 ────────────────────────────────────

/**
 * 组件类型 → 值类型的全局映射（空接口，通过 module augmentation 扩展）。
 *
 * 各组件文件通过 declare module 向此处注入自己的映射项：
 *
 *   declare module '../core/types.js' {
 *     interface ComponentTypeMap {
 *       'th:your_component': YourDataType;
 *     }
 *   }
 *
 * 这样新增组件无需修改本文件，add-on 也能独立注册类型。
 * 所有 key 均使用 "th:" 命名空间前缀。
 */
export interface ComponentTypeMap {}

/** 所有已注册的组件类型字符串（由 ComponentTypeMap 的 key 联合推导） */
export type ComponentType = keyof ComponentTypeMap;

// ─── 配置 ────────────────────────────────────────────

/** 游戏全局配置 */
export interface GameConfigData {
  y_tilt: number;
  object2d_tilt: number;
  tile_tilt: number;
  game_tick_interval: number;
  max_fps: number;
  camera_distance: number;
  camera_follow_speed: number;
  enable_shadows: boolean;
}

// ─── 运行时配置（main.html 中的 GAME_CONFIG）───────

/** 浏览器窗口计算出的运行时配置 */
export interface RuntimeConfig {
  RUN_PATH: string;
  CANVAS_ID: string;
  STAGE_ASPECT: number;
  STAGE_WIDTH: number;
  STAGE_HEIGHT: number;
}

// ─── 系统更新上下文 ──────────────────────────────────

/**
 * System.update() 的上下文参数。
 * 具体类型（Entity, Game, GameMap）在后续阶段定义后自动关联。
 * 当前使用 unknown 占位以避免循环/前向引用。
 */
export interface SystemUpdateContext {
  /** 匹配当前系统的实体集合（由 EntityQuery 提供） */
  entities: Set<Entity>;
  /** 当前逻辑帧号 */
  frame: number;
  /** 游戏实例（访问输入、场景等） */
  game: Game;
  /** 当前所属地图 */
  world: GameMap;
}

// ─── 实体定义 JSON 结构 ──────────────────────────────

/** definitions/entities/*.json 的类型 */
export interface EntityDefinition {
  id: string;
  texture: string;
  module?: string;
  components: Record<string, unknown>;
}

/** definitions/game_maps/*.json 的类型 */
export interface GameMapDefinition {
  id: string;
  type: string;
  data: SplicingBlock[];
  systems: string[];
}

/** 拼接地图的一个块 */
export interface SplicingBlock {
  texture: string;
  position: [number, number];
  size: [number, number];
}

// ─── 碰撞 ────────────────────────────────────────────

export interface CollisionShape {
  shape: 'circle' | 'polygon';
  x: number;
  y: number;
}

export interface CollisionCircle extends CollisionShape {
  shape: 'circle';
  r: number;
}

export interface CollisionPolygon extends CollisionShape {
  shape: 'polygon';
  rotation: number;
  verts: Array<{ x: number; y: number }>;
}

export interface CollisionResult {
  intersects: boolean;
  depth?: number;
  normal?: { x: number; y: number };
  mtv?: { x: number; y: number };
}
