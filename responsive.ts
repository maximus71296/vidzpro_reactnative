import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const scaleSize = (size: number): number => (width / BASE_WIDTH) * size;
const verticalScaleSize = (size: number): number => (height / BASE_HEIGHT) * size;

const responsiveFontSize = (size: number): number => {
  const scaleFactor = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
  return Math.round(size * scaleFactor);
};

type ResponsiveFunction = (size: number) => number;

interface Responsive {
  width: ResponsiveFunction;
  height: ResponsiveFunction;
  fontSize: ResponsiveFunction;
  margin: ResponsiveFunction;
  padding: ResponsiveFunction;
  borderRadius: ResponsiveFunction;
}

const responsive: Responsive = {
  width: scaleSize,
  height: verticalScaleSize,
  fontSize: responsiveFontSize,
  margin: scaleSize,
  padding: scaleSize,
  borderRadius: scaleSize,
};

export default responsive;
