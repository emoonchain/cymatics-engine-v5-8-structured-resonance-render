// Reserved for future GPU shader particle implementation.
// Current renderer uses Three.js InstancedMesh for easier integration.
attribute float aEnergy;
varying float vEnergy;

void main() {
  vEnergy = aEnergy;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
