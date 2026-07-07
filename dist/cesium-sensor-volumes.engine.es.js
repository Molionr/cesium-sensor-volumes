/**
 * Cesium Sensor Volumes - https://github.com/Flowm/cesium-sensor-volumes
 *
 * Copyright 2016 Jonathan Lounsbury
 * Copyright 2011-2014 Analytical Graphics Inc. and Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Portions licensed separately.
 * See https://github.com/Flowm/cesium-sensor-volumes/blob/master/LICENSE.md for full licensing details.
 *
 * Derived from Cesium Sensors - https://github.com/AnalyticalGraphicsInc/cesium-sensors
 */

import { createPropertyDescriptor, createMaterialPropertyDescriptor, defined, DeveloperError, Event, Frozen, Cartesian3, SceneMode, RenderState, BlendingState, CullFace, Pass, Matrix4, BoundingSphere, ShaderSource, ShaderProgram, combine, destroyObject, DrawCommand, PrimitiveType, Material, Color, Buffer, BufferUsage, ComponentDatatype, VertexArray, Matrix3, Quaternion, AssociativeArray, Property, Math as Math$1, MaterialProperty, Spherical, clone, Cartographic, Ellipsoid, CzmlDataSource, DataSourceDisplay, TimeInterval } from '@cesium/engine';

/**
 * An optionally time-dynamic cone.
 *
 * @alias ConicSensorGraphics
 * @constructor
 */
const ConicSensorGraphics = function(options) {
	this._minimumClockAngle = undefined;
	this._minimumClockAngleSubscription = undefined;
	this._maximumClockAngle = undefined;
	this._maximumClockAngleSubscription = undefined;
	this._innerHalfAngle = undefined;
	this._innerHalfAngleSubscription = undefined;
	this._outerHalfAngle = undefined;
	this._outerHalfAngleSubscription = undefined;
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

Object.defineProperties(ConicSensorGraphics.prototype, {
	/**
	 * Gets the event that is raised whenever a new property is assigned.
	 * @memberof ConicSensorGraphics.prototype
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
	 * Gets or sets the numeric {@link Property} specifying the the cone's minimum clock angle.
	 * @memberof ConicSensorGraphics.prototype
	 * @type {Property}
	 */
	minimumClockAngle: createPropertyDescriptor('minimumClockAngle'),

	/**
	 * Gets or sets the numeric {@link Property} specifying the the cone's maximum clock angle.
	 * @memberof ConicSensorGraphics.prototype
	 * @type {Property}
	 */
	maximumClockAngle: createPropertyDescriptor('maximumClockAngle'),

	/**
	 * Gets or sets the numeric {@link Property} specifying the the cone's inner half-angle.
	 * @memberof ConicSensorGraphics.prototype
	 * @type {Property}
	 */
	innerHalfAngle: createPropertyDescriptor('innerHalfAngle'),

	/**
	 * Gets or sets the numeric {@link Property} specifying the the cone's outer half-angle.
	 * @memberof ConicSensorGraphics.prototype
	 * @type {Property}
	 */
	outerHalfAngle: createPropertyDescriptor('outerHalfAngle'),

	/**
	 * Gets or sets the {@link MaterialProperty} specifying the the cone's appearance.
	 * @memberof ConicSensorGraphics.prototype
	 * @type {MaterialProperty}
	 */
	lateralSurfaceMaterial: createMaterialPropertyDescriptor('lateralSurfaceMaterial'),

	/**
	 * Gets or sets the {@link Color} {@link Property} specifying the color of the line formed by the intersection of the cone and other central bodies.
	 * @memberof ConicSensorGraphics.prototype
	 * @type {Property}
	 */
	intersectionColor: createPropertyDescriptor('intersectionColor'),

	/**
	 * Gets or sets the numeric {@link Property} specifying the width of the line formed by the intersection of the cone and other central bodies.
	 * @memberof ConicSensorGraphics.prototype
	 * @type {Property}
	 */
	intersectionWidth: createPropertyDescriptor('intersectionWidth'),

	/**
	 * Gets or sets the boolean {@link Property} specifying the visibility of the line formed by the intersection of the cone and other central bodies.
	 * @memberof ConicSensorGraphics.prototype
	 * @type {Property}
	 */
	showIntersection: createPropertyDescriptor('showIntersection'),

	/**
	 * Gets or sets the numeric {@link Property} specifying the radius of the cone's projection.
	 * @memberof ConicSensorGraphics.prototype
	 * @type {Property}
	 */
	radius: createPropertyDescriptor('radius'),

	/**
	 * Gets or sets the boolean {@link Property} specifying the visibility of the cone.
	 * @memberof ConicSensorGraphics.prototype
	 * @type {Property}
	 */
	show: createPropertyDescriptor('show')
});

/**
 * Duplicates a ConicSensorGraphics instance.
 *
 * @param {ConicSensorGraphics} [result] The object onto which to store the result.
 * @returns {ConicSensorGraphics} The modified result parameter or a new instance if one was not provided.
 */
ConicSensorGraphics.prototype.clone = function(result) {
	if (!defined(result)) {
		result = new ConicSensorGraphics();
	}
	result.show = this.show;
	result.innerHalfAngle = this.innerHalfAngle;
	result.outerHalfAngle = this.outerHalfAngle;
	result.minimumClockAngle = this.minimumClockAngle;
	result.maximumClockAngle = this.maximumClockAngle;
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
 * @param {ConicSensorGraphics} source The object to be merged into this object.
 */
ConicSensorGraphics.prototype.merge = function(source) {
	// >>includeStart('debug', pragmas.debug);
	if (!defined(source)) {
		throw new DeveloperError('source is required.');
	}
	// >>includeEnd('debug');

	this.show = this.show ?? source.show;
	this.innerHalfAngle = this.innerHalfAngle ?? source.innerHalfAngle;
	this.outerHalfAngle = this.outerHalfAngle ?? source.outerHalfAngle;
	this.minimumClockAngle = this.minimumClockAngle ?? source.minimumClockAngle;
	this.maximumClockAngle = this.maximumClockAngle ?? source.maximumClockAngle;
	this.radius = this.radius ?? source.radius;
	this.showIntersection = this.showIntersection ?? source.showIntersection;
	this.intersectionColor = this.intersectionColor ?? source.intersectionColor;
	this.intersectionWidth = this.intersectionWidth ?? source.intersectionWidth;
	this.lateralSurfaceMaterial = this.lateralSurfaceMaterial ?? source.lateralSurfaceMaterial;
};

var SensorVolume = "#version 300 es\n\nuniform vec4 u_intersectionColor;\nuniform float u_intersectionWidth;\n\nbool inSensorShadow(vec3 coneVertexWC, vec3 pointWC)\n{\n    \n    vec3 D = czm_ellipsoidInverseRadii;\n\n    \n    vec3 q = D * coneVertexWC;\n    float qMagnitudeSquared = dot(q, q);\n    float test = qMagnitudeSquared - 1.0;\n\n    \n    vec3 temp = D * pointWC - q;\n    float d = dot(temp, q);\n\n    \n    return (d < -test) && (d / length(temp) < -sqrt(test));\n}\n\nvec4 getIntersectionColor()\n{\n    return u_intersectionColor;\n}\n\nfloat getIntersectionWidth()\n{\n    return u_intersectionWidth;\n}\n\nvec2 sensor2dTextureCoordinates(float sensorRadius, vec3 pointMC)\n{\n    \n    float t = pointMC.z / sensorRadius;\n    float s = 1.0 + (atan(pointMC.y, pointMC.x) / czm_twoPi);\n    s = s - floor(s);\n\n    return vec2(s, t);\n}\n";

var CustomSensorVolumeFS = "#version 300 es\n\nuniform bool u_showIntersection;\nuniform bool u_showThroughEllipsoid;\n\nuniform float u_sensorRadius;\nuniform float u_normalDirection;\n\nin vec3 v_positionWC;\nin vec3 v_positionEC;\nin vec3 v_normalEC;\n\nvec4 getColor(float sensorRadius, vec3 pointEC)\n{\n    czm_materialInput materialInput;\n\n    vec3 pointMC = (czm_inverseModelView * vec4(pointEC, 1.0)).xyz;\n    materialInput.st = sensor2dTextureCoordinates(sensorRadius, pointMC);\n    materialInput.str = pointMC / sensorRadius;\n\n    vec3 positionToEyeEC = -v_positionEC;\n    materialInput.positionToEyeEC = positionToEyeEC;\n\n    vec3 normalEC = normalize(v_normalEC);\n    materialInput.normalEC = u_normalDirection * normalEC;\n\n    czm_material material = czm_getMaterial(materialInput);\n    return mix(czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC), vec4(material.diffuse, material.alpha), 0.4);\n}\n\nbool isOnBoundary(float value, float epsilon)\n{\n    float width = getIntersectionWidth();\n    float tolerance = width * epsilon;\n\n    float delta = max(abs(dFdx(value)), abs(dFdy(value)));\n    float pixels = width * delta;\n    float temp = abs(value);\n    \n    \n    \n    \n    \n    \n    \n    return temp < tolerance && temp < pixels || (delta < 10.0 * tolerance && temp - delta < tolerance && temp < pixels);\n}\n\nvec4 shade(bool isOnBoundary)\n{\n    if (u_showIntersection && isOnBoundary)\n    {\n        return getIntersectionColor();\n    }\n    return getColor(u_sensorRadius, v_positionEC);\n}\n\nfloat ellipsoidSurfaceFunction(vec3 point)\n{\n    vec3 scaled = czm_ellipsoidInverseRadii * point;\n    return dot(scaled, scaled) - 1.0;\n}\n\nvoid main()\n{\n    vec3 sensorVertexWC = czm_model[3].xyz;      \n    vec3 sensorVertexEC = czm_modelView[3].xyz;  \n\n    float ellipsoidValue = ellipsoidSurfaceFunction(v_positionWC);\n\n    \n    if (!u_showThroughEllipsoid)\n    {\n        \n        \n        if (ellipsoidValue < 0.0)\n        {\n            discard;\n        }\n\n        \n        if (inSensorShadow(sensorVertexWC, v_positionWC))\n        {\n            discard;\n        }\n    }\n\n    \n    \n    if (distance(v_positionEC, sensorVertexEC) > u_sensorRadius)\n    {\n        discard;\n    }\n\n    \n    bool isOnEllipsoid = isOnBoundary(ellipsoidValue, czm_epsilon3);\n    out_FragColor = shade(isOnEllipsoid);\n}\n";

var CustomSensorVolumeVS = "#version 300 es\n\nin vec4 position;\nin vec3 normal;\n\nout vec3 v_positionWC;\nout vec3 v_positionEC;\nout vec3 v_normalEC;\n\nvoid main()\n{\n    gl_Position = czm_modelViewProjection * position;\n    v_positionWC = (czm_model * position).xyz;\n    v_positionEC = (czm_modelView * position).xyz;\n    v_normalEC = czm_normal * normal;\n}\n";

const attributeLocations = {
	position: 0,
	normal: 1
};

const FAR = 5906376272000.0;  // distance from the Sun to Pluto in meters.

/**
 * DOC_TBA
 *
 * @alias CustomSensorVolume
 * @constructor
 */
const CustomSensorVolume = function(options) {
	options = options ?? Frozen.EMPTY_OBJECT;

	this._pickId = undefined;
	this._pickPrimitive = options._pickPrimitive ?? this;

	this._frontFaceColorCommand = new DrawCommand();
	this._backFaceColorCommand = new DrawCommand();
	this._pickCommand = new DrawCommand();

	this._boundingSphere = new BoundingSphere();
	this._boundingSphereWC = new BoundingSphere();

	this._frontFaceColorCommand.primitiveType = PrimitiveType.TRIANGLES;
	this._frontFaceColorCommand.boundingVolume = this._boundingSphereWC;
	this._frontFaceColorCommand.owner = this;

	this._backFaceColorCommand.primitiveType = this._frontFaceColorCommand.primitiveType;
	this._backFaceColorCommand.boundingVolume = this._frontFaceColorCommand.boundingVolume;
	this._backFaceColorCommand.owner = this;

	this._pickCommand.primitiveType = this._frontFaceColorCommand.primitiveType;
	this._pickCommand.boundingVolume = this._frontFaceColorCommand.boundingVolume;
	this._pickCommand.owner = this;

	/**
	 * <code>true</code> if this sensor will be shown; otherwise, <code>false</code>
	 *
	 * @type {Boolean}
	 * @default true
	 */
	this.show = options.show ?? true;

	/**
	 * When <code>true</code>, a polyline is shown where the sensor outline intersections the globe.
	 *
	 * @type {Boolean}
	 *
	 * @default true
	 *
	 * @see CustomSensorVolume#intersectionColor
	 */
	this.showIntersection = options.showIntersection ?? true;

	/**
	 * <p>
	 * Determines if a sensor intersecting the ellipsoid is drawn through the ellipsoid and potentially out
	 * to the other side, or if the part of the sensor intersecting the ellipsoid stops at the ellipsoid.
	 * </p>
	 *
	 * @type {Boolean}
	 * @default false
	 */
	this.showThroughEllipsoid = options.showThroughEllipsoid ?? false;
	this._showThroughEllipsoid = this.showThroughEllipsoid;

	/**
	 * The 4x4 transformation matrix that transforms this sensor from model to world coordinates.  In it's model
	 * coordinates, the sensor's principal direction is along the positive z-axis.  The clock angle, sometimes
	 * called azimuth, is the angle in the sensor's X-Y plane measured from the positive X-axis toward the positive
	 * Y-axis.  The cone angle, sometimes called elevation, is the angle out of the X-Y plane along the positive Z-axis.
	 * <br /><br />
	 * <div align='center'>
	 * <img src='images/CustomSensorVolume.setModelMatrix.png' /><br />
	 * Model coordinate system for a custom sensor
	 * </div>
	 *
	 * @type {Matrix4}
	 * @default {@link Matrix4.IDENTITY}
	 *
	 * @example
	 * // The sensor's vertex is located on the surface at -75.59777 degrees longitude and 40.03883 degrees latitude.
	 * // The sensor's opens upward, along the surface normal.
	 * var center = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883);
	 * sensor.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
	 */
	this.modelMatrix = Matrix4.clone(options.modelMatrix ?? Matrix4.IDENTITY);
	this._modelMatrix = new Matrix4();

	/**
	 * DOC_TBA
	 *
	 * @type {Number}
	 * @default {@link Number.POSITIVE_INFINITY}
	 */
	this.radius = options.radius ?? Number.POSITIVE_INFINITY;

	this._directions = undefined;
	this._directionSegments = undefined;
	this._directionsDirty = false;
	if (defined(options.directionSegments)) {
		this.directionSegments = options.directionSegments;
	} else {
		this.directions = defined(options.directions) ? options.directions : [];
	}

	/**
	 * The surface appearance of the sensor.  This can be one of several built-in {@link Material} objects or a custom material, scripted with
	 * {@link https://github.com/AnalyticalGraphicsInc/cesium/wiki/Fabric|Fabric}.
	 * <p>
	 * The default material is <code>Material.ColorType</code>.
	 * </p>
	 *
	 * @type {Material}
	 * @default Material.fromType(Material.ColorType)
	 *
	 * @see {@link https://github.com/AnalyticalGraphicsInc/cesium/wiki/Fabric|Fabric}
	 *
	 * @example
	 * // 1. Change the color of the default material to yellow
	 * sensor.lateralSurfaceMaterial.uniforms.color = new Cesium.Color(1.0, 1.0, 0.0, 1.0);
	 *
	 * // 2. Change material to horizontal stripes
	 * sensor.lateralSurfaceMaterial = Cesium.Material.fromType(Material.StripeType);
	 */
	this.lateralSurfaceMaterial = defined(options.lateralSurfaceMaterial) ? options.lateralSurfaceMaterial : Material.fromType(Material.ColorType);
	this._lateralSurfaceMaterial = undefined;
	this._translucent = undefined;

	/**
	 * The color of the polyline where the sensor outline intersects the globe.  The default is {@link Color.WHITE}.
	 *
	 * @type {Color}
	 * @default {@link Color.WHITE}
	 *
	 * @see CustomSensorVolume#showIntersection
	 */
	this.intersectionColor = Color.clone(options.intersectionColor ?? Color.WHITE);

	/**
	 * The approximate pixel width of the polyline where the sensor outline intersects the globe.  The default is 5.0.
	 *
	 * @type {Number}
	 * @default 5.0
	 *
	 * @see CustomSensorVolume#showIntersection
	 */
	this.intersectionWidth = options.intersectionWidth ?? 5.0;

	/**
	 * User-defined object returned when the sensors is picked.
	 *
	 * @type Object
	 *
	 * @default undefined
	 *
	 * @see Scene#pick
	 */
	this.id = options.id;
	this._id = undefined;

	var that = this;

	/* eslint-disable camelcase */
	this._uniforms = {
		u_showThroughEllipsoid: function() {
			return that.showThroughEllipsoid;
		},
		u_showIntersection: function() {
			return that.showIntersection;
		},
		u_sensorRadius: function() {
			return isFinite(that.radius) ? that.radius : FAR;
		},
		u_intersectionColor: function() {
			return that.intersectionColor;
		},
		u_intersectionWidth: function() {
			return that.intersectionWidth;
		},
		u_normalDirection: function() {
			return 1.0;
		}
	};
	/* eslint-enable camelcase */

	this._mode = SceneMode.SCENE3D;
};

Object.defineProperties(CustomSensorVolume.prototype, {
	directions: {
		get: function() {
			return this._directions;
		},
		set: function(value) {
			this._directions = value;
			this._directionSegments = undefined;
			this._directionsDirty = true;
		}
	},
	directionSegments: {
		get: function() {
			return this._directionSegments;
		},
		set: function(value) {
			this._directionSegments = value;
			this._directionsDirty = true;
		}
	}
});

function getDirectionSegments(customSensorVolume) {
	if (defined(customSensorVolume._directionSegments)) {
		return customSensorVolume._directionSegments;
	}

	return [{
		directions: customSensorVolume._directions,
		closed: true
	}];
}

function isClosedSegment(segment) {
	return segment.closed !== false;
}

function isRenderableSegment(segment) {
	var directions = segment.directions;
	if (!defined(directions)) {
		return false;
	}

	var length = directions.length;
	return isClosedSegment(segment) ? length >= 3 : length >= 2;
}

const previousScratch = new Cartesian3();
const currentScratch = new Cartesian3();
const nextScratch = new Cartesian3();
function computeSegmentPositions(segment, r, boundingVolumePositions) {
	var directions = segment.directions;
	var length = directions.length;
	var closed = isClosedSegment(segment);
	var positions = new Array(length);

	for (var j = 0; j < length; j++) {
		var current = Cartesian3.fromSpherical(directions[j], currentScratch);
		var theta = 0.0;

		if (closed || j > 0) {
			var previousIndex = j === 0 ? length - 1 : j - 1;
			var previous = Cartesian3.fromSpherical(directions[previousIndex], previousScratch);
			theta = Math.max(theta, Cartesian3.angleBetween(previous, current));
		}

		if (closed || j < length - 1) {
			var nextIndex = j === length - 1 ? 0 : j + 1;
			var next = Cartesian3.fromSpherical(directions[nextIndex], nextScratch);
			theta = Math.max(theta, Cartesian3.angleBetween(current, next));
		}

		// Extend position so the volume encompasses the sensor's radius.
		var distance = r / Math.cos(theta * 0.5);
		var p = Cartesian3.multiplyByScalar(current, distance, new Cartesian3());
		positions[j] = p;
		boundingVolumePositions.push(p);
	}

	return positions;
}

function computeRenderableSegments(customSensorVolume) {
	var directionSegments = getDirectionSegments(customSensorVolume);
	var r = isFinite(customSensorVolume.radius) ? customSensorVolume.radius : FAR;

	var boundingVolumePositions = [Cartesian3.ZERO];
	var renderableSegments = [];
	var edgeCount = 0;

	for (var i = 0; i < directionSegments.length; i++) {
		var segment = directionSegments[i];
		if (isRenderableSegment(segment)) {
			var positions = computeSegmentPositions(segment, r, boundingVolumePositions);
			var closed = isClosedSegment(segment);
			renderableSegments.push({
				positions: positions,
				closed: closed
			});
			edgeCount += closed ? positions.length : positions.length - 1;
		}
	}

	BoundingSphere.fromPoints(boundingVolumePositions, customSensorVolume._boundingSphere);

	return {
		edgeCount: edgeCount,
		segments: renderableSegments
	};
}

const nScratch = new Cartesian3();
function writeEdge(vertices, k, p0, p1) {
	var n = Cartesian3.normalize(Cartesian3.cross(p1, p0, nScratch), nScratch); // Per-face normals

	vertices[k++] = 0.0; // Sensor vertex
	vertices[k++] = 0.0;
	vertices[k++] = 0.0;
	vertices[k++] = n.x;
	vertices[k++] = n.y;
	vertices[k++] = n.z;

	vertices[k++] = p1.x;
	vertices[k++] = p1.y;
	vertices[k++] = p1.z;
	vertices[k++] = n.x;
	vertices[k++] = n.y;
	vertices[k++] = n.z;

	vertices[k++] = p0.x;
	vertices[k++] = p0.y;
	vertices[k++] = p0.z;
	vertices[k++] = n.x;
	vertices[k++] = n.y;
	vertices[k++] = n.z;

	return k;
}

function createVertexArray(customSensorVolume, context) {
	var renderableSegments = computeRenderableSegments(customSensorVolume);
	if (renderableSegments.edgeCount === 0) {
		return undefined;
	}

	var vertices = new Float32Array(2 * 3 * 3 * renderableSegments.edgeCount);

	var k = 0;
	var segments = renderableSegments.segments;
	for (var i = 0; i < segments.length; i++) {
		var positions = segments[i].positions;
		var length = positions.length;
		if (segments[i].closed) {
			for (var previousIndex = length - 1, currentIndex = 0; currentIndex < length; previousIndex = currentIndex++) {
				k = writeEdge(vertices, k, positions[previousIndex], positions[currentIndex]);
			}
		} else {
			for (var j = 1; j < length; j++) {
				k = writeEdge(vertices, k, positions[j - 1], positions[j]);
			}
		}
	}

	var vertexBuffer = Buffer.createVertexBuffer({
		context: context,
		typedArray: new Float32Array(vertices),
		usage: BufferUsage.STATIC_DRAW
	});

	var stride = 2 * 3 * Float32Array.BYTES_PER_ELEMENT;

	var attributes = [{
		index: attributeLocations.position,
		vertexBuffer: vertexBuffer,
		componentsPerAttribute: 3,
		componentDatatype: ComponentDatatype.FLOAT,
		offsetInBytes: 0,
		strideInBytes: stride
	}, {
		index: attributeLocations.normal,
		vertexBuffer: vertexBuffer,
		componentsPerAttribute: 3,
		componentDatatype: ComponentDatatype.FLOAT,
		offsetInBytes: 3 * Float32Array.BYTES_PER_ELEMENT,
		strideInBytes: stride
	}];

	return new VertexArray({
		context: context,
		attributes: attributes
	});
}

/**
 * Called when {@link Viewer} or {@link CesiumWidget} render the scene to
 * get the draw commands needed to render this primitive.
 * <p>
 * Do not call this function directly.  This is documented just to
 * list the exceptions that may be propagated when the scene is rendered:
 * </p>
 *
 * @exception {DeveloperError} this.radius must be greater than or equal to zero.
 * @exception {DeveloperError} this.lateralSurfaceMaterial must be defined.
 */
// eslint-disable-next-line complexity
CustomSensorVolume.prototype.update = function(frameState) {
	this._mode = frameState.mode;
	if (!this.show || this._mode !== SceneMode.SCENE3D) {
		return;
	}

	var context = frameState.context;
	var commandList = frameState.commandList;

	// >>includeStart('debug', pragmas.debug);
	if (this.radius < 0.0) {
		throw new DeveloperError('this.radius must be greater than or equal to zero.');
	}
	if (!defined(this.lateralSurfaceMaterial)) {
		throw new DeveloperError('this.lateralSurfaceMaterial must be defined.');
	}
	// >>includeEnd('debug');

	var translucent = this.lateralSurfaceMaterial.isTranslucent();

	// Initial render state creation
	if ((this._showThroughEllipsoid !== this.showThroughEllipsoid) ||
		(!defined(this._frontFaceColorCommand.renderState)) ||
		(this._translucent !== translucent)
	) {
		this._showThroughEllipsoid = this.showThroughEllipsoid;
		this._translucent = translucent;

		var rs;

		if (translucent) {
			rs = RenderState.fromCache({
				depthTest: {
					// This would be better served by depth testing with a depth buffer that does not
					// include the ellipsoid depth - or a g-buffer containing an ellipsoid mask
					// so we can selectively depth test.
					enabled: !this.showThroughEllipsoid
				},
				depthMask: false,
				blending: BlendingState.ALPHA_BLEND,
				cull: {
					enabled: true,
					face: CullFace.BACK
				}
			});

			this._frontFaceColorCommand.renderState = rs;
			this._frontFaceColorCommand.pass = Pass.TRANSLUCENT;

			rs = RenderState.fromCache({
				depthTest: {
					enabled: !this.showThroughEllipsoid
				},
				depthMask: false,
				blending: BlendingState.ALPHA_BLEND,
				cull: {
					enabled: true,
					face: CullFace.FRONT
				}
			});

			this._backFaceColorCommand.renderState = rs;
			this._backFaceColorCommand.pass = Pass.TRANSLUCENT;

			rs = RenderState.fromCache({
				depthTest: {
					enabled: !this.showThroughEllipsoid
				},
				depthMask: false,
				blending: BlendingState.ALPHA_BLEND
			});
			this._pickCommand.renderState = rs;
		} else {
			rs = RenderState.fromCache({
				depthTest: {
					enabled: true
				},
				depthMask: true
			});
			this._frontFaceColorCommand.renderState = rs;
			this._frontFaceColorCommand.pass = Pass.OPAQUE;

			rs = RenderState.fromCache({
				depthTest: {
					enabled: true
				},
				depthMask: true
			});
			this._pickCommand.renderState = rs;
		}
	}

	// Recreate vertex buffer when directions change
	var directionsChanged = this._directionsDirty;
	if (directionsChanged) {
		this._directionsDirty = false;

		var vertexArray = this._frontFaceColorCommand.vertexArray;
		if (defined(vertexArray)) {
			vertexArray.destroy();
		}
		this._frontFaceColorCommand.vertexArray = undefined;
		this._backFaceColorCommand.vertexArray = undefined;
		this._pickCommand.vertexArray = undefined;

		vertexArray = createVertexArray(this, context);
		if (defined(vertexArray)) {
			this._frontFaceColorCommand.vertexArray = vertexArray;
			this._backFaceColorCommand.vertexArray = vertexArray;
			this._pickCommand.vertexArray = vertexArray;
		}
	}

	if (!defined(this._frontFaceColorCommand.vertexArray)) {
		return;
	}

	var pass = frameState.passes;

	var modelMatrixChanged = !Matrix4.equals(this.modelMatrix, this._modelMatrix);
	if (modelMatrixChanged) {
		Matrix4.clone(this.modelMatrix, this._modelMatrix);
	}

	if (directionsChanged || modelMatrixChanged) {
		BoundingSphere.transform(this._boundingSphere, this.modelMatrix, this._boundingSphereWC);
	}

	this._frontFaceColorCommand.modelMatrix = this.modelMatrix;
	this._backFaceColorCommand.modelMatrix = this._frontFaceColorCommand.modelMatrix;
	this._pickCommand.modelMatrix = this._frontFaceColorCommand.modelMatrix;

	var materialChanged = this._lateralSurfaceMaterial !== this.lateralSurfaceMaterial;
	this._lateralSurfaceMaterial = this.lateralSurfaceMaterial;
	this._lateralSurfaceMaterial.update(context);

	if (pass.render) {
		var frontFaceColorCommand = this._frontFaceColorCommand;
		var backFaceColorCommand = this._backFaceColorCommand;

		// Recompile shader when material changes
		if (materialChanged || !defined(frontFaceColorCommand.shaderProgram)) {
			var fsSource = new ShaderSource({
				sources: [SensorVolume, this._lateralSurfaceMaterial.shaderSource, CustomSensorVolumeFS]
			});

			frontFaceColorCommand.shaderProgram = ShaderProgram.replaceCache({
				context: context,
				shaderProgram: frontFaceColorCommand.shaderProgram,
				vertexShaderSource: CustomSensorVolumeVS,
				fragmentShaderSource: fsSource,
				attributeLocations: attributeLocations
			});

			frontFaceColorCommand.uniformMap = combine(this._uniforms, this._lateralSurfaceMaterial._uniforms);

			backFaceColorCommand.shaderProgram = frontFaceColorCommand.shaderProgram;
			backFaceColorCommand.uniformMap = combine(this._uniforms, this._lateralSurfaceMaterial._uniforms);
			// eslint-disable-next-line camelcase
			backFaceColorCommand.uniformMap.u_normalDirection = function() {
				return -1.0;
			};
		}

		if (translucent) {
			commandList.push(this._backFaceColorCommand, this._frontFaceColorCommand);
		} else {
			commandList.push(this._frontFaceColorCommand);
		}
	}

	if (pass.pick) {
		var pickCommand = this._pickCommand;

		if (!defined(this._pickId) || (this._id !== this.id)) {
			this._id = this.id;
			this._pickId = this._pickId && this._pickId.destroy();
			this._pickId = context.createPickId({
				primitive: this._pickPrimitive,
				id: this.id
			});
		}

		// Recompile shader when material changes
		if (materialChanged || !defined(pickCommand.shaderProgram)) {
			var pickFS = new ShaderSource({
				sources: [SensorVolume, this._lateralSurfaceMaterial.shaderSource, CustomSensorVolumeFS],
				pickColorQualifier: 'uniform'
			});

			pickCommand.shaderProgram = ShaderProgram.replaceCache({
				context: context,
				shaderProgram: pickCommand.shaderProgram,
				vertexShaderSource: CustomSensorVolumeVS,
				fragmentShaderSource: pickFS,
				attributeLocations: attributeLocations
			});

			var that = this;
			var uniforms = {
				// eslint-disable-next-line camelcase
				czm_pickColor: function() {
					return that._pickId.color;
				}
			};
			pickCommand.uniformMap = combine(combine(this._uniforms, this._lateralSurfaceMaterial._uniforms), uniforms);
		}

		pickCommand.pass = translucent ? Pass.TRANSLUCENT : Pass.OPAQUE;
		commandList.push(pickCommand);
	}
};

/**
 * DOC_TBA
 */
CustomSensorVolume.prototype.isDestroyed = function() {
	return false;
};

/**
 * DOC_TBA
 */
CustomSensorVolume.prototype.destroy = function() {
	this._frontFaceColorCommand.vertexArray = this._frontFaceColorCommand.vertexArray && this._frontFaceColorCommand.vertexArray.destroy();
	this._frontFaceColorCommand.shaderProgram = this._frontFaceColorCommand.shaderProgram && this._frontFaceColorCommand.shaderProgram.destroy();
	this._pickCommand.shaderProgram = this._pickCommand.shaderProgram && this._pickCommand.shaderProgram.destroy();
	this._pickId = this._pickId && this._pickId.destroy();
	return destroyObject(this);
};

function removePrimitive(entity, hash, primitives) {
	var data = hash[entity.id];
	if (defined(data)) {
		var primitive = data.primitive;
		primitives.remove(primitive);
		if (!primitive.isDestroyed()) {
			primitive.destroy();
		}
		delete hash[entity.id];
	}
}

const defaultIntersectionColor$3 = Color.WHITE;
const defaultIntersectionWidth$3 = 1.0;
const defaultRadius$3 = Number.POSITIVE_INFINITY;

const matrix3Scratch$3 = new Matrix3();
const cachedPosition$3 = new Cartesian3();
const cachedOrientation$3 = new Quaternion();

function assignSpherical$2(index, array, clock, cone) {
	var spherical = array[index];
	if (!defined(spherical)) {
		spherical = new Spherical();
		array[index] = spherical;
	}
	spherical.clock = clock;
	spherical.cone = cone;
	spherical.magnitude = 1.0;
}

function createCircularDirections(cone, reverse) {
	var angleStep = Math$1.toRadians(2.0);
	var sampleCount = Math.ceil(Math$1.TWO_PI / angleStep);
	var clockStep = Math$1.TWO_PI / sampleCount;
	var directions = new Array(sampleCount);
	for (var i = 0; i < sampleCount; i++) {
		var clock = (reverse ? sampleCount - i - 1 : i) * clockStep;
		assignSpherical$2(i, directions, clock, cone);
	}
	return directions;
}

// eslint-disable-next-line max-params
function computeDirections(primitive, minimumClockAngle, maximumClockAngle, innerHalfAngle, outerHalfAngle) {
	var directions = primitive.directions;
	var angle;
	var i = 0;
	var angleStep = Math$1.toRadians(2.0);
	if (minimumClockAngle === 0.0 && maximumClockAngle === Math$1.TWO_PI) {
		if (innerHalfAngle) {
			primitive.directionSegments = [{
				directions: createCircularDirections(outerHalfAngle, false),
				closed: true
			}, {
				directions: createCircularDirections(innerHalfAngle, true),
				closed: true
			}];
			return;
		}

		for (angle = 0.0; angle < Math$1.TWO_PI; angle += angleStep) {
			assignSpherical$2(i++, directions, angle, outerHalfAngle);
		}
	} else {
		// There are clock angle limits.
		for (angle = minimumClockAngle; angle < maximumClockAngle; angle += angleStep) {
			assignSpherical$2(i++, directions, angle, outerHalfAngle);
		}
		assignSpherical$2(i++, directions, maximumClockAngle, outerHalfAngle);
		if (innerHalfAngle) {
			for (angle = maximumClockAngle; angle > minimumClockAngle; angle -= angleStep) {
				assignSpherical$2(i++, directions, angle, innerHalfAngle);
			}
			assignSpherical$2(i++, directions, minimumClockAngle, innerHalfAngle);
		} else {
			assignSpherical$2(i++, directions, maximumClockAngle, 0.0);
		}
	}
	directions.length = i;
	primitive.directions = directions;
}

/**
 * A {@link Visualizer} which maps {@link Entity#conicSensor} to a {@link ConicSensor}.
 * @alias ConicSensorVisualizer
 * @constructor
 *
 * @param {Scene} scene The scene the primitives will be rendered in.
 * @param {EntityCollection} entityCollection The entityCollection to visualize.
 */
const ConicSensorVisualizer = function(scene, entityCollection) {
	// >>includeStart('debug', pragmas.debug);
	if (!defined(scene)) {
		throw new DeveloperError('scene is required.');
	}
	if (!defined(entityCollection)) {
		throw new DeveloperError('entityCollection is required.');
	}
	// >>includeEnd('debug');

	entityCollection.collectionChanged.addEventListener(ConicSensorVisualizer.prototype._onCollectionChanged, this);

	this._scene = scene;
	this._primitives = scene.primitives;
	this._entityCollection = entityCollection;
	this._hash = {};
	this._entitiesToVisualize = new AssociativeArray();

	this._onCollectionChanged(entityCollection, entityCollection.values, [], []);
};

/**
 * Updates the primitives created by this visualizer to match their
 * Entity counterpart at the given time.
 *
 * @param {JulianDate} time The time to update to.
 * @returns {Boolean} This function always returns true.
 */
ConicSensorVisualizer.prototype.update = function(time) {
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
		var conicSensorGraphics = entity._conicSensor;

		var position;
		var orientation;
		var data = hash[entity.id];
		var show = entity.isShowing && entity.isAvailable(time) && Property.getValueOrDefault(conicSensorGraphics._show, time, true);

		if (show) {
			position = Property.getValueOrUndefined(entity._position, time, cachedPosition$3);
			orientation = Property.getValueOrUndefined(entity._orientation, time, cachedOrientation$3);
			show = defined(position) && defined(orientation);
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
			primitive = new CustomSensorVolume();
			primitive.id = entity;
			primitives.add(primitive);

			data = {
				primitive: primitive,
				position: undefined,
				orientation: undefined,
				minimumClockAngle: undefined,
				maximumClockAngle: undefined,
				innerHalfAngle: undefined,
				outerHalfAngle: undefined
			};
			hash[entity.id] = data;
		}

		if (!Cartesian3.equals(position, data.position) || !Quaternion.equals(orientation, data.orientation)) {
			Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(orientation, matrix3Scratch$3), position, primitive.modelMatrix);
			data.position = Cartesian3.clone(position, data.position);
			data.orientation = Quaternion.clone(orientation, data.orientation);
		}

		primitive.show = true;
		var minimumClockAngle = Property.getValueOrDefault(conicSensorGraphics._minimumClockAngle, time, 0);
		var maximumClockAngle = Property.getValueOrDefault(conicSensorGraphics._maximumClockAngle, time, Math$1.TWO_PI);
		var innerHalfAngle = Property.getValueOrDefault(conicSensorGraphics._innerHalfAngle, time, 0);
		var outerHalfAngle = Property.getValueOrDefault(conicSensorGraphics._outerHalfAngle, time, Math.PI);

		if (minimumClockAngle !== data.minimumClockAngle ||
			maximumClockAngle !== data.maximumClockAngle ||
			innerHalfAngle !== data.innerHalfAngle ||
			outerHalfAngle !== data.outerHalfAngle
		) {
			computeDirections(primitive, minimumClockAngle, maximumClockAngle, innerHalfAngle, outerHalfAngle);
			data.innerHalfAngle = innerHalfAngle;
			data.maximumClockAngle = maximumClockAngle;
			data.outerHalfAngle = outerHalfAngle;
			data.minimumClockAngle = minimumClockAngle;
		}

		primitive.radius = Property.getValueOrDefault(conicSensorGraphics._radius, time, defaultRadius$3);
		primitive.lateralSurfaceMaterial = MaterialProperty.getValue(time, conicSensorGraphics._lateralSurfaceMaterial, primitive.lateralSurfaceMaterial);
		primitive.intersectionColor = Property.getValueOrClonedDefault(conicSensorGraphics._intersectionColor, time, defaultIntersectionColor$3, primitive.intersectionColor);
		primitive.intersectionWidth = Property.getValueOrDefault(conicSensorGraphics._intersectionWidth, time, defaultIntersectionWidth$3);
	}
	return true;
};

/**
 * Returns true if this object was destroyed; otherwise, false.
 *
 * @returns {Boolean} True if this object was destroyed; otherwise, false.
 */
ConicSensorVisualizer.prototype.isDestroyed = function() {
	return false;
};

/**
 * Removes and destroys all primitives created by this instance.
 */
ConicSensorVisualizer.prototype.destroy = function() {
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
ConicSensorVisualizer.prototype._onCollectionChanged = function(entityCollection, added, removed, changed) {
	var i;
	var entity;
	var entities = this._entitiesToVisualize;
	var hash = this._hash;
	var primitives = this._primitives;

	for (i = added.length - 1; i > -1; i--) {
		entity = added[i];
		if (defined(entity._conicSensor) && defined(entity._position) && defined(entity._orientation)) {
			entities.set(entity.id, entity);
		}
	}

	for (i = changed.length - 1; i > -1; i--) {
		entity = changed[i];
		if (defined(entity._conicSensor) && defined(entity._position) && defined(entity._orientation)) {
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

/**
 * An optionally time-dynamic custom patterned sensor.
 *
 * @alias CustomPatternSensorGraphics
 * @constructor
 */
const CustomPatternSensorGraphics = function(options) {
	this._directions = undefined;
	this._directionsSubscription = undefined;

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

Object.defineProperties(CustomPatternSensorGraphics.prototype, {
	/**
	 * Gets the event that is raised whenever a new property is assigned.
	 * @memberof CustomPatternSensorGraphics.prototype
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
	 * A {@link Property} which returns an array of {@link Spherical} instances representing the sensor's projection.
	 * @memberof CustomPatternSensorGraphics.prototype
	 * @type {Property}
	 */
	directions: createPropertyDescriptor('directions'),

	/**
	 * Gets or sets the {@link MaterialProperty} specifying the the sensor's appearance.
	 * @memberof CustomPatternSensorGraphics.prototype
	 * @type {MaterialProperty}
	 */
	lateralSurfaceMaterial: createMaterialPropertyDescriptor('lateralSurfaceMaterial'),

	/**
	 * Gets or sets the {@link Color} {@link Property} specifying the color of the line formed by the intersection of the sensor and other central bodies.
	 * @memberof CustomPatternSensorGraphics.prototype
	 * @type {Property}
	 */
	intersectionColor: createPropertyDescriptor('intersectionColor'),

	/**
	 * Gets or sets the numeric {@link Property} specifying the width of the line formed by the intersection of the sensor and other central bodies.
	 * @memberof CustomPatternSensorGraphics.prototype
	 * @type {Property}
	 */
	intersectionWidth: createPropertyDescriptor('intersectionWidth'),

	/**
	 * Gets or sets the boolean {@link Property} specifying the visibility of the line formed by the intersection of the sensor and other central bodies.
	 * @memberof CustomPatternSensorGraphics.prototype
	 * @type {Property}
	 */
	showIntersection: createPropertyDescriptor('showIntersection'),

	/**
	 * Gets or sets the numeric {@link Property} specifying the radius of the sensor's projection.
	 * @memberof CustomPatternSensorGraphics.prototype
	 * @type {Property}
	 */
	radius: createPropertyDescriptor('radius'),

	/**
	 * Gets or sets the boolean {@link Property} specifying the visibility of the sensor.
	 * @memberof CustomPatternSensorGraphics.prototype
	 * @type {Property}
	 */
	show: createPropertyDescriptor('show')
});

/**
 * Duplicates a CustomPatternSensorGraphics instance.
 *
 * @param {CustomPatternSensorGraphics} [result] The object onto which to store the result.
 * @returns {CustomPatternSensorGraphics} The modified result parameter or a new instance if one was not provided.
 */
CustomPatternSensorGraphics.prototype.clone = function(result) {
	if (!defined(result)) {
		result = new CustomPatternSensorGraphics();
	}
	result.directions = this.directions;
	result.radius = this.radius;
	result.show = this.show;
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
 * @param {CustomPatternSensorGraphics} source The object to be merged into this object.
 */
CustomPatternSensorGraphics.prototype.merge = function(source) {
	// >>includeStart('debug', pragmas.debug);
	if (!defined(source)) {
		throw new DeveloperError('source is required.');
	}
	// >>includeEnd('debug');

	this.directions = this.directions ?? source.directions;
	this.radius = this.radius ?? source.radius;
	this.show = this.show ?? source.show;
	this.showIntersection = this.showIntersection ?? source.showIntersection;
	this.intersectionColor = this.intersectionColor ?? source.intersectionColor;
	this.intersectionWidth = this.intersectionWidth ?? source.intersectionWidth;
	this.lateralSurfaceMaterial = this.lateralSurfaceMaterial ?? source.lateralSurfaceMaterial;
};

const defaultIntersectionColor$2 = Color.WHITE;
const defaultIntersectionWidth$2 = 1.0;
const defaultRadius$2 = Number.POSITIVE_INFINITY;

const matrix3Scratch$2 = new Matrix3();
const cachedPosition$2 = new Cartesian3();
const cachedOrientation$2 = new Quaternion();

/**
 * A {@link Visualizer} which maps {@link Entity#customPatternSensor} to a {@link CustomPatternSensor}.
 * @alias CustomPatternSensorVisualizer
 * @constructor
 *
 * @param {Scene} scene The scene the primitives will be rendered in.
 * @param {EntityCollection} entityCollection The entityCollection to visualize.
 */
const CustomPatternSensorVisualizer = function(scene, entityCollection) {
	// >>includeStart('debug', pragmas.debug);
	if (!defined(scene)) {
		throw new DeveloperError('scene is required.');
	}
	if (!defined(entityCollection)) {
		throw new DeveloperError('entityCollection is required.');
	}
	// >>includeEnd('debug');

	entityCollection.collectionChanged.addEventListener(CustomPatternSensorVisualizer.prototype._onCollectionChanged, this);

	this._scene = scene;
	this._primitives = scene.primitives;
	this._entityCollection = entityCollection;
	this._hash = {};
	this._entitiesToVisualize = new AssociativeArray();

	this._onCollectionChanged(entityCollection, entityCollection.values, [], []);
};

/**
 * Updates the primitives created by this visualizer to match their
 * Entity counterpart at the given time.
 *
 * @param {JulianDate} time The time to update to.
 * @returns {Boolean} This function always returns true.
 */
CustomPatternSensorVisualizer.prototype.update = function(time) {
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
		var customPatternSensorGraphics = entity._customPatternSensor;

		var position;
		var orientation;
		var directions;
		var data = hash[entity.id];
		var show = entity.isShowing && entity.isAvailable(time) && Property.getValueOrDefault(customPatternSensorGraphics._show, time, true);

		if (show) {
			position = Property.getValueOrUndefined(entity._position, time, cachedPosition$2);
			orientation = Property.getValueOrUndefined(entity._orientation, time, cachedOrientation$2);
			directions = Property.getValueOrUndefined(customPatternSensorGraphics._directions, time);
			show = defined(position) && defined(orientation) && defined(directions);
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
			primitive = new CustomSensorVolume();
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
			Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(orientation, matrix3Scratch$2), position, primitive.modelMatrix);
			data.position = Cartesian3.clone(position, data.position);
			data.orientation = Quaternion.clone(orientation, data.orientation);
		}

		primitive.show = true;
		primitive.directions = directions;
		primitive.radius = Property.getValueOrDefault(customPatternSensorGraphics._radius, time, defaultRadius$2);
		primitive.lateralSurfaceMaterial = MaterialProperty.getValue(time, customPatternSensorGraphics._lateralSurfaceMaterial, primitive.lateralSurfaceMaterial);
		primitive.intersectionColor = Property.getValueOrClonedDefault(customPatternSensorGraphics._intersectionColor, time, defaultIntersectionColor$2, primitive.intersectionColor);
		primitive.intersectionWidth = Property.getValueOrDefault(customPatternSensorGraphics._intersectionWidth, time, defaultIntersectionWidth$2);
	}
	return true;
};

/**
 * Returns true if this object was destroyed; otherwise, false.
 *
 * @returns {Boolean} True if this object was destroyed; otherwise, false.
 */
CustomPatternSensorVisualizer.prototype.isDestroyed = function() {
	return false;
};

/**
 * Removes and destroys all primitives created by this instance.
 */
CustomPatternSensorVisualizer.prototype.destroy = function() {
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
CustomPatternSensorVisualizer.prototype._onCollectionChanged = function(entityCollection, added, removed, changed) {
	var i;
	var entity;
	var entities = this._entitiesToVisualize;
	var hash = this._hash;
	var primitives = this._primitives;

	for (i = added.length - 1; i > -1; i--) {
		entity = added[i];
		if (defined(entity._customPatternSensor) && defined(entity._position) && defined(entity._orientation)) {
			entities.set(entity.id, entity);
		}
	}

	for (i = changed.length - 1; i > -1; i--) {
		entity = changed[i];
		if (defined(entity._customPatternSensor) && defined(entity._position) && defined(entity._orientation)) {
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

/**
 * An optionally time-dynamic pyramid.
 *
 * @alias RectangularSensorGraphics
 * @constructor
 */
const RectangularSensorGraphics = function() {
	this._xHalfAngle = undefined;
	this._xHalfAngleSubscription = undefined;
	this._yHalfAngle = undefined;
	this._yHalfAngleSubscription = undefined;

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
};

Object.defineProperties(RectangularSensorGraphics.prototype, {
	/**
	 * Gets the event that is raised whenever a new property is assigned.
	 * @memberof RectangularSensorGraphics.prototype
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
	 * A {@link Property} which returns an array of {@link Spherical} instances representing the pyramid's projection.
	 * @memberof RectangularSensorGraphics.prototype
	 * @type {Property}
	 */
	xHalfAngle: createPropertyDescriptor('xHalfAngle'),

	/**
	 * A {@link Property} which returns an array of {@link Spherical} instances representing the pyramid's projection.
	 * @memberof RectangularSensorGraphics.prototype
	 * @type {Property}
	 */
	yHalfAngle: createPropertyDescriptor('yHalfAngle'),

	/**
	 * Gets or sets the {@link MaterialProperty} specifying the the pyramid's appearance.
	 * @memberof RectangularSensorGraphics.prototype
	 * @type {MaterialProperty}
	 */
	lateralSurfaceMaterial: createPropertyDescriptor('lateralSurfaceMaterial'),

	/**
	 * Gets or sets the {@link Color} {@link Property} specifying the color of the line formed by the intersection of the pyramid and other central bodies.
	 * @memberof RectangularSensorGraphics.prototype
	 * @type {Property}
	 */
	intersectionColor: createPropertyDescriptor('intersectionColor'),

	/**
	 * Gets or sets the numeric {@link Property} specifying the width of the line formed by the intersection of the pyramid and other central bodies.
	 * @memberof RectangularSensorGraphics.prototype
	 * @type {Property}
	 */
	intersectionWidth: createPropertyDescriptor('intersectionWidth'),

	/**
	 * Gets or sets the boolean {@link Property} specifying the visibility of the line formed by the intersection of the pyramid and other central bodies.
	 * @memberof RectangularSensorGraphics.prototype
	 * @type {Property}
	 */
	showIntersection: createPropertyDescriptor('showIntersection'),

	/**
	 * Gets or sets the numeric {@link Property} specifying the radius of the pyramid's projection.
	 * @memberof RectangularSensorGraphics.prototype
	 * @type {Property}
	 */
	radius: createPropertyDescriptor('radius'),

	/**
	 * Gets or sets the boolean {@link Property} specifying the visibility of the pyramid.
	 * @memberof RectangularSensorGraphics.prototype
	 * @type {Property}
	 */
	show: createPropertyDescriptor('show')
});

/**
 * Duplicates a RectangularSensorGraphics instance.
 *
 * @param {RectangularSensorGraphics} [result] The object onto which to store the result.
 * @returns {RectangularSensorGraphics} The modified result parameter or a new instance if one was not provided.
 */
RectangularSensorGraphics.prototype.clone = function(result) {
	if (!defined(result)) {
		result = new RectangularSensorGraphics();
	}
	result.xHalfAngle = this.xHalfAngle;
	result.yHalfAngle = this.yHalfAngle;
	result.radius = this.radius;
	result.show = this.show;
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
 * @param {RectangularSensorGraphics} source The object to be merged into this object.
 */
RectangularSensorGraphics.prototype.merge = function(source) {
	// >>includeStart('debug', pragmas.debug);
	if (!defined(source)) {
		throw new DeveloperError('source is required.');
	}
	// >>includeEnd('debug');

	this.xHalfAngle = this.xHalfAngle ?? source.xHalfAngle;
	this.yHalfAngle = this.yHalfAngle ?? source.yHalfAngle;
	this.radius = this.radius ?? source.radius;
	this.show = this.show ?? source.show;
	this.showIntersection = this.showIntersection ?? source.showIntersection;
	this.intersectionColor = this.intersectionColor ?? source.intersectionColor;
	this.intersectionWidth = this.intersectionWidth ?? source.intersectionWidth;
	this.lateralSurfaceMaterial = this.lateralSurfaceMaterial ?? source.lateralSurfaceMaterial;
};

function assignSpherical$1(index, array, clock, cone) {
	var spherical = array[index];
	if (!defined(spherical)) {
		spherical = new Spherical();
		array[index] = spherical;
	}
	spherical.clock = clock;
	spherical.cone = cone;
	spherical.magnitude = 1.0;
}

function updateDirections$1(rectangularSensor) {
	var directions = rectangularSensor._customSensor.directions;

	// At 90 degrees the sensor is completely open, and tan() goes to infinity.
	var tanX = Math.tan(Math.min(rectangularSensor._xHalfAngle, Math$1.toRadians(89.0)));
	var tanY = Math.tan(Math.min(rectangularSensor._yHalfAngle, Math$1.toRadians(89.0)));
	var theta = Math.atan(tanX / tanY);
	var cone = Math.atan(Math.sqrt((tanX * tanX) + (tanY * tanY)));

	assignSpherical$1(0, directions, theta, cone);
	assignSpherical$1(1, directions, Math$1.toRadians(180.0) - theta, cone);
	assignSpherical$1(2, directions, Math$1.toRadians(180.0) + theta, cone);
	assignSpherical$1(3, directions, -theta, cone);

	directions.length = 4;
	rectangularSensor._customSensor.directions = directions;
}

const RectangularPyramidSensorVolume = function(options) {
	options = options ?? Frozen.EMPTY_OBJECT;

	var customSensorOptions = clone(options);
	customSensorOptions._pickPrimitive = options._pickPrimitive ?? this;
	customSensorOptions.directions = undefined;
	this._customSensor = new CustomSensorVolume(customSensorOptions);

	this._xHalfAngle = options.xHalfAngle ?? Math$1.PI_OVER_TWO;
	this._yHalfAngle = options.yHalfAngle ?? Math$1.PI_OVER_TWO;

	updateDirections$1(this);
};

Object.defineProperties(RectangularPyramidSensorVolume.prototype, {
	xHalfAngle: {
		get: function() {
			return this._xHalfAngle;
		},
		set: function(value) {
			// >>includeStart('debug', pragmas.debug)
			if (value > Math$1.PI_OVER_TWO) {
				throw new DeveloperError('xHalfAngle must be less than or equal to 90 degrees.');
			}
			// >>includeEnd('debug');

			if (this._xHalfAngle !== value) {
				this._xHalfAngle = value;
				updateDirections$1(this);
			}
		}
	},
	yHalfAngle: {
		get: function() {
			return this._yHalfAngle;
		},
		set: function(value) {
			// >>includeStart('debug', pragmas.debug)
			if (value > Math$1.PI_OVER_TWO) {
				throw new DeveloperError('yHalfAngle must be less than or equal to 90 degrees.');
			}
			// >>includeEnd('debug');

			if (this._yHalfAngle !== value) {
				this._yHalfAngle = value;
				updateDirections$1(this);
			}
		}
	},
	show: {
		get: function() {
			return this._customSensor.show;
		},
		set: function(value) {
			this._customSensor.show = value;
		}
	},
	showIntersection: {
		get: function() {
			return this._customSensor.showIntersection;
		},
		set: function(value) {
			this._customSensor.showIntersection = value;
		}
	},
	showThroughEllipsoid: {
		get: function() {
			return this._customSensor.showThroughEllipsoid;
		},
		set: function(value) {
			this._customSensor.showThroughEllipsoid = value;
		}
	},
	modelMatrix: {
		get: function() {
			return this._customSensor.modelMatrix;
		},
		set: function(value) {
			this._customSensor.modelMatrix = value;
		}
	},
	radius: {
		get: function() {
			return this._customSensor.radius;
		},
		set: function(value) {
			this._customSensor.radius = value;
		}
	},
	lateralSurfaceMaterial: {
		get: function() {
			return this._customSensor.lateralSurfaceMaterial;
		},
		set: function(value) {
			this._customSensor.lateralSurfaceMaterial = value;
		}
	},
	intersectionColor: {
		get: function() {
			return this._customSensor.intersectionColor;
		},
		set: function(value) {
			this._customSensor.intersectionColor = value;
		}
	},
	intersectionWidth: {
		get: function() {
			return this._customSensor.intersectionWidth;
		},
		set: function(value) {
			this._customSensor.intersectionWidth = value;
		}
	},
	id: {
		get: function() {
			return this._customSensor.id;
		},
		set: function(value) {
			this._customSensor.id = value;
		}
	}
});

RectangularPyramidSensorVolume.prototype.update = function(frameState) {
	this._customSensor.update(frameState);
};

RectangularPyramidSensorVolume.prototype.isDestroyed = function() {
	return false;
};

RectangularPyramidSensorVolume.prototype.destroy = function() {
	this._customSensor = this._customSensor && this._customSensor.destroy();
	return destroyObject(this);
};

const defaultIntersectionColor$1 = Color.WHITE;
const defaultIntersectionWidth$1 = 1.0;
const defaultRadius$1 = Number.POSITIVE_INFINITY;

const matrix3Scratch$1 = new Matrix3();
const cachedPosition$1 = new Cartesian3();
const cachedOrientation$1 = new Quaternion();

/**
 * A {@link Visualizer} which maps {@link Entity#rectangularSensor} to a {@link RectangularSensor}.
 * @alias RectangularSensorVisualizer
 * @constructor
 *
 * @param {Scene} scene The scene the primitives will be rendered in.
 * @param {EntityCollection} entityCollection The entityCollection to visualize.
 */
const RectangularSensorVisualizer = function(scene, entityCollection) {
	// >>includeStart('debug', pragmas.debug);
	if (!defined(scene)) {
		throw new DeveloperError('scene is required.');
	}
	if (!defined(entityCollection)) {
		throw new DeveloperError('entityCollection is required.');
	}
	// >>includeEnd('debug');

	entityCollection.collectionChanged.addEventListener(RectangularSensorVisualizer.prototype._onCollectionChanged, this);

	this._scene = scene;
	this._primitives = scene.primitives;
	this._entityCollection = entityCollection;
	this._hash = {};
	this._entitiesToVisualize = new AssociativeArray();

	this._onCollectionChanged(entityCollection, entityCollection.values, [], []);
};

/**
 * Updates the primitives created by this visualizer to match their
 * Entity counterpart at the given time.
 *
 * @param {JulianDate} time The time to update to.
 * @returns {Boolean} This function always returns true.
 */
RectangularSensorVisualizer.prototype.update = function(time) {
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
		var rectangularSensorGraphics = entity._rectangularSensor;

		var position;
		var orientation;
		var data = hash[entity.id];
		var show = entity.isShowing && entity.isAvailable(time) && Property.getValueOrDefault(rectangularSensorGraphics._show, time, true);

		if (show) {
			position = Property.getValueOrUndefined(entity._position, time, cachedPosition$1);
			orientation = Property.getValueOrUndefined(entity._orientation, time, cachedOrientation$1);
			show = defined(position) && defined(orientation);
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
			primitive = new RectangularPyramidSensorVolume();
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
			Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(orientation, matrix3Scratch$1), position, primitive.modelMatrix);
			data.position = Cartesian3.clone(position, data.position);
			data.orientation = Quaternion.clone(orientation, data.orientation);
		}

		primitive.show = true;
		primitive.xHalfAngle = Property.getValueOrDefault(rectangularSensorGraphics._xHalfAngle, time, Math$1.PI_OVER_TWO);
		primitive.yHalfAngle = Property.getValueOrDefault(rectangularSensorGraphics._yHalfAngle, time, Math$1.PI_OVER_TWO);
		primitive.radius = Property.getValueOrDefault(rectangularSensorGraphics._radius, time, defaultRadius$1);
		primitive.lateralSurfaceMaterial = MaterialProperty.getValue(time, rectangularSensorGraphics._lateralSurfaceMaterial, primitive.lateralSurfaceMaterial);
		primitive.intersectionColor = Property.getValueOrClonedDefault(rectangularSensorGraphics._intersectionColor, time, defaultIntersectionColor$1, primitive.intersectionColor);
		primitive.intersectionWidth = Property.getValueOrDefault(rectangularSensorGraphics._intersectionWidth, time, defaultIntersectionWidth$1);
	}
	return true;
};

/**
 * Returns true if this object was destroyed; otherwise, false.
 *
 * @returns {Boolean} True if this object was destroyed; otherwise, false.
 */
RectangularSensorVisualizer.prototype.isDestroyed = function() {
	return false;
};

/**
 * Removes and destroys all primitives created by this instance.
 */
RectangularSensorVisualizer.prototype.destroy = function() {
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
RectangularSensorVisualizer.prototype._onCollectionChanged = function(entityCollection, added, removed, changed) {
	var i;
	var entity;
	var entities = this._entitiesToVisualize;
	var hash = this._hash;
	var primitives = this._primitives;

	for (i = added.length - 1; i > -1; i--) {
		entity = added[i];
		if (defined(entity._rectangularSensor) && defined(entity._position) && defined(entity._orientation)) {
			entities.set(entity.id, entity);
		}
	}

	for (i = changed.length - 1; i > -1; i--) {
		entity = changed[i];
		if (defined(entity._rectangularSensor) && defined(entity._position) && defined(entity._orientation)) {
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

const angleStep = Math$1.toRadians(2.0);
const defaultSurfaceRadius$1 = 6378137.0;
const epsilon = 1e-12;

function validateElevationAngle(name, value) {
	// >>includeStart('debug', pragmas.debug);
	if (value < 0.0 || value > Math$1.PI_OVER_TWO) {
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
		return Math$1.PI_OVER_TWO;
	}
	var sine = Math$1.clamp((surfaceRadius * Math.cos(elevation)) / denominator, 0.0, 1.0);
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
			interval.maximumCone = Math.min(interval.maximumCone, Math.asin(Math$1.clamp(limit, 0.0, 1.0)));
		}
	} else {
		if (limit > 1.0) {
			return false;
		}
		if (limit > 0.0) {
			interval.minimumCone = Math.max(interval.minimumCone, Math.asin(Math$1.clamp(limit, 0.0, 1.0)));
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
	var sampleCount = Math.ceil(Math$1.TWO_PI / angleStep);
	var clockStep = Math$1.TWO_PI / sampleCount;
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
			lastSpan.push(cloneSampleWithClockOffset(firstSpan[i], Math$1.TWO_PI));
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
	this._maximumElevationAngle = options.maximumElevationAngle ?? Math$1.PI_OVER_TWO;
	this._forwardExclusionAngle = options.forwardExclusionAngle ?? 0.0;
	this._aftExclusionAngle = options.aftExclusionAngle ?? 0.0;
	this._altitude = options.altitude ?? 0.0;
	this._surfaceRadius = options.surfaceRadius ?? defaultSurfaceRadius$1;

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

const defaultIntersectionColor = Color.WHITE;
const defaultIntersectionWidth = 1.0;
const defaultRadius = Number.POSITIVE_INFINITY;
const defaultMinimumElevationAngle = 0.0;
const defaultMaximumElevationAngle = Math$1.PI_OVER_TWO;
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

var processPacketData = CzmlDataSource.processPacketData;
var processMaterialPacketData = CzmlDataSource.processMaterialPacketData;

// eslint-disable-next-line max-params
function processDirectionData(customPatternSensor, directions, interval, sourceUri, entityCollection) {
	var i;
	var len;
	var values = [];
	var unitSphericals = directions.unitSpherical;
	var sphericals = directions.spherical;
	var unitCartesians = directions.unitCartesian;
	var cartesians = directions.cartesian;

	if (defined(unitSphericals)) {
		for (i = 0, len = unitSphericals.length; i < len; i += 2) {
			values.push(new Spherical(unitSphericals[i], unitSphericals[i + 1]));
		}
		directions.array = values;
	} else if (defined(sphericals)) {
		for (i = 0, len = sphericals.length; i < len; i += 3) {
			values.push(new Spherical(sphericals[i], sphericals[i + 1], sphericals[i + 2]));
		}
		directions.array = values;
	} else if (defined(unitCartesians)) {
		for (i = 0, len = unitCartesians.length; i < len; i += 3) {
			var tmp = Spherical.fromCartesian3(new Cartesian3(unitCartesians[i], unitCartesians[i + 1], unitCartesians[i + 2]));
			Spherical.normalize(tmp, tmp);
			values.push(tmp);
		}
		directions.array = values;
	} else if (defined(cartesians)) {
		for (i = 0, len = cartesians.length; i < len; i += 3) {
			values.push(Spherical.fromCartesian3(new Cartesian3(cartesians[i], cartesians[i + 1], cartesians[i + 2])));
		}
		directions.array = values;
	}
	processPacketData(Array, customPatternSensor, 'directions', directions, interval, sourceUri, entityCollection);
}

// eslint-disable-next-line max-params
function processCommonSensorProperties(sensor, sensorData, interval, sourceUri, entityCollection) {
	processPacketData(Boolean, sensor, 'show', sensorData.show, interval, sourceUri, entityCollection);
	processPacketData(Number, sensor, 'radius', sensorData.radius, interval, sourceUri, entityCollection);
	processPacketData(Boolean, sensor, 'showIntersection', sensorData.showIntersection, interval, sourceUri, entityCollection);
	processPacketData(Color, sensor, 'intersectionColor', sensorData.intersectionColor, interval, sourceUri, entityCollection);
	processPacketData(Number, sensor, 'intersectionWidth', sensorData.intersectionWidth, interval, sourceUri, entityCollection);
	processMaterialPacketData(sensor, 'lateralSurfaceMaterial', sensorData.lateralSurfaceMaterial, interval, sourceUri, entityCollection);
}

var iso8601Scratch = {
	iso8601: undefined
};

function processConicSensor(entity, packet, entityCollection, sourceUri) {
	var conicSensorData = packet.agi_conicSensor;
	if (!defined(conicSensorData)) {
		return;
	}

	var interval;
	var intervalString = conicSensorData.interval;
	if (defined(intervalString)) {
		iso8601Scratch.iso8601 = intervalString;
		interval = TimeInterval.fromIso8601(iso8601Scratch);
	}

	var conicSensor = entity.conicSensor;
	if (!defined(conicSensor)) {
		entity.addProperty('conicSensor');
		conicSensor = new ConicSensorGraphics();
		entity.conicSensor = conicSensor;
	}

	processCommonSensorProperties(conicSensor, conicSensorData, interval, sourceUri, entityCollection);
	processPacketData(Number, conicSensor, 'innerHalfAngle', conicSensorData.innerHalfAngle, interval, sourceUri, entityCollection);
	processPacketData(Number, conicSensor, 'outerHalfAngle', conicSensorData.outerHalfAngle, interval, sourceUri, entityCollection);
	processPacketData(Number, conicSensor, 'minimumClockAngle', conicSensorData.minimumClockAngle, interval, sourceUri, entityCollection);
	processPacketData(Number, conicSensor, 'maximumClockAngle', conicSensorData.maximumClockAngle, interval, sourceUri, entityCollection);
}

function processCustomPatternSensor(entity, packet, entityCollection, sourceUri) {
	var customPatternSensorData = packet.agi_customPatternSensor;
	if (!defined(customPatternSensorData)) {
		return;
	}

	var interval;
	var intervalString = customPatternSensorData.interval;
	if (defined(intervalString)) {
		iso8601Scratch.iso8601 = intervalString;
		interval = TimeInterval.fromIso8601(iso8601Scratch);
	}

	var customPatternSensor = entity.customPatternSensor;
	if (!defined(customPatternSensor)) {
		entity.addProperty('customPatternSensor');
		customPatternSensor = new CustomPatternSensorGraphics();
		entity.customPatternSensor = customPatternSensor;
	}

	processCommonSensorProperties(customPatternSensor, customPatternSensorData, interval, sourceUri, entityCollection);

	// The directions property is a special case value that can be an array of unitSpherical or unit Cartesians.
	// We pre-process this into Spherical instances and then process it like any other array.
	var directions = customPatternSensorData.directions;
	if (defined(directions)) {
		if (Array.isArray(directions)) {
			var length = directions.length;
			for (var i = 0; i < length; i++) {
				processDirectionData(customPatternSensor, directions[i], interval, sourceUri, entityCollection);
			}
		} else {
			processDirectionData(customPatternSensor, directions, interval, sourceUri, entityCollection);
		}
	}
}

function processRectangularSensor(entity, packet, entityCollection, sourceUri) {
	var rectangularSensorData = packet.agi_rectangularSensor;
	if (!defined(rectangularSensorData)) {
		return;
	}

	var interval;
	var intervalString = rectangularSensorData.interval;
	if (defined(intervalString)) {
		iso8601Scratch.iso8601 = intervalString;
		interval = TimeInterval.fromIso8601(iso8601Scratch);
	}

	var rectangularSensor = entity.rectangularSensor;
	if (!defined(rectangularSensor)) {
		entity.addProperty('rectangularSensor');
		rectangularSensor = new RectangularSensorGraphics();
		entity.rectangularSensor = rectangularSensor;
	}

	processCommonSensorProperties(rectangularSensor, rectangularSensorData, interval, sourceUri, entityCollection);
	processPacketData(Number, rectangularSensor, 'xHalfAngle', rectangularSensorData.xHalfAngle, interval, sourceUri, entityCollection);
	processPacketData(Number, rectangularSensor, 'yHalfAngle', rectangularSensorData.yHalfAngle, interval, sourceUri, entityCollection);
}

function processSarSensor(entity, packet, entityCollection, sourceUri) {
	var sarSensorData = packet.agi_sarSensor;
	if (!defined(sarSensorData)) {
		return;
	}

	var interval;
	var intervalString = sarSensorData.interval;
	if (defined(intervalString)) {
		iso8601Scratch.iso8601 = intervalString;
		interval = TimeInterval.fromIso8601(iso8601Scratch);
	}

	var sarSensor = entity.sarSensor;
	if (!defined(sarSensor)) {
		entity.addProperty('sarSensor');
		sarSensor = new SarSensorGraphics();
		entity.sarSensor = sarSensor;
	}

	processCommonSensorProperties(sarSensor, sarSensorData, interval, sourceUri, entityCollection);
	processPacketData(Number, sarSensor, 'minimumElevationAngle', sarSensorData.minimumElevationAngle, interval, sourceUri, entityCollection);
	processPacketData(Number, sarSensor, 'maximumElevationAngle', sarSensorData.maximumElevationAngle, interval, sourceUri, entityCollection);
	processPacketData(Number, sarSensor, 'forwardExclusionAngle', sarSensorData.forwardExclusionAngle, interval, sourceUri, entityCollection);
	processPacketData(Number, sarSensor, 'aftExclusionAngle', sarSensorData.aftExclusionAngle, interval, sourceUri, entityCollection);
	processPacketData(Number, sarSensor, 'altitude', sarSensorData.altitude, interval, sourceUri, entityCollection);
}

var initialized = false;

function initialize() {
	if (initialized) {
		return;
	}

	CzmlDataSource.updaters.push(processConicSensor, processCustomPatternSensor, processRectangularSensor, processSarSensor);

	var originalDefaultVisualizersCallback = DataSourceDisplay.defaultVisualizersCallback;
	DataSourceDisplay.defaultVisualizersCallback = function(scene, entityCluster, dataSource) {
		var entities = dataSource.entities;
		var array = originalDefaultVisualizersCallback(scene, entityCluster, dataSource);
		return array.concat([
			new ConicSensorVisualizer(scene, entities),
			new CustomPatternSensorVisualizer(scene, entities),
			new RectangularSensorVisualizer(scene, entities),
			new SarSensorVisualizer(scene, entities)
		]);
	};

	initialized = true;
}

initialize();

var cesiumSensorVolumes = {
	ConicSensorGraphics,
	ConicSensorVisualizer,
	CustomPatternSensorGraphics,
	CustomPatternSensorVisualizer,
	CustomSensorVolume,
	RectangularPyramidSensorVolume,
	RectangularSensorGraphics,
	RectangularSensorVisualizer,
	SarSensorGraphics,
	SarSensorVisualizer,
	SarSensorVolume
};

export { cesiumSensorVolumes as default };
