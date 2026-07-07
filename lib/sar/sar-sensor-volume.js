import {
	Color,
	defined,
	destroyObject,
	DeveloperError,
	Frozen,
	Material,
	Math as CesiumMath,
	Matrix4,
	Spherical
} from 'cesium';
import CustomSensorVolume from '../custom/custom-sensor-volume';

const angleStep = CesiumMath.toRadians(2.0);
const defaultSurfaceRadius = 6378137.0;
const epsilon = 1e-12;

function validateElevationAngle(name, value) {
	// >>includeStart('debug', pragmas.debug);
	if (value < 0.0 || value > CesiumMath.PI_OVER_TWO) {
		throw new DeveloperError(name + ' must be between 0 and 90 degrees.');
	}
	// >>includeEnd('debug');
}

function validateExclusionAngle(name, value) {
	// >>includeStart('debug', pragmas.debug);
	if (value < 0.0 || value > Math.PI) {
		throw new DeveloperError(name + ' must be between 0 and 180 degrees.');
	}
	// >>includeEnd('debug');
}

function validateMinimumMaximum(minimumElevationAngle, maximumElevationAngle) {
	// >>includeStart('debug', pragmas.debug);
	if (minimumElevationAngle > maximumElevationAngle) {
		throw new DeveloperError('minimumElevationAngle must be less than or equal to maximumElevationAngle.');
	}
	// >>includeEnd('debug');
}

function assignSpherical(array, clock, cone) {
	array.push(new Spherical(clock, cone, 1.0));
}

function coneFromElevation(elevation, surfaceRadius, altitude) {
	var denominator = surfaceRadius + altitude;
	if (denominator <= 0.0) {
		return CesiumMath.PI_OVER_TWO;
	}
	var sine = CesiumMath.clamp((surfaceRadius * Math.cos(elevation)) / denominator, 0.0, 1.0);
	return Math.asin(sine);
}

function applyExclusion(interval, axisScale, exclusionAngle) {
	var cosine = Math.cos(exclusionAngle);

	if (Math.abs(axisScale) < epsilon) {
		return cosine >= 0.0;
	}

	var limit = cosine / axisScale;
	if (axisScale > 0.0) {
		if (limit < 0.0) {
			return false;
		}
		if (limit < 1.0) {
			interval.maximumCone = Math.min(interval.maximumCone, Math.asin(CesiumMath.clamp(limit, 0.0, 1.0)));
		}
	} else {
		if (limit > 1.0) {
			return false;
		}
		if (limit > 0.0) {
			interval.minimumCone = Math.max(interval.minimumCone, Math.asin(CesiumMath.clamp(limit, 0.0, 1.0)));
		}
	}

	return interval.minimumCone <= interval.maximumCone;
}

function computeConeInterval(clock, innerCone, outerCone, forwardExclusionAngle, aftExclusionAngle) {
	var interval = {
		clock: clock,
		minimumCone: innerCone,
		maximumCone: outerCone
	};
	var cosineClock = Math.cos(clock);

	if (!applyExclusion(interval, cosineClock, forwardExclusionAngle)) {
		return undefined;
	}
	if (!applyExclusion(interval, -cosineClock, aftExclusionAngle)) {
		return undefined;
	}

	return interval.minimumCone <= interval.maximumCone ? interval : undefined;
}

function cloneSampleWithClockOffset(sample, offset) {
	return {
		clock: sample.clock + offset,
		minimumCone: sample.minimumCone,
		maximumCone: sample.maximumCone
	};
}

function sampleIntervals(innerCone, outerCone, forwardExclusionAngle, aftExclusionAngle) {
	var sampleCount = Math.ceil(CesiumMath.TWO_PI / angleStep);
	var clockStep = CesiumMath.TWO_PI / sampleCount;
	var samples = new Array(sampleCount);
	var i;
	var allSamplesValid = true;

	for (i = 0; i < sampleCount; i++) {
		samples[i] = computeConeInterval(i * clockStep, innerCone, outerCone, forwardExclusionAngle, aftExclusionAngle);
		allSamplesValid = allSamplesValid && defined(samples[i]);
	}

	var spans = [];
	var currentSpan;
	for (i = 0; i < sampleCount; i++) {
		var sample = samples[i];
		if (defined(sample)) {
			if (!defined(currentSpan)) {
				currentSpan = [];
			}
			currentSpan.push(sample);
		} else if (defined(currentSpan)) {
			spans.push(currentSpan);
			currentSpan = undefined;
		}
	}
	if (defined(currentSpan)) {
		spans.push(currentSpan);
	}

	if (spans.length > 1 && defined(samples[0]) && defined(samples[sampleCount - 1])) {
		var firstSpan = spans.shift();
		var lastSpan = spans.pop();
		for (i = 0; i < firstSpan.length; i++) {
			lastSpan.push(cloneSampleWithClockOffset(firstSpan[i], CesiumMath.TWO_PI));
		}
		spans.push(lastSpan);
	}

	var result = [];
	for (i = 0; i < spans.length; i++) {
		result.push({
			samples: spans[i],
			closed: allSamplesValid
		});
	}

	return result;
}

function createBoundarySegment(span, property, reverse) {
	var samples = span.samples;
	if (samples.length < 2) {
		return undefined;
	}

	var directions = [];
	var i;
	if (reverse) {
		for (i = samples.length - 1; i > -1; i--) {
			assignSpherical(directions, samples[i].clock, samples[i][property]);
		}
	} else {
		for (i = 0; i < samples.length; i++) {
			assignSpherical(directions, samples[i].clock, samples[i][property]);
		}
	}

	return {
		directions: directions,
		closed: span.closed
	};
}

function createRadialSegment(sample, reverse) {
	if (Math.abs(sample.maximumCone - sample.minimumCone) <= epsilon) {
		return undefined;
	}

	var directions = [];
	if (reverse) {
		assignSpherical(directions, sample.clock, sample.maximumCone);
		assignSpherical(directions, sample.clock, sample.minimumCone);
	} else {
		assignSpherical(directions, sample.clock, sample.minimumCone);
		assignSpherical(directions, sample.clock, sample.maximumCone);
	}

	return {
		directions: directions,
		closed: false
	};
}

function hasInnerBoundary(span) {
	var samples = span.samples;
	for (var i = 0; i < samples.length; i++) {
		if (samples[i].minimumCone > epsilon) {
			return true;
		}
	}

	return false;
}

function computeDirectionSegments(sarSensor) {
	var surfaceRadius = Math.max(sarSensor._surfaceRadius, epsilon);
	var altitude = Math.max(sarSensor._altitude, 0.0);
	var outerCone = coneFromElevation(sarSensor._minimumElevationAngle, surfaceRadius, altitude);
	var innerCone = coneFromElevation(sarSensor._maximumElevationAngle, surfaceRadius, altitude);
	var spans = sampleIntervals(innerCone, outerCone, sarSensor._forwardExclusionAngle, sarSensor._aftExclusionAngle);
	var directionSegments = [];

	for (var i = 0; i < spans.length; i++) {
		var span = spans[i];
		var upperSegment = createBoundarySegment(span, 'maximumCone', false);
		if (defined(upperSegment)) {
			directionSegments.push(upperSegment);
		}

		if (hasInnerBoundary(span)) {
			var lowerSegment = createBoundarySegment(span, 'minimumCone', true);
			if (defined(lowerSegment)) {
				directionSegments.push(lowerSegment);
			}
		}

		if (!span.closed) {
			var samples = span.samples;
			var startSegment = createRadialSegment(samples[0], false);
			if (defined(startSegment)) {
				directionSegments.push(startSegment);
			}

			var endSegment = createRadialSegment(samples[samples.length - 1], true);
			if (defined(endSegment)) {
				directionSegments.push(endSegment);
			}
		}
	}

	return directionSegments;
}

function createCustomSensor(sarSensor) {
	return new CustomSensorVolume({
		_pickPrimitive: sarSensor,
		show: sarSensor._show,
		showIntersection: sarSensor._showIntersection,
		showThroughEllipsoid: sarSensor._showThroughEllipsoid,
		modelMatrix: sarSensor._modelMatrix,
		radius: sarSensor._radius,
		directions: [],
		lateralSurfaceMaterial: sarSensor._lateralSurfaceMaterial,
		intersectionColor: sarSensor._intersectionColor,
		intersectionWidth: sarSensor._intersectionWidth,
		id: sarSensor._id
	});
}

function syncCustomSensor(sarSensor, customSensor) {
	customSensor.show = sarSensor._show;
	customSensor.showIntersection = sarSensor._showIntersection;
	customSensor.showThroughEllipsoid = sarSensor._showThroughEllipsoid;
	customSensor.modelMatrix = sarSensor._modelMatrix;
	customSensor.radius = sarSensor._radius;
	customSensor.lateralSurfaceMaterial = sarSensor._lateralSurfaceMaterial;
	customSensor.intersectionColor = sarSensor._intersectionColor;
	customSensor.intersectionWidth = sarSensor._intersectionWidth;
	customSensor.id = sarSensor._id;
}

function updateDirections(sarSensor) {
	var directionSegments = computeDirectionSegments(sarSensor);
	var customSensors = sarSensor._customSensors;
	var requiredSensorCount = directionSegments.length > 0 ? 1 : 0;

	while (customSensors.length > requiredSensorCount) {
		var customSensor = customSensors.pop();
		if (!customSensor.isDestroyed()) {
			customSensor.destroy();
		}
	}

	if (requiredSensorCount > 0) {
		if (!defined(customSensors[0])) {
			customSensors[0] = createCustomSensor(sarSensor);
		}
		syncCustomSensor(sarSensor, customSensors[0]);
		customSensors[0].directionSegments = directionSegments;
	}

	sarSensor._directionsDirty = false;
}

function syncAllCustomSensors(sarSensor) {
	var customSensors = sarSensor._customSensors;
	for (var i = 0; i < customSensors.length; i++) {
		syncCustomSensor(sarSensor, customSensors[i]);
	}
}

const SarSensorVolume = function(options) {
	options = options ?? Frozen.EMPTY_OBJECT;

	this._customSensors = [];
	this._directionsDirty = true;

	this._minimumElevationAngle = options.minimumElevationAngle ?? 0.0;
	this._maximumElevationAngle = options.maximumElevationAngle ?? CesiumMath.PI_OVER_TWO;
	this._forwardExclusionAngle = options.forwardExclusionAngle ?? 0.0;
	this._aftExclusionAngle = options.aftExclusionAngle ?? 0.0;
	this._altitude = options.altitude ?? 0.0;
	this._surfaceRadius = options.surfaceRadius ?? defaultSurfaceRadius;

	this._show = options.show ?? true;
	this._showIntersection = options.showIntersection ?? true;
	this._showThroughEllipsoid = options.showThroughEllipsoid ?? false;
	this._modelMatrix = Matrix4.clone(options.modelMatrix ?? Matrix4.IDENTITY);
	this._radius = options.radius ?? Number.POSITIVE_INFINITY;
	this._lateralSurfaceMaterial = defined(options.lateralSurfaceMaterial) ? options.lateralSurfaceMaterial : Material.fromType(Material.ColorType);
	this._intersectionColor = Color.clone(options.intersectionColor ?? Color.WHITE);
	this._intersectionWidth = options.intersectionWidth ?? 5.0;
	this._id = options.id;

	validateElevationAngle('minimumElevationAngle', this._minimumElevationAngle);
	validateElevationAngle('maximumElevationAngle', this._maximumElevationAngle);
	validateMinimumMaximum(this._minimumElevationAngle, this._maximumElevationAngle);
	validateExclusionAngle('forwardExclusionAngle', this._forwardExclusionAngle);
	validateExclusionAngle('aftExclusionAngle', this._aftExclusionAngle);
};

Object.defineProperties(SarSensorVolume.prototype, {
	minimumElevationAngle: {
		get: function() {
			return this._minimumElevationAngle;
		},
		set: function(value) {
			validateElevationAngle('minimumElevationAngle', value);
			validateMinimumMaximum(value, this._maximumElevationAngle);
			if (this._minimumElevationAngle !== value) {
				this._minimumElevationAngle = value;
				this._directionsDirty = true;
			}
		}
	},
	maximumElevationAngle: {
		get: function() {
			return this._maximumElevationAngle;
		},
		set: function(value) {
			validateElevationAngle('maximumElevationAngle', value);
			validateMinimumMaximum(this._minimumElevationAngle, value);
			if (this._maximumElevationAngle !== value) {
				this._maximumElevationAngle = value;
				this._directionsDirty = true;
			}
		}
	},
	forwardExclusionAngle: {
		get: function() {
			return this._forwardExclusionAngle;
		},
		set: function(value) {
			validateExclusionAngle('forwardExclusionAngle', value);
			if (this._forwardExclusionAngle !== value) {
				this._forwardExclusionAngle = value;
				this._directionsDirty = true;
			}
		}
	},
	aftExclusionAngle: {
		get: function() {
			return this._aftExclusionAngle;
		},
		set: function(value) {
			validateExclusionAngle('aftExclusionAngle', value);
			if (this._aftExclusionAngle !== value) {
				this._aftExclusionAngle = value;
				this._directionsDirty = true;
			}
		}
	},
	altitude: {
		get: function() {
			return this._altitude;
		},
		set: function(value) {
			// >>includeStart('debug', pragmas.debug);
			if (value < 0.0) {
				throw new DeveloperError('altitude must be greater than or equal to zero.');
			}
			// >>includeEnd('debug');
			if (this._altitude !== value) {
				this._altitude = value;
				this._directionsDirty = true;
			}
		}
	},
	surfaceRadius: {
		get: function() {
			return this._surfaceRadius;
		},
		set: function(value) {
			// >>includeStart('debug', pragmas.debug);
			if (value <= 0.0) {
				throw new DeveloperError('surfaceRadius must be greater than zero.');
			}
			// >>includeEnd('debug');
			if (this._surfaceRadius !== value) {
				this._surfaceRadius = value;
				this._directionsDirty = true;
			}
		}
	},
	show: {
		get: function() {
			return this._show;
		},
		set: function(value) {
			this._show = value;
			syncAllCustomSensors(this);
		}
	},
	showIntersection: {
		get: function() {
			return this._showIntersection;
		},
		set: function(value) {
			this._showIntersection = value;
			syncAllCustomSensors(this);
		}
	},
	showThroughEllipsoid: {
		get: function() {
			return this._showThroughEllipsoid;
		},
		set: function(value) {
			this._showThroughEllipsoid = value;
			syncAllCustomSensors(this);
		}
	},
	modelMatrix: {
		get: function() {
			return this._modelMatrix;
		},
		set: function(value) {
			this._modelMatrix = value;
			syncAllCustomSensors(this);
		}
	},
	radius: {
		get: function() {
			return this._radius;
		},
		set: function(value) {
			this._radius = value;
			syncAllCustomSensors(this);
		}
	},
	lateralSurfaceMaterial: {
		get: function() {
			return this._lateralSurfaceMaterial;
		},
		set: function(value) {
			this._lateralSurfaceMaterial = value;
			syncAllCustomSensors(this);
		}
	},
	intersectionColor: {
		get: function() {
			return this._intersectionColor;
		},
		set: function(value) {
			this._intersectionColor = value;
			syncAllCustomSensors(this);
		}
	},
	intersectionWidth: {
		get: function() {
			return this._intersectionWidth;
		},
		set: function(value) {
			this._intersectionWidth = value;
			syncAllCustomSensors(this);
		}
	},
	id: {
		get: function() {
			return this._id;
		},
		set: function(value) {
			this._id = value;
			syncAllCustomSensors(this);
		}
	}
});

SarSensorVolume.prototype.setElevationAngles = function(minimumElevationAngle, maximumElevationAngle) {
	validateElevationAngle('minimumElevationAngle', minimumElevationAngle);
	validateElevationAngle('maximumElevationAngle', maximumElevationAngle);
	validateMinimumMaximum(minimumElevationAngle, maximumElevationAngle);

	if (this._minimumElevationAngle !== minimumElevationAngle || this._maximumElevationAngle !== maximumElevationAngle) {
		this._minimumElevationAngle = minimumElevationAngle;
		this._maximumElevationAngle = maximumElevationAngle;
		this._directionsDirty = true;
	}
};

SarSensorVolume.prototype.update = function(frameState) {
	if (this._directionsDirty) {
		updateDirections(this);
	}

	var customSensors = this._customSensors;
	for (var i = 0; i < customSensors.length; i++) {
		customSensors[i].update(frameState);
	}
};

SarSensorVolume.prototype.isDestroyed = function() {
	return false;
};

SarSensorVolume.prototype.destroy = function() {
	var customSensors = this._customSensors;
	for (var i = customSensors.length - 1; i > -1; i--) {
		customSensors[i].destroy();
	}
	return destroyObject(this);
};

export default SarSensorVolume;
