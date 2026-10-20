import { Dimensions, Platform } from 'react-native';

export const MAX_WEB_APP_WIDTH = 480;

export function getAppWidth(): number {
  const windowWidth = Dimensions.get('window').width;
  return Platform.OS === 'web' ? Math.min(windowWidth, MAX_WEB_APP_WIDTH) : windowWidth;
}
