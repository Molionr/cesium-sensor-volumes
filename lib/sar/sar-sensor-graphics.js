import {
	defined,
	DeveloperError,
	Event,
	Frozen,
	createMaterialPropertyDescriptor,
	createPropertyDescriptor
} from 'cesium';

/**
 * An optionally time-dynamic SAR sensor.
 *
 * @alias SarSensorGraphics
 * @constructor
 */
const SarSensorGraphics = function(options) {
	this._minimumElevationAngle = undefined;
	this._minimumElevationAngleSubscription = undefined;
	this._maximumElevationAngle = undefined;
	this._maximumElevationAngleSubscription = undefined;
	this._forwardExclusionAngle = undefined;
	this._forwardExclusionAngleSubscription = undefined;
	this._aftExclusionAngle = undefined;
	this._aftExclusionAngleSubscription = undefined;
	this._altitude = undefined;
	this._altitudeSubscription = undefined;
	this._lateralSurfaceMaterial = undefined;
	this._lateralSurfaceMaterialSubscription = undefined;
	this._intersectionColor = undefined;
	this._intersectionColorSubscription = undefined;
	this._intersectionWidth = undefined;
	this._intersectionWidthSubscription = undefined;
	this._showIntersection = undefined;
	this._showIntersectionSubscription = undefined;
	this._radius = undefined;
	this._radiusSubscription = undefined;
	this._show = undefined;
	this._showSubscription = undefined;
	this._definitionChanged = new Event();

	this.merge(options ?? Frozen.EMPTY_OBJECT);
};

Object.defineProperties(SarSensorGraphics.prototype, {
	/**
	 * Gets the event that is raised whenever a new property is assigned.
	 * @memberof SarSensorGraphics.prototype
	 *
	 * @type {Event}
	 * @readonly
	 */
	definitionChanged: {
		get: function() {
			return this._definitionChanged;
		}
	},

	/**
	 * Gets or sets the numeric {@link Property} specifying the SAR minimum ground elevation angle.
	 * @memberof SarSensorGraphics.prototype
	 * @type {Property}
	 */
	minimumElevationAngle: createPropertyDescriptor('minimumElevationAngle'),

	/**
	 * Gets or sets the numeric {@link Property} specifying the SAR maximum ground elevation angle.
	 * @memberof SarSensorGraphics.prototype
	 * @type {Property}
	 */
	maximumElevationAngle: createPropertyDescriptor('maximumElevationAngle'),

	/**
	 * Gets or sets the numeric {@link Property} specifying the SAR forward exclusion angle.
	 * @memberof SarSensorGraphics.prototype
	 * @type {Property}
	 */
	forwardExclusionAngle: createPropertyDescriptor('forwardExclusionAngle'),

	/**
	 * Gets or sets the numeric {@link Property} specifying the SAR aft exclusion angle.
	 * @memberof SarSensorGraphics.prototype
	 * @type {Property}
	 */
	aftExclusionAngle: createPropertyDescriptor('aftExclusionAngle'),

	/**
	 * Gets or sets the numeric {@link Property} specifying the sensor altitude in meters.
	 * @memberof SarSensorGraphics.prototype
	 * @type {Property}
	 */
	altitude: createPropertyDescriptor('altitude'),

	/**
	 * Gets or sets the {@link MaterialProperty} specifying the SAR sensor's appearance.
	 * @memberof SarSensorGraphics.prototype
	 * @type {MaterialProperty}
	 */
	lateralSurfaceMaterial: createMaterialPropertyDescriptor('lateralSurfaceMaterial'),

	/**
	 * Gets or sets the {@link Color} {@link Property} specifying the color of the line formed by the intersection of the sensor and other central bodies.
	 * @memberof SarSensorGraphics.prototype
	 * @type {Property}
	 */
	intersectionColor: createPropertyDescriptor('intersectionColor'),

	/**
	 * Gets or sets the numeric {@link Property} specifying the width of the line formed by the intersection of the sensor and other central bodies.
	 * @memberof SarSensorGraphics.prototype
	 * @type {Property}
	 */
	intersectionWidth: createPropertyDescriptor('intersectionWidth'),

	/**
	 * Gets or sets the boolean {@link Property} specifying the visibility of the line formed by the intersection of the sensor and other central bodies.
	 * @memberof SarSensorGraphics.prototype
	 * @type {Property}
	 */
	showIntersection: createPropertyDescriptor('showIntersection'),

	/**
	 * Gets or sets the numeric {@link Property} specifying the radius of the sensor's projection.
	 * @memberof SarSensorGraphics.prototype
	 * @type {Property}
	 */
	radius: createPropertyDescriptor('radius'),

	/**
	 * Gets or sets the boolean {@link Property} specifying the visibility of the sensor.
	 * @memberof SarSensorGraphics.prototype
	 * @type {Property}
	 */
	show: createPropertyDescriptor('show')
});

/**
 * Duplicates a SarSensorGraphics instance.
 *
 * @param {SarSensorGraphics} [result] The object onto which to store the result.
 * @returns {SarSensorGraphics} The modified result parameter or a new instance if one was not provided.
 */
SarSensorGraphics.prototype.clone = function(result) {
	if (!defined(result)) {
		result = new SarSensorGraphics();
	}
	result.show = this.show;
	result.minimumElevationAngle = this.minimumElevationAngle;
	result.maximumElevationAngle = this.maximumElevationAngle;
	result.forwardExclusionAngle = this.forwardExclusionAngle;
	result.aftExclusionAngle = this.aftExclusionAngle;
	result.altitude = this.altitude;
	result.radius = this.radius;
	result.showIntersection = this.showIntersection;
	result.intersectionColor = this.intersectionColor;
	result.intersectionWidth = this.intersectionWidth;
	result.lateralSurfaceMaterial = this.lateralSurfaceMaterial;
	return result;
};

/**
 * Assigns each unassigned property on this object to the value
 * of the same property on the provided source object.
 *
 * @param {SarSensorGraphics} source The object to be merged into this object.
 */
SarSensorGraphics.prototype.merge = function(source) {
	// >>includeStart('debug', pragmas.debug);
	if (!defined(source)) {
		throw new DeveloperError('source is required.');
	}
	// >>includeEnd('debug');

	this.show = this.show ?? source.show;
	this.minimumElevationAngle = this.minimumElevationAngle ?? source.minimumElevationAngle;
	this.maximumElevationAngle = this.maximumElevationAngle ?? source.maximumElevationAngle;
	this.forwardExclusionAngle = this.forwardExclusionAngle ?? source.forwardExclusionAngle;
	this.aftExclusionAngle = this.aftExclusionAngle ?? source.aftExclusionAngle;
	this.altitude = this.altitude ?? source.altitude;
	this.radius = this.radius ?? source.radius;
	this.showIntersection = this.showIntersection ?? source.showIntersection;
	this.intersectionColor = this.intersectionColor ?? source.intersectionColor;
	this.intersectionWidth = this.intersectionWidth ?? source.intersectionWidth;
	this.lateralSurfaceMaterial = this.lateralSurfaceMaterial ?? source.lateralSurfaceMaterial;
};

export default SarSensorGraphics;
