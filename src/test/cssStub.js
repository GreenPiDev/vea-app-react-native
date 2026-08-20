// NativeWind's global.css import is a Metro-only construct (processed by
// withNativeWind at bundle time) — Jest has no CSS pipeline, so this maps
// any .css import to an empty module during tests.
module.exports = {};
