/** @type {const} */
const themeColors = {
  // EketSupply Brand Colours (from official brand kit)
  primary:    { light: '#1B5E20', dark: '#2E7D32' }, // Forest green — "Eket" wordmark
  accent:     { light: '#E65100', dark: '#F57C00' }, // Bold orange — "Supply" wordmark
  navy:       { light: '#1A237E', dark: '#3949AB' }, // Navy — tagline text

  // Surfaces & Backgrounds
  background: { light: '#FFFFFF', dark: '#0D1B0E' },
  surface:    { light: '#F5F7F5', dark: '#1A2E1B' },

  // Text
  foreground: { light: '#1C2B1D', dark: '#E8F5E9' },
  muted:      { light: '#5A6B5B', dark: '#81A882' },

  // Borders
  border:     { light: '#D4E0D4', dark: '#2E4D2F' },

  // Semantic
  success:    { light: '#22C55E', dark: '#4ADE80' },
  warning:    { light: '#F59E0B', dark: '#FBBF24' },
  error:      { light: '#EF4444', dark: '#F87171' },

  // Tint (tab bar active colour)
  tint:       { light: '#1B5E20', dark: '#4CAF50' },
};

module.exports = { themeColors };
