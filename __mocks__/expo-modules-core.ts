export const Platform = { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] };
export const NativeModulesProxy = {};
export const EventEmitter = class { addListener() { return { remove: () => {} }; } };
export const requireNativeModule = () => ({});
export const requireOptionalNativeModule = () => null;
export const createPermissionHook = () => async () => ({ status: 'granted' });
export const PermissionStatus = { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' };
export const UnavailabilityError = class extends Error {};
