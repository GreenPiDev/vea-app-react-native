// expo-three pulls in @expo/browser-polyfill, whose nested `uuid` dependency
// ships ESM-only files Jest's transformer chokes on (SyntaxError: Unexpected
// token 'export') — and even transformed, its native GL/asset-loading code
// has nothing meaningful to do under jsdom anyway (same reasoning
// vea-frontend's CLAUDE.md gives for not unit-testing R3F/Three.js
// components directly). Map the whole package to a stub instead of fighting
// transformIgnorePatterns for a module no test actually exercises.
class TextureLoader {
  load(_url, _onLoad, _onProgress, _onError) {
    return {};
  }
}

module.exports = { TextureLoader };
