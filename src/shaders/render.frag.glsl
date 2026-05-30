// Display pass.
// Uses the gradient of the wave field as a refraction offset when sampling the
// text texture, plus a cheap specular term so the ripples catch the light.
uniform vec2 uResolution;
uniform float uDisplacement;
uniform sampler2D uSimTexture;
uniform sampler2D uTextTexture;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec2 texel = vec2(1.0) / uResolution;

  // Sample the wave height at this texel and its right / up neighbours.
  float h = texture2D(uSimTexture, uv).r;
  float hR = texture2D(uSimTexture, uv + vec2(texel.x, 0.0)).r;
  float hU = texture2D(uSimTexture, uv + vec2(0.0, texel.y)).r;

  // Height gradient -> screen-space refraction offset.
  vec2 displacementOffset = vec2(hR - h, hU - h) * uDisplacement;

  // Look up the type through the "water".
  vec4 finalColor = texture2D(uTextTexture, uv + displacementOffset);

  // Specular glint along rising slopes.
  float highlightEdge = (hR - h) * 0.15;
  finalColor.rgb += vec3(highlightEdge);

  gl_FragColor = finalColor;
}
