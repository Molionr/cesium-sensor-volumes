import initialize from './initialize';
import ConicSensorGraphics from './conic/conic-sensor-graphics';
import ConicSensorVisualizer from './conic/conic-sensor-visualizer';
import CustomPatternSensorGraphics from './custom/custom-pattern-sensor-graphics';
import CustomPatternSensorVisualizer from './custom/custom-pattern-sensor-visualizer';
import CustomSensorVolume from './custom/custom-sensor-volume';
import RectangularPyramidSensorVolume from './rectangular/rectangular-pyramid-sensor-volume';
import RectangularSensorGraphics from './rectangular/rectangular-sensor-graphics';
import RectangularSensorVisualizer from './rectangular/rectangular-sensor-visualizer';
import SarSensorGraphics from './sar/sar-sensor-graphics';
import SarSensorVisualizer from './sar/sar-sensor-visualizer';
import SarSensorVolume from './sar/sar-sensor-volume';

initialize();

export default {
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
