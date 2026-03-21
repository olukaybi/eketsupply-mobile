export const SymbolView = 'SymbolView';
export const SymbolWeight = {};
export const SymbolScale = {};
// Stub the SymbolViewProps type so icon-symbol.tsx can import it without errors
export type SymbolViewProps = { name: string; fallback?: any; [key: string]: any };
export type SymbolType = 'monochrome' | 'hierarchical' | 'palette' | 'multicolor';
