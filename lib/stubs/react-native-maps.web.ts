/**
 * Web stub for react-native-maps.
 * react-native-maps uses codegenNativeComponent which is not available on web.
 * This stub prevents Metro from bundling the native code on the web platform.
 */
import React from 'react';
import { View, Text } from 'react-native';

const MapView = React.forwardRef((_props: any, _ref: any) =>
  React.createElement(View, { style: { flex: 1, alignItems: 'center', justifyContent: 'center' } },
    React.createElement(Text, null, 'Map not available on web')
  )
);
MapView.displayName = 'MapView';

export const Marker = () => null;
export const Circle = () => null;
export const Polyline = () => null;
export const Polygon = () => null;
export const Callout = () => null;
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;

export default MapView;
