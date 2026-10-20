import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const MAX_WEB_APP_WIDTH = 480;

// Browsers draw their own toolbar above the page, so web only needs the safe-area inset plus a margin.
const WEB_TOP_MARGIN = 24;

export function getAppWidth(): number {
  const windowWidth = Dimensions.get('window').width;
  return Platform.OS === 'web' ? Math.min(windowWidth, MAX_WEB_APP_WIDTH) : windowWidth;
}

export function useScreenTopPadding(nativePadding: number): number {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'web' ? insets.top + WEB_TOP_MARGIN : nativePadding;
}
