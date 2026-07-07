/* eslint-disable max-nested-callbacks */
define([
	'sar/sar-sensor-graphics',
	'Cesium/Core/Color',
	'Cesium/DataSources/ColorMaterialProperty',
	'Cesium/DataSources/ConstantProperty',
	'../matchers/add-to-throw-developer-error-matcher'
], function(
	SarSensorGraphics,
	Color,
	ColorMaterialProperty,
	ConstantProperty,
	addToThrowDeveloperErrorMatcher
) {
	'use strict';

	/* global describe, it, beforeEach, expect */

	describe('sar sensor graphics', function() {
		describe('merge', function() {
			beforeEach(addToThrowDeveloperErrorMatcher);

			it('should assign unassigned properties', function() {
				var source = new SarSensorGraphics();
				source.lateralSurfaceMaterial = new ColorMaterialProperty();
				source.minimumElevationAngle = new ConstantProperty(1);
				source.maximumElevationAngle = new ConstantProperty(1);
				source.forwardExclusionAngle = new ConstantProperty(1);
				source.aftExclusionAngle = new ConstantProperty(1);
				source.altitude = new ConstantProperty(1);
				source.intersectionColor = new ConstantProperty(Color.WHITE);
				source.radius = new ConstantProperty(1);
				source.show = new ConstantProperty(true);
				source.showIntersection = new ConstantProperty(true);
				source.intersectionWidth = new ConstantProperty(1);

				var target = new SarSensorGraphics();
				target.merge(source);

				expect(target.lateralSurfaceMaterial).toBe(source.lateralSurfaceMaterial);
				expect(target.minimumElevationAngle).toBe(source.minimumElevationAngle);
				expect(target.maximumElevationAngle).toBe(source.maximumElevationAngle);
				expect(target.forwardExclusionAngle).toBe(source.forwardExclusionAngle);
				expect(target.aftExclusionAngle).toBe(source.aftExclusionAngle);
				expect(target.altitude).toBe(source.altitude);
				expect(target.intersectionColor).toBe(source.intersectionColor);
				expect(target.radius).toBe(source.radius);
				expect(target.show).toBe(source.show);
				expect(target.showIntersection).toBe(source.showIntersection);
				expect(target.intersectionWidth).toBe(source.intersectionWidth);
			});

			it('should not assign assigned properties', function() {
				var source = new SarSensorGraphics();
				source.lateralSurfaceMaterial = new ColorMaterialProperty();
				source.minimumElevationAngle = new ConstantProperty(1);
				source.maximumElevationAngle = new ConstantProperty(1);
				source.forwardExclusionAngle = new ConstantProperty(1);
				source.aftExclusionAngle = new ConstantProperty(1);
				source.altitude = new ConstantProperty(1);
				source.intersectionColor = new ConstantProperty(Color.WHITE);
				source.radius = new ConstantProperty(1);
				source.show = new ConstantProperty(true);
				source.showIntersection = new ConstantProperty(true);
				source.intersectionWidth = new ConstantProperty(1);

				var lateralSurfaceMaterial = new ColorMaterialProperty();
				var minimumElevationAngle = new ConstantProperty(1);
				var maximumElevationAngle = new ConstantProperty(1);
				var forwardExclusionAngle = new ConstantProperty(1);
				var aftExclusionAngle = new ConstantProperty(1);
				var altitude = new ConstantProperty(1);
				var intersectionColor = new ConstantProperty(Color.WHITE);
				var radius = new ConstantProperty(1);
				var show = new ConstantProperty(true);
				var showIntersection = new ConstantProperty(true);
				var intersectionWidth = new ConstantProperty(1);

				var target = new SarSensorGraphics();
				target.lateralSurfaceMaterial = lateralSurfaceMaterial;
				target.minimumElevationAngle = minimumElevationAngle;
				target.maximumElevationAngle = maximumElevationAngle;
				target.forwardExclusionAngle = forwardExclusionAngle;
				target.aftExclusionAngle = aftExclusionAngle;
				target.altitude = altitude;
				target.intersectionColor = intersectionColor;
				target.radius = radius;
				target.show = show;
				target.showIntersection = showIntersection;
				target.intersectionWidth = intersectionWidth;

				target.merge(source);

				expect(target.lateralSurfaceMaterial).toBe(lateralSurfaceMaterial);
				expect(target.minimumElevationAngle).toBe(minimumElevationAngle);
				expect(target.maximumElevationAngle).toBe(maximumElevationAngle);
				expect(target.forwardExclusionAngle).toBe(forwardExclusionAngle);
				expect(target.aftExclusionAngle).toBe(aftExclusionAngle);
				expect(target.altitude).toBe(altitude);
				expect(target.intersectionColor).toBe(intersectionColor);
				expect(target.radius).toBe(radius);
				expect(target.show).toBe(show);
				expect(target.showIntersection).toBe(showIntersection);
				expect(target.intersectionWidth).toBe(intersectionWidth);
			});

			it('should throw if source undefined', function() {
				var target = new SarSensorGraphics();
				expect(function() {
					target.merge(undefined);
				}).toThrowDeveloperError();
			});
		});

		it('should clone', function() {
			var source = new SarSensorGraphics();
			source.lateralSurfaceMaterial = new ColorMaterialProperty();
			source.minimumElevationAngle = new ConstantProperty(1);
			source.maximumElevationAngle = new ConstantProperty(1);
			source.forwardExclusionAngle = new ConstantProperty(1);
			source.aftExclusionAngle = new ConstantProperty(1);
			source.altitude = new ConstantProperty(1);
			source.intersectionColor = new ConstantProperty(Color.WHITE);
			source.radius = new ConstantProperty(1);
			source.show = new ConstantProperty(true);
			source.showIntersection = new ConstantProperty(true);
			source.intersectionWidth = new ConstantProperty(1);

			var result = source.clone();
			expect(result.lateralSurfaceMaterial).toBe(source.lateralSurfaceMaterial);
			expect(result.minimumElevationAngle).toBe(source.minimumElevationAngle);
			expect(result.maximumElevationAngle).toBe(source.maximumElevationAngle);
			expect(result.forwardExclusionAngle).toBe(source.forwardExclusionAngle);
			expect(result.aftExclusionAngle).toBe(source.aftExclusionAngle);
			expect(result.altitude).toBe(source.altitude);
			expect(result.intersectionColor).toBe(source.intersectionColor);
			expect(result.radius).toBe(source.radius);
			expect(result.show).toBe(source.show);
			expect(result.showIntersection).toBe(source.showIntersection);
			expect(result.intersectionWidth).toBe(source.intersectionWidth);
		});
	});
});
