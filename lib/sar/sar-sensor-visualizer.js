import {
	AssociativeArray,
	Cartesian3,
	Cartographic,
	Color,
	defined,
	destroyObject,
	DeveloperError,
	Ellipsoid,
	Math as CesiumMath,
	Matrix3,
	Matrix4,
	Quaternion,
	MaterialProperty,
	Property
} from 'cesium';
import removePrimitive from '../util/remove-primitive';
import SarSensorVolume from './sar-sensor-volume';

const defaultIntersectionColor = Color.WHITE;
const defaultIntersectionWidth = 1.0;
const defaultRadius = Number.POSITIVE_INFINITY;
const defaultMinimumElevationAngle = 0.0;
const defaultMaximumElevationAngle = CesiumMath.PI_OVER_TWO;
const defaultExclusionAngle = 0.0;
const defaultSurfaceRadius = 6378137.0;

const matrix3Scratch = new Matrix3();
const cachedPosition = new Cartesian3();
const cachedOrientation = new Quaternion();
const surfaceScratch = new Cartesian3();
const cartographicScratch = new Cartographic();

function getEllipsoid(scene) {
	return defined(scene.globe) && defined(scene.globe.ellipsoid) ? scene.globe.ellipsoid : Ellipsoid.WGS84;
}

function getSurfaceData(scene, position, altitude, result) {
	var ellipsoid = getEllipsoid(scene);
	var surface = ellipsoid.scaleToGeodeticSurface(position, surfaceScratch);
	if (!defined(surface)) {
		return undefined;
	}

	result.surfaceRadius = Math.max(Cartesian3.magnitude(surface), 1.0);

	if (defined(altitude)) {
		result.altitude = Math.max(altitude, 0.0);
		return result;
	}

	var cartographic = ellipsoid.cartesianToCartographic(position, cartographicScratch);
	if (defined(cartographic)) {
		result.altitude = Math.max(cartographic.height, 0.0);
	} else {
		result.altitude = Math.max(Cartesian3.distance(position, surface), 0.0);
	}

	return result;
}

/**
 * A {@link Visualizer} which maps {@link Entity#sarSensor} to a {@link SarSensor}.
 * @alias SarSensorVisualizer
 * @constructor
 *
 * @param {Scene} scene The scene the primitives will be rendered in.
 * @param {EntityCollection} entityCollection The entityCollection to visualize.
 */
const SarSensorVisualizer = function(scene, entityCollection) {
	// >>includeStart('debug', pragmas.debug);
	if (!defined(scene)) {
		throw new DeveloperError('scene is required.');
	}
	if (!defined(entityCollection)) {
		throw new DeveloperError('entityCollection is required.');
	}
	// >>includeEnd('debug');

	entityCollection.collectionChanged.addEventListener(SarSensorVisualizer.prototype._onCollectionChanged, this);

	this._scene = scene;
	this._primitives = scene.primitives;
	this._entityCollection = entityCollection;
	this._hash = {};
	this._entitiesToVisualize = new AssociativeArray();
	this._surfaceData = {
		altitude: 0.0,
		surfaceRadius: defaultSurfaceRadius
	};

	this._onCollectionChanged(entityCollection, entityCollection.values, [], []);
};

/**
 * Updates the primitives created by this visualizer to match their
 * Entity counterpart at the given time.
 *
 * @param {JulianDate} time The time to update to.
 * @returns {Boolean} This function always returns true.
 */
SarSensorVisualizer.prototype.update = function(time) {
	// >>includeStart('debug', pragmas.debug);
	if (!defined(time)) {
		throw new DeveloperError('time is required.');
	}
	// >>includeEnd('debug');

	var entities = this._entitiesToVisualize.values;
	var hash = this._hash;
	var primitives = this._primitives;

	for (var i = 0, len = entities.length; i < len; i++) {
		var entity = entities[i];
		var sarSensorGraphics = entity._sarSensor;

		var position;
		var orientation;
		var surfaceData;
		var data = hash[entity.id];
		var show = entity.isShowing && entity.isAvailable(time) && Property.getValueOrDefault(sarSensorGraphics._show, time, true);

		if (show) {
			position = Property.getValueOrUndefined(entity._position, time, cachedPosition);
			orientation = Property.getValueOrUndefined(entity._orientation, time, cachedOrientation);
			var altitude = Property.getValueOrUndefined(sarSensorGraphics._altitude, time);
			if (defined(position) && defined(orientation)) {
				surfaceData = getSurfaceData(this._scene, position, altitude, this._surfaceData);
			}
			show = defined(position) && defined(orientation) && defined(surfaceData);
		}

		if (!show) {
			// don't bother creating or updating anything else
			if (defined(data)) {
				data.primitive.show = false;
			}
			continue;
		}

		var primitive = defined(data) ? data.primitive : undefined;
		if (!defined(primitive)) {
			primitive = new SarSensorVolume();
			primitive.id = entity;
			primitives.add(primitive);

			data = {
				primitive: primitive,
				position: undefined,
				orientation: undefined
			};
			hash[entity.id] = data;
		}

		if (!Cartesian3.equals(position, data.position) || !Quaternion.equals(orientation, data.orientation)) {
			Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(orientation, matrix3Scratch), position, primitive.modelMatrix);
			data.position = Cartesian3.clone(position, data.position);
			data.orientation = Quaternion.clone(orientation, data.orientation);
		}

		primitive.show = true;
		primitive.setElevationAngles(
			Property.getValueOrDefault(sarSensorGraphics._minimumElevationAngle, time, defaultMinimumElevationAngle),
			Property.getValueOrDefault(sarSensorGraphics._maximumElevationAngle, time, defaultMaximumElevationAngle)
		);
		primitive.forwardExclusionAngle = Property.getValueOrDefault(sarSensorGraphics._forwardExclusionAngle, time, defaultExclusionAngle);
		primitive.aftExclusionAngle = Property.getValueOrDefault(sarSensorGraphics._aftExclusionAngle, time, defaultExclusionAngle);
		primitive.altitude = surfaceData.altitude;
		primitive.surfaceRadius = surfaceData.surfaceRadius;
		primitive.radius = Property.getValueOrDefault(sarSensorGraphics._radius, time, defaultRadius);
		primitive.showIntersection = Property.getValueOrDefault(sarSensorGraphics._showIntersection, time, true);
		primitive.lateralSurfaceMaterial = MaterialProperty.getValue(time, sarSensorGraphics._lateralSurfaceMaterial, primitive.lateralSurfaceMaterial);
		primitive.intersectionColor = Property.getValueOrClonedDefault(sarSensorGraphics._intersectionColor, time, defaultIntersectionColor, primitive.intersectionColor);
		primitive.intersectionWidth = Property.getValueOrDefault(sarSensorGraphics._intersectionWidth, time, defaultIntersectionWidth);
	}
	return true;
};

/**
 * Returns true if this object was destroyed; otherwise, false.
 *
 * @returns {Boolean} True if this object was destroyed; otherwise, false.
 */
SarSensorVisualizer.prototype.isDestroyed = function() {
	return false;
};

/**
 * Removes and destroys all primitives created by this instance.
 */
SarSensorVisualizer.prototype.destroy = function() {
	var entities = this._entitiesToVisualize.values;
	var hash = this._hash;
	var primitives = this._primitives;
	for (var i = entities.length - 1; i > -1; i--) {
		removePrimitive(entities[i], hash, primitives);
	}
	return destroyObject(this);
};

/**
 * @private
 */
SarSensorVisualizer.prototype._onCollectionChanged = function(entityCollection, added, removed, changed) {
	var i;
	var entity;
	var entities = this._entitiesToVisualize;
	var hash = this._hash;
	var primitives = this._primitives;

	for (i = added.length - 1; i > -1; i--) {
		entity = added[i];
		if (defined(entity._sarSensor) && defined(entity._position) && defined(entity._orientation)) {
			entities.set(entity.id, entity);
		}
	}

	for (i = changed.length - 1; i > -1; i--) {
		entity = changed[i];
		if (defined(entity._sarSensor) && defined(entity._position) && defined(entity._orientation)) {
			entities.set(entity.id, entity);
		} else {
			removePrimitive(entity, hash, primitives);
			entities.remove(entity.id);
		}
	}

	for (i = removed.length - 1; i > -1; i--) {
		entity = removed[i];
		removePrimitive(entity, hash, primitives);
		entities.remove(entity.id);
	}
};

export default SarSensorVisualizer;
