import {
	BoundingSphere,
	Cartesian3,
	Color,
	combine,
	ComponentDatatype,
	defined,
	destroyObject,
	DeveloperError,
	Frozen,
	Matrix4,
	PrimitiveType,
	Buffer,
	BufferUsage,
	DrawCommand,
	Pass,
	RenderState,
	ShaderProgram,
	ShaderSource,
	VertexArray,
	BlendingState,
	CullFace,
	Material,
	SceneMode
} from 'cesium';

// eslint-disable-next-line import/extensions
import SensorVolume from '../sensor-volume.glsl';
// eslint-disable-next-line import/extensions
import CustomSensorVolumeFS from './custom-sensor-volume-fs.glsl';
// eslint-disable-next-line import/extensions
import CustomSensorVolumeVS from './custom-sensor-volume-vs.glsl';

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

export default CustomSensorVolume;
