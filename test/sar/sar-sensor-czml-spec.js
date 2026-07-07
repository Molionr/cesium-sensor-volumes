/* eslint-disable max-nested-callbacks */
define([
	'Cesium/Core/Color',
	'Cesium/Core/JulianDate',
	'Cesium/DataSources/CzmlDataSource',
	'initialize'
], function(
	Color,
	JulianDate,
	CzmlDataSource,
	initialize
) {
	'use strict';

	/* global describe, it, expect */

	describe('sar sensor czml', function() {
		it('should process agi_sarSensor packets', function() {
			initialize();

			var czml = [{
				id: 'document',
				version: '1.0'
			}, {
				id: 'test',
				position: {
					cartesian: [7000000, 0, 0]
				},
				orientation: {
					unitQuaternion: [0, 0, 0, 1]
				},
				agi_sarSensor: {
					show: true,
					radius: 1000,
					minimumElevationAngle: 0.1,
					maximumElevationAngle: 0.8,
					forwardExclusionAngle: 0.2,
					aftExclusionAngle: 0.3,
					altitude: 700000,
					showIntersection: false,
					intersectionColor: {
						rgba: [255, 0, 0, 128]
					},
					intersectionWidth: 2
				}
			}];

			return CzmlDataSource.load(czml).then(function(dataSource) {
				var time = JulianDate.now();
				var entity = dataSource.entities.getById('test');
				expect(entity.sarSensor).toBeDefined();
				expect(entity.sarSensor.show.getValue(time)).toEqual(true);
				expect(entity.sarSensor.radius.getValue(time)).toEqual(1000);
				expect(entity.sarSensor.minimumElevationAngle.getValue(time)).toEqual(0.1);
				expect(entity.sarSensor.maximumElevationAngle.getValue(time)).toEqual(0.8);
				expect(entity.sarSensor.forwardExclusionAngle.getValue(time)).toEqual(0.2);
				expect(entity.sarSensor.aftExclusionAngle.getValue(time)).toEqual(0.3);
				expect(entity.sarSensor.altitude.getValue(time)).toEqual(700000);
				expect(entity.sarSensor.showIntersection.getValue(time)).toEqual(false);
				expect(entity.sarSensor.intersectionColor.getValue(time)).toEqual(new Color(1, 0, 0, 128 / 255));
				expect(entity.sarSensor.intersectionWidth.getValue(time)).toEqual(2);
			});
		});
	});
});
