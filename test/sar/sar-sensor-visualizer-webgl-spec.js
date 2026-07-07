/* eslint-disable max-nested-callbacks */
define([
	'sar/sar-sensor-graphics',
	'sar/sar-sensor-visualizer',
	'Cesium/Core/Cartesian3',
	'Cesium/Core/Color',
	'Cesium/Core/JulianDate',
	'Cesium/Core/Math',
	'Cesium/Core/Matrix3',
	'Cesium/Core/Matrix4',
	'Cesium/Core/Quaternion',
	'Cesium/DataSources/ColorMaterialProperty',
	'Cesium/DataSources/ConstantProperty',
	'Cesium/DataSources/EntityCollection',
	'../util/create-scene',
	'../matchers/add-to-throw-developer-error-matcher'
], function(
	SarSensorGraphics,
	SarSensorVisualizer,
	Cartesian3,
	Color,
	JulianDate,
	CesiumMath,
	Matrix3,
	Matrix4,
	Quaternion,
	ColorMaterialProperty,
	ConstantProperty,
	EntityCollection,
	createScene,
	addToThrowDeveloperErrorMatcher
) {
	'use strict';

	/* global describe, it, beforeAll, afterAll, beforeEach, afterEach, expect */

	describe('sar sensor visualizer', function() {
		var scene;
		var visualizer;

		function getDirectionSegments(primitive) {
			return primitive._customSensors[0].directionSegments;
		}

		function getOpenRadialSegments(directionSegments) {
			return directionSegments.filter(function(segment) {
				return !segment.closed && segment.directions.length === 2;
			});
		}

		beforeAll(function() {
			scene = createScene();
		});

		afterAll(function() {
			scene.destroyForSpecs();
		});

		beforeEach(addToThrowDeveloperErrorMatcher);

		afterEach(function() {
			visualizer = visualizer && visualizer.destroy();
		});

		describe('constructor', function() {
			it('should throw if no scene is passed', function() {
				expect(function() {
					return new SarSensorVisualizer();
				}).toThrowDeveloperError();
			});
		});

		describe('update', function() {
			it('should throw if no time specified', function() {
				var entityCollection = new EntityCollection();
				visualizer = new SarSensorVisualizer(scene, entityCollection);
				expect(function() {
					visualizer.update();
				}).toThrowDeveloperError();
			});
		});

		describe('isDestroy', function() {
			it('should return false until destroyed', function() {
				var entityCollection = new EntityCollection();
				visualizer = new SarSensorVisualizer(scene, entityCollection);
				expect(visualizer.isDestroyed()).toEqual(false);
				visualizer.destroy();
				expect(visualizer.isDestroyed()).toEqual(true);
				visualizer = undefined;
			});
		});

		it('should not create a primitive from an object with no sarSensor', function() {
			var entityCollection = new EntityCollection();
			visualizer = new SarSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.position = new ConstantProperty(Cartesian3.fromDegrees(0, 0, 700000));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
			visualizer.update(JulianDate.now());
			expect(scene.primitives.length).toEqual(0);
		});

		it('should not create a primitive from an object with no position', function() {
			var entityCollection = new EntityCollection();
			visualizer = new SarSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('sarSensor');
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
			testObject.sarSensor = new SarSensorGraphics();
			visualizer.update(JulianDate.now());
			expect(scene.primitives.length).toEqual(0);
		});

		it('should not create a primitive from an object with no orientation', function() {
			var entityCollection = new EntityCollection();
			visualizer = new SarSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('sarSensor');
			testObject.position = new ConstantProperty(Cartesian3.fromDegrees(0, 0, 700000));
			testObject.sarSensor = new SarSensorGraphics();
			visualizer.update(JulianDate.now());
			expect(scene.primitives.length).toEqual(0);
		});

		it('should create and update a SAR sensor', function() {
			var time = JulianDate.now();
			var entityCollection = new EntityCollection();
			visualizer = new SarSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('sarSensor');
			testObject.show = true;
			testObject.position = new ConstantProperty(Cartesian3.fromDegrees(0, 0, 700000));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, Math.sin(CesiumMath.PI_OVER_FOUR), Math.cos(CesiumMath.PI_OVER_FOUR)));

			var sarSensor = new SarSensorGraphics();
			sarSensor.minimumElevationAngle = new ConstantProperty(CesiumMath.toRadians(15));
			sarSensor.maximumElevationAngle = new ConstantProperty(CesiumMath.toRadians(65));
			sarSensor.forwardExclusionAngle = new ConstantProperty(CesiumMath.toRadians(45));
			sarSensor.aftExclusionAngle = new ConstantProperty(CesiumMath.toRadians(45));
			sarSensor.intersectionColor = new ConstantProperty(new Color(0.1, 0.2, 0.3, 0.4));
			sarSensor.intersectionWidth = new ConstantProperty(0.5);
			sarSensor.showIntersection = new ConstantProperty(false);
			sarSensor.radius = new ConstantProperty(123.5);
			sarSensor.show = new ConstantProperty(true);
			sarSensor.lateralSurfaceMaterial = new ColorMaterialProperty(Color.WHITE);

			testObject.sarSensor = sarSensor;

			visualizer.update(time);
			expect(scene.primitives.length).toEqual(1);

			var c = scene.primitives.get(0);
			expect(c.intersectionColor).toEqual(testObject.sarSensor.intersectionColor.getValue(time));
			expect(c.intersectionWidth).toEqual(testObject.sarSensor.intersectionWidth.getValue(time));
			expect(c.showIntersection).toEqual(testObject.sarSensor.showIntersection.getValue(time));
			expect(c.radius).toEqual(testObject.sarSensor.radius.getValue(time));
			expect(c.modelMatrix).toEqual(Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(testObject.orientation.getValue(time)), testObject.position.getValue(time)));
			expect(c.show).toEqual(testObject.sarSensor.show.getValue(time));
			expect(c.lateralSurfaceMaterial.uniforms).toEqual(testObject.sarSensor.lateralSurfaceMaterial.getValue(time));
			expect(c.altitude).toBeGreaterThan(0);

			scene.renderForSpecs(time);
			expect(c._customSensors.length).toBeGreaterThan(0);
			var directionSegments = getDirectionSegments(c);
			expect(directionSegments.length).toBeGreaterThan(0);
			expect(getOpenRadialSegments(directionSegments).length).toEqual(0);

			testObject.show = false;
			visualizer.update(time);
			expect(c.show).toBe(false);

			testObject.show = true;
			visualizer.update(time);
			expect(c.show).toBe(true);

			sarSensor.show.setValue(false);
			visualizer.update(time);
			expect(c.show).toBe(false);
		});

		it('should use explicit altitude when supplied', function() {
			var time = JulianDate.now();
			var entityCollection = new EntityCollection();
			visualizer = new SarSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('sarSensor');
			testObject.position = new ConstantProperty(Cartesian3.fromDegrees(0, 0, 700000));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
			testObject.sarSensor = new SarSensorGraphics({
				minimumElevationAngle: CesiumMath.toRadians(15),
				maximumElevationAngle: CesiumMath.toRadians(65),
				forwardExclusionAngle: CesiumMath.toRadians(45),
				aftExclusionAngle: CesiumMath.toRadians(45),
				altitude: 1000000
			});

			visualizer.update(time);
			var c = scene.primitives.get(0);
			expect(c.altitude).toEqual(1000000);

			scene.renderForSpecs(time);
			expect(c._customSensors.length).toBeGreaterThan(0);
			expect(getDirectionSegments(c).length).toBeGreaterThan(0);
		});

		it('should create open radial segments only for real exclusion gaps', function() {
			var time = JulianDate.now();
			var entityCollection = new EntityCollection();
			visualizer = new SarSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('sarSensor');
			testObject.position = new ConstantProperty(Cartesian3.fromDegrees(0, 0, 700000));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
			testObject.sarSensor = new SarSensorGraphics({
				minimumElevationAngle: CesiumMath.toRadians(15),
				maximumElevationAngle: CesiumMath.toRadians(65),
				forwardExclusionAngle: CesiumMath.toRadians(80),
				aftExclusionAngle: CesiumMath.toRadians(80),
				altitude: 700000
			});

			visualizer.update(time);
			var c = scene.primitives.get(0);
			scene.renderForSpecs(time);

			var directionSegments = getDirectionSegments(c);
			expect(directionSegments.length).toBeGreaterThan(0);
			expect(getOpenRadialSegments(directionSegments).length).toBeGreaterThan(0);
		});

		it('should create a SAR sensor with defaults from an empty sarSensor', function() {
			var time = JulianDate.now();
			var entityCollection = new EntityCollection();
			visualizer = new SarSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('sarSensor');
			testObject.position = new ConstantProperty(Cartesian3.fromDegrees(0, 0, 700000));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));

			testObject.sarSensor = new SarSensorGraphics();
			visualizer.update(time);

			expect(scene.primitives.length).toEqual(1);
			var c = scene.primitives.get(0);
			expect(isFinite(c.radius)).toEqual(false);
			expect(c.show).toEqual(true);

			scene.renderForSpecs(time);
			expect(c._customSensors.length).toBeGreaterThan(0);
			expect(getDirectionSegments(c).length).toBeGreaterThan(0);
		});

		it('should remove primitives', function() {
			var entityCollection = new EntityCollection();
			visualizer = new SarSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('sarSensor');
			testObject.position = new ConstantProperty(Cartesian3.fromDegrees(0, 0, 700000));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
			testObject.sarSensor = new SarSensorGraphics();

			var time = JulianDate.now();
			expect(scene.primitives.length).toEqual(0);
			visualizer.update(time);
			expect(scene.primitives.length).toEqual(1);
			expect(scene.primitives.get(0).show).toEqual(true);
			entityCollection.removeAll();
			visualizer.update(time);
			expect(scene.primitives.length).toEqual(0);
		});

		it('should set entity property', function() {
			var entityCollection = new EntityCollection();
			visualizer = new SarSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('sarSensor');
			testObject.position = new ConstantProperty(Cartesian3.fromDegrees(0, 0, 700000));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
			testObject.sarSensor = new SarSensorGraphics();

			var time = JulianDate.now();
			visualizer.update(time);
			expect(scene.primitives.get(0).id).toEqual(testObject);
		});
	});
});
