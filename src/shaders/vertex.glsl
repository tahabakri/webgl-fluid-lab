// Screen-space quad — passes UVs straight through, no projection needed.
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
