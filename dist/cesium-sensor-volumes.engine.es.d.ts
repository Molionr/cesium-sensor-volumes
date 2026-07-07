// Type definitions for cesium-sensor-volumes
// A Cesium plugin for visualizing sensor volumes.
// Project: https://github.com/Flowm/cesium-sensor-volumes

import {
	Color,
	Event,
	JulianDate,
	Material,
	MaterialProperty,
	Matrix4,
	Property,
	Scene,
	EntityCollection,
	Spherical
} from '@cesium/engine';

/**
 * Cesium frame state passed to primitive `update` calls.
 * Cesium does not publicly export this type, so it is typed loosely here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FrameState = any;

/**
 * Options accepted by {@link ConicSensorGraphics}.
 */
export interface ConicSensorGraphicsOptions {
	show?: Property | boolean;
	innerHalfAngle?: Property | number;
	outerHalfAngle?: Property | number;
	minimumClockAngle?: Property | number;
	maximumClockAngle?: Property | number;
	radius?: Property | number;
	showIntersection?: Property | boolean;
	intersectionColor?: Property | Color;
	intersectionWidth?: Property | number;
	lateralSurfaceMaterial?: MaterialProperty;
}

/**
 * An optionally time-dynamic cone.
 */
export class ConicSensorGraphics {
	constructor(options?: ConicSensorGraphicsOptions);

	/** Gets the event that is raised whenever a new property is assigned. */
	readonly definitionChanged: Event;

	/** The cone's minimum clock angle. */
	minimumClockAngle: Property | undefined;
	/** The cone's maximum clock angle. */
	maximumClockAngle: Property | undefined;
	/** The cone's inner half-angle. */
	innerHalfAngle: Property | undefined;
	/** The cone's outer half-angle. */
	outerHalfAngle: Property | undefined;
	/** The cone's surface appearance. */
	lateralSurfaceMaterial: MaterialProperty | undefined;
	/** Color of the intersection line with the globe. */
	intersectionColor: Property | undefined;
	/** Width of the intersection line with the globe. */
	intersectionWidth: Property | undefined;
	/** Whether to show the intersection line. */
	showIntersection: Property | undefined;
	/** Radius of the cone's projection. */
	radius: Property | undefined;
	/** Whether the cone is visible. */
	show: Property | undefined;

	/** Duplicates this instance. */
	clone(result?: ConicSensorGraphics): ConicSensorGraphics;

	/** Assigns each unassigned property from the source. */
	merge(source: ConicSensorGraphics): void;
}

/**
 * Options accepted by {@link CustomPatternSensorGraphics}.
 */
export interface CustomPatternSensorGraphicsOptions {
	show?: Property | boolean;
	directions?: Property | Spherical[];
	radius?: Property | number;
	showIntersection?: Property | boolean;
	intersectionColor?: Property | Color;
	intersectionWidth?: Property | number;
	lateralSurfaceMaterial?: MaterialProperty;
}

/**
 * An optionally time-dynamic custom patterned sensor.
 */
export class CustomPatternSensorGraphics {
	constructor(options?: CustomPatternSensorGraphicsOptions);

	readonly definitionChanged: Event;

	/** Array of Spherical instances representing the sensor's projection. */
	directions: Property | undefined;
	lateralSurfaceMaterial: MaterialProperty | undefined;
	intersectionColor: Property | undefined;
	intersectionWidth: Property | undefined;
	showIntersection: Property | undefined;
	radius: Property | undefined;
	show: Property | undefined;

	clone(result?: CustomPatternSensorGraphics): CustomPatternSensorGraphics;
	merge(source: CustomPatternSensorGraphics): void;
}

/**
 * Options accepted by {@link RectangularSensorGraphics}.
 */
export interface RectangularSensorGraphicsOptions {
	show?: Property | boolean;
	xHalfAngle?: Property | number;
	yHalfAngle?: Property | number;
	radius?: Property | number;
	showIntersection?: Property | boolean;
	intersectionColor?: Property | Color;
	intersectionWidth?: Property | number;
	lateralSurfaceMaterial?: MaterialProperty;
}

/**
 * An optionally time-dynamic rectangular pyramid sensor.
 */
export class RectangularSensorGraphics {
	constructor();

	readonly definitionChanged: Event;

	xHalfAngle: Property | undefined;
	yHalfAngle: Property | undefined;
	lateralSurfaceMaterial: Property | undefined;
	intersectionColor: Property | undefined;
	intersectionWidth: Property | undefined;
	showIntersection: Property | undefined;
	radius: Property | undefined;
	show: Property | undefined;

	clone(result?: RectangularSensorGraphics): RectangularSensorGraphics;
	merge(source: RectangularSensorGraphics): void;
}

/**
 * Options accepted by {@link SarSensorGraphics}.
 */
export interface SarSensorGraphicsOptions {
	show?: Property | boolean;
	minimumElevationAngle?: Property | number;
	maximumElevationAngle?: Property | number;
	forwardExclusionAngle?: Property | number;
	aftExclusionAngle?: Property | number;
	altitude?: Property | number;
	radius?: Property | number;
	showIntersection?: Property | boolean;
	intersectionColor?: Property | Color;
	intersectionWidth?: Property | number;
	lateralSurfaceMaterial?: MaterialProperty;
}

/**
 * An optionally time-dynamic SAR sensor.
 */
export class SarSensorGraphics {
	constructor(options?: SarSensorGraphicsOptions);

	readonly definitionChanged: Event;

	minimumElevationAngle: Property | undefined;
	maximumElevationAngle: Property | undefined;
	forwardExclusionAngle: Property | undefined;
	aftExclusionAngle: Property | undefined;
	altitude: Property | undefined;
	lateralSurfaceMaterial: MaterialProperty | undefined;
	intersectionColor: Property | undefined;
	intersectionWidth: Property | undefined;
	showIntersection: Property | undefined;
	radius: Property | undefined;
	show: Property | undefined;

	clone(result?: SarSensorGraphics): SarSensorGraphics;
	merge(source: SarSensorGraphics): void;
}

/**
 * Options accepted by {@link CustomSensorVolume}.
 */
export interface CustomSensorVolumeOptions {
	show?: boolean;
	showIntersection?: boolean;
	showThroughEllipsoid?: boolean;
	modelMatrix?: Matrix4;
	radius?: number;
	directions?: Spherical[];
	lateralSurfaceMaterial?: Material;
	intersectionColor?: Color;
	intersectionWidth?: number;
	id?: any;
	/** @internal */
	_pickPrimitive?: object;
}

/**
 * A custom sensor volume primitive defined by an array of directions.
 */
export class CustomSensorVolume {
	constructor(options?: CustomSensorVolumeOptions);

	/** Whether this sensor is shown. */
	show: boolean;
	/** Whether to show a polyline where the sensor intersects the globe. */
	showIntersection: boolean;
	/** Whether to draw through the ellipsoid. */
	showThroughEllipsoid: boolean;
	/** Model-to-world transformation. */
	modelMatrix: Matrix4;
	/** The sensor's radius. */
	radius: number;
	/** The directions that define the sensor volume boundary. */
	directions: Spherical[];
	/** The surface appearance of the sensor. */
	lateralSurfaceMaterial: Material;
	/** Color of the globe intersection line. */
	intersectionColor: Color;
	/** Pixel width of the globe intersection line. */
	intersectionWidth: number;
	/** User-defined object returned when the sensor is picked. */
	id: any;

	/**
	 * Called when the scene is rendered to accumulate draw commands.
	 * Do not call directly.
	 */
	update(frameState: FrameState): void;

	isDestroyed(): boolean;
	destroy(): void;
}

/**
 * Options accepted by {@link RectangularPyramidSensorVolume}.
 */
export interface RectangularPyramidSensorVolumeOptions extends Omit<CustomSensorVolumeOptions, 'directions'> {
	xHalfAngle?: number;
	yHalfAngle?: number;
}

/**
 * A rectangular pyramid sensor volume. Wraps a {@link CustomSensorVolume}.
 */
export class RectangularPyramidSensorVolume {
	constructor(options?: RectangularPyramidSensorVolumeOptions);

	xHalfAngle: number;
	yHalfAngle: number;
	show: boolean;
	showIntersection: boolean;
	showThroughEllipsoid: boolean;
	modelMatrix: Matrix4;
	radius: number;
	lateralSurfaceMaterial: Material;
	intersectionColor: Color;
	intersectionWidth: number;
	id: any;

	update(frameState: FrameState): void;
	isDestroyed(): boolean;
	destroy(): void;
}

/**
 * Options accepted by {@link SarSensorVolume}.
 */
export interface SarSensorVolumeOptions extends Omit<CustomSensorVolumeOptions, 'directions'> {
	minimumElevationAngle?: number;
	maximumElevationAngle?: number;
	forwardExclusionAngle?: number;
	aftExclusionAngle?: number;
	altitude?: number;
	surfaceRadius?: number;
}

/**
 * A SAR sensor volume. Wraps one or more {@link CustomSensorVolume} instances.
 */
export class SarSensorVolume {
	constructor(options?: SarSensorVolumeOptions);

	minimumElevationAngle: number;
	maximumElevationAngle: number;
	forwardExclusionAngle: number;
	aftExclusionAngle: number;
	altitude: number;
	surfaceRadius: number;
	show: boolean;
	showIntersection: boolean;
	showThroughEllipsoid: boolean;
	modelMatrix: Matrix4;
	radius: number;
	lateralSurfaceMaterial: Material;
	intersectionColor: Color;
	intersectionWidth: number;
	id: any;

	update(frameState: FrameState): void;
	isDestroyed(): boolean;
	destroy(): void;
}

/**
 * Maps {@link Entity#conicSensor} instances to {@link CustomSensorVolume} primitives.
 */
export class ConicSensorVisualizer {
	constructor(scene: Scene, entityCollection: EntityCollection);
	update(time: JulianDate): boolean;
	isDestroyed(): boolean;
	destroy(): void;
}

/**
 * Maps {@link Entity#customPatternSensor} instances to {@link CustomSensorVolume} primitives.
 */
export class CustomPatternSensorVisualizer {
	constructor(scene: Scene, entityCollection: EntityCollection);
	update(time: JulianDate): boolean;
	isDestroyed(): boolean;
	destroy(): void;
}

/**
 * Maps {@link Entity#rectangularSensor} instances to {@link CustomSensorVolume} primitives.
 */
export class RectangularSensorVisualizer {
	constructor(scene: Scene, entityCollection: EntityCollection);
	update(time: JulianDate): boolean;
	isDestroyed(): boolean;
	destroy(): void;
}

/**
 * Maps {@link Entity#sarSensor} instances to {@link SarSensorVolume} primitives.
 */
export class SarSensorVisualizer {
	constructor(scene: Scene, entityCollection: EntityCollection);
	update(time: JulianDate): boolean;
	isDestroyed(): boolean;
	destroy(): void;
}

/**
 * Augment Cesium's Entity with the sensor graphics properties added by this plugin's
 * CZML processors.
 */
declare module '@cesium/engine' {
	interface Entity {
		conicSensor?: ConicSensorGraphics;
		customPatternSensor?: CustomPatternSensorGraphics;
		rectangularSensor?: RectangularSensorGraphics;
		sarSensor?: SarSensorGraphics;
	}
}

/**
 * Default export bundling all sensor graphics, visualizers and primitives.
 * Importing this module automatically registers the CZML processors and
 * DataSourceDisplay visualizers with Cesium.
 */
declare const CesiumSensorVolumes: {
	ConicSensorGraphics: typeof ConicSensorGraphics;
	ConicSensorVisualizer: typeof ConicSensorVisualizer;
	CustomPatternSensorGraphics: typeof CustomPatternSensorGraphics;
	CustomPatternSensorVisualizer: typeof CustomPatternSensorVisualizer;
	CustomSensorVolume: typeof CustomSensorVolume;
	RectangularPyramidSensorVolume: typeof RectangularPyramidSensorVolume;
	RectangularSensorGraphics: typeof RectangularSensorGraphics;
	RectangularSensorVisualizer: typeof RectangularSensorVisualizer;
	SarSensorGraphics: typeof SarSensorGraphics;
	SarSensorVisualizer: typeof SarSensorVisualizer;
	SarSensorVolume: typeof SarSensorVolume;
};

export default CesiumSensorVolumes;
