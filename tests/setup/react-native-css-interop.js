// tests/__mocks__/react-native-css-interop.js

// Most projects only need this module to exist so imports don’t crash in Jest.
// Provide minimal no-op APIs that common callers expect.

module.exports = {
    // NativeWind / interop helpers (no-ops for tests)
    cssInterop: (Component) => Component,
    remapProps: () => {},

    // sometimes imported from this package
    interop: (Component) => Component,

    // If something expects a default export
    default: {},
};
