// Wave-propagation pass.
// Solves a discrete 2D wave equation on a height field stored in a float
// render target, then injects energy under the pointer. The result is fed
// back in as `uPrevTexture` next frame (ping-pong FBO).
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uDamping;
uniform float uBrushRadius;
uniform float uMouseActive;
uniform sampler2D uPrevTexture;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec2 texel = vec2(1.0) / uResolution;

  // R = current height, G = previous height (the verlet "memory" term).
  float center = texture2D(uPrevTexture, uv).r;
  float prevCenter = texture2D(uPrevTexture, uv).g;

  // Four-neighbour Laplacian.
  float n = texture2D(uPrevTexture, uv + vec2(0.0, texel.y)).r;
  float s = texture2D(uPrevTexture, uv - vec2(0.0, texel.y)).r;
  float e = texture2D(uPrevTexture, uv + vec2(texel.x, 0.0)).r;
  float w = texture2D(uPrevTexture, uv - vec2(texel.x, 0.0)).r;

  // Next height = neighbour average reflected through the previous state.
  float nextValue = (n + s + e + w) * 0.5 - prevCenter;
  nextValue *= uDamping; // friction so ripples decay instead of ringing forever

  // Drop kinetic energy in under the pointer.
  if (uMouseActive > 0.5) {
    float distToMouse = distance(gl_FragCoord.xy, uMouse * uResolution);
    if (distToMouse < uBrushRadius) {
      float splashStrength = (1.0 - (distToMouse / uBrushRadius)) * 0.38;
      nextValue += splashStrength;
    }
  }

  // Carry the (pre-update) center forward as next frame's "previous" term.
  gl_FragColor = vec4(nextValue, center, 0.0, 1.0);
}
