// Reserved for future GPU shader particle implementation.
precision mediump float;
varying float vEnergy;

void main() {
  vec3 low = vec3(0.88, 0.9, 1.0);
  vec3 mid = vec3(1.0, 0.74, 0.2);
  vec3 high = vec3(1.0, 0.12, 0.03);
  vec3 color = mix(low, mid, smoothstep(0.35, 0.75, vEnergy));
  color = mix(color, high, smoothstep(0.75, 1.0, vEnergy));
  gl_FragColor = vec4(color, 1.0);
}
