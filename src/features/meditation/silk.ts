/**
 * A field of slowly drifting satin folds in the colours of the logo, lit by a soft lamp that follows
 * the pointer: one full-screen fragment shader, plain WebGL, no libraries. The folds are a few
 * sine waves bent by each other (the idea of ReactBits «Silk» / «Liquid Ether», written from scratch);
 * the normals come from the height field's slope, the light is a point above the cloth with a glossy
 * highlight, a click sends a ring across it.
 */

const VERTEX = `attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uLight;
uniform float uBreath;
// Rings: xy — where (0…1), z — seconds since the click (< 0: free slot), w — strength.
uniform vec4 uRing[4];

float aspect;

// The cloth's height at a point of the screen (the screen is 1 high and \`aspect\` wide).
float height(vec2 q) {
  vec2 p = q * 4.2;
  p += 0.28 * vec2(sin(p.y * 1.6 + uTime * 0.21), cos(p.x * 1.3 - uTime * 0.17));
  float a = sin(p.x * 2.1 + p.y * 1.4 + uTime * 0.18 + 1.3 * sin(p.y * 1.9 - uTime * 0.13));
  float b = sin(p.x * 3.3 - p.y * 2.2 - uTime * 0.14 + 1.6 * sin(p.x * 1.1 + uTime * 0.1));
  float c = sin(length(p + vec2(0.3, -0.2)) * 4.0 - uTime * 0.22);
  float h = 0.5 * a + 0.3 * b + 0.2 * c;
  for (int i = 0; i < 4; i++) {
    vec4 r = uRing[i];
    if (r.z < 0.0) continue;
    float front = length(q - r.xy * vec2(aspect, 1.0)) - r.z * 0.42;
    h += 0.32 * r.w * sin(front * 40.0) * exp(-front * front * 45.0) * exp(-r.z * 0.8);
  }
  return h;
}

void main() {
  aspect = uRes.x / uRes.y;
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 q = uv * vec2(aspect, 1.0);

  float h = height(q);
  float e = 0.004;
  vec2 slope = vec2(height(q + vec2(e, 0.0)) - h, height(q + vec2(0.0, e)) - h) / e;
  vec3 n = normalize(vec3(-slope * 0.07, 1.0));

  // The lamp hangs over the cloth where the pointer is; it swells a little as the breath fills.
  vec3 toLamp = vec3(uLight * vec2(aspect, 1.0), 0.3) - vec3(q, 0.0);
  float dist = length(toLamp);
  vec3 l = toLamp / dist;
  float reach = 1.0 / (1.0 + dist * dist * (3.4 - 1.5 * uBreath));
  float diffuse = max(dot(n, l), 0.0);
  float gloss = pow(max(dot(n, normalize(l + vec3(0.0, 0.0, 1.0))), 0.0), 64.0);

  // Deep brown in the hollows, the logo's orange on the crests.
  float t = smoothstep(-0.7, 0.9, h);
  vec3 cloth = mix(vec3(0.05, 0.03, 0.025), vec3(0.36, 0.1, 0.05), t);
  cloth = mix(cloth, vec3(0.88, 0.31, 0.18), t * t * 0.75);

  float lit = 0.3 + 1.5 * diffuse * reach * (0.7 + 0.5 * uBreath);
  vec3 c = cloth * lit + vec3(1.0, 0.9, 0.78) * gloss * reach * (0.8 + 0.7 * uBreath);
  c += vec3(1.0, 0.6, 0.35) * 0.1 * reach * uBreath;

  float edge = length((uv - 0.5) * vec2(aspect * 0.7, 1.0));
  c *= 1.0 - smoothstep(0.35, 1.0, edge) * 0.75;
  c = pow(c / (1.0 + c) * 1.3, vec3(0.92));
  // A breath of noise against banding in the dark.
  c += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 160.0;
  gl_FragColor = vec4(c, 1.0);
}`;

const RINGS = 4;

export type Silk = {
  /** Draws a frame at `time` seconds. */
  frame(time: number): void;
  /** Where the lamp is, in 0…1 of the screen (y up), and how full the breath is, 0…1. */
  set(light: { x: number; y: number }, breath: number): void;
  /** A ring runs over the cloth from this point (0…1, y up). */
  ring(x: number, y: number, time: number): void;
  /** Size of the drawing buffer in pixels (the canvas is stretched over the screen by CSS). It comes out blank: draw a frame after it. */
  resize(width: number, height: number): void;
  destroy(): void;
};

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

/**
 * Null when there is no WebGL (or the shader doesn't build): the page then keeps its plain dark backdrop.
 * `destroy()` gives the context back, so the canvas must not be used again: one canvas per call.
 */
export function createSilk(canvas: HTMLCanvasElement): Silk | null {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false });
  if (!gl) return null;
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // One triangle over the whole screen.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const uRes = uniform("uRes");
  const uTime = uniform("uTime");
  const uLight = uniform("uLight");
  const uBreath = uniform("uBreath");
  const uRing = uniform("uRing");

  const light = { x: 0.5, y: 0.5 };
  let breath = 0.5;
  /** x, y, start time (s), strength; a free slot has start < 0. */
  const rings = Array.from({ length: RINGS }, () => ({ x: 0, y: 0, start: -1, strength: 0 }));
  let nextRing = 0;
  const ringData = new Float32Array(RINGS * 4);

  return {
    frame(time) {
      gl.uniform1f(uTime, time);
      gl.uniform2f(uLight, light.x, light.y);
      gl.uniform1f(uBreath, breath);
      rings.forEach((r, i) => {
        // A ring is gone after ~6 s; its slot is free again.
        const age = r.start < 0 ? -1 : time - r.start;
        if (age > 6) r.start = -1;
        ringData.set([r.x, r.y, r.start < 0 ? -1 : age, r.strength], i * 4);
      });
      gl.uniform4fv(uRing, ringData);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    set(next, fill) {
      light.x = next.x;
      light.y = next.y;
      breath = fill;
    },
    ring(x, y, time) {
      rings[nextRing] = { x, y, start: time, strength: 1 };
      nextRing = (nextRing + 1) % RINGS;
    },
    resize(width, height) {
      // Setting the size, even to the same value, wipes the drawing buffer.
      if (width === canvas.width && height === canvas.height) return;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uRes, width, height);
    },
    destroy() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
