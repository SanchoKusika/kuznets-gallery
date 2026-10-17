import { ThreeCanvas } from "@remotion/three";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, getRemotionEnvironment, staticFile, useVideoConfig } from "remotion";
import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { art as getArt } from "../data/art";
import { coverCrop, type Crop } from "../primitives/ArtImage";
import { ease, mix } from "../theme/easing";
import { ART_SCALE_LIMIT, color, stroke } from "../theme/tokens";

export type Canvas3DProps = {
  code: string;
  /** Face size on screen at rotation 0 and scale 1, px. */
  faceWidth: number;
  faceHeight: number;
  /** Centre of the face on screen at rotation 0, px. */
  x: number;
  y: number;
  /** Turn around the vertical axis, degrees; negative brings the right edge towards the viewer. */
  rotY?: number;
  /** Tilt around the horizontal axis, degrees; positive brings the top edge towards the viewer. */
  rotX?: number;
  scale?: number;
  /** Staples on the back, 0…3; the fractional part scales the next one in. */
  staples?: number;
  /** Shadow strength 0…1. */
  shadow?: number;
  /** Camera distance in px (like CSS `perspective`), centred on the canvas. */
  perspective?: number;
  /** Canvas depth as a share of its width (brief: ≈ 4%). */
  depth?: number;
  /** Ink lines on the back, px; default — the format's stroke. */
  lineWidth?: number;
  /** Source region on the face; default — centred cover crop. */
  crop?: Crop;
};

const DEG = Math.PI / 180;
/** Gap between the stretcher and the cloth, so faces never z-fight. */
const EPS = 0.6;

/** Loads the artwork once; holds the render until the image is decoded and the WebGL canvas exists. */
function useArtImageElement(file: string) {
  const [handle] = useState(() => delayRender(`Canvas3D: loading ${file}`));
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const el = new Image();
    el.onload = () => setImg(el);
    el.onerror = () => cancelRender(new Error(`Canvas3D: cannot load ${file}`));
    el.src = staticFile(file);
  }, [file]);
  // Released only after the ThreeCanvas (which registers its own delay) has mounted with the image.
  useEffect(() => {
    if (img) continueRender(handle);
  }, [img, handle]);
  return img;
}

/** Plane whose four corners (TL, TR, BL, BR) take the given UVs. */
function plane(w: number, h: number, uv: [number, number, number, number, number, number, number, number]) {
  const g = new THREE.PlaneGeometry(w, h);
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

const lineMaterial = (width: number, w: number, h: number) =>
  new LineMaterial({ color: color.ink, linewidth: width, worldUnits: false, resolution: new THREE.Vector2(w, h) });

const basic = (c: THREE.ColorRepresentation, extra: THREE.MeshBasicMaterialParameters = {}) =>
  // Lines draw over coplanar faces: push the faces back in depth.
  new THREE.MeshBasicMaterial({ color: c, toneMapped: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, ...extra });

type Geo = { fw: number; fh: number; d: number; bw: number; fold: number; X: number; Y: number };

function geometry(fw: number, fh: number, depthRatio: number): Geo {
  const d = fw * depthRatio;
  const bw = 0.075 * Math.min(fw, fh);
  return { fw, fh, d, bw, fold: 0.5 * bw, X: fw / 2 - EPS, Y: fh / 2 - EPS };
}

/** Face and the four mirrored edges (gallery wrap): one texture, UVs per plane. */
function buildPrint(tex: THREE.Texture, g: Geo, crop: Crop, iw: number, ih: number) {
  const { fw, fh, d } = g;
  const u0 = crop.x / iw;
  const u1 = (crop.x + crop.w) / iw;
  const vt = 1 - crop.y / ih;
  const vb = 1 - (crop.y + crop.h) / ih;
  // Depth in source pixels → the strip of the picture that is folded over each edge.
  const du = d / (fw / crop.w) / iw;
  const dv = d / (fh / crop.h) / ih;
  const group = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, shade: number, pos: [number, number, number], rot: [number, number, number]) => {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: new THREE.Color(shade, shade, shade) }));
    m.position.set(...pos);
    m.rotation.set(...rot);
    group.add(m);
  };
  add(plane(fw, fh, [u0, vt, u1, vt, u0, vb, u1, vb]), 1, [0, 0, d / 2], [0, 0, 0]);
  // Sides are darker than the face: they turn away from the light, and it sells the depth.
  add(plane(d, fh, [u1, vt, u1 - du, vt, u1, vb, u1 - du, vb]), 0.72, [fw / 2, 0, 0], [0, Math.PI / 2, 0]);
  add(plane(d, fh, [u0 + du, vt, u0, vt, u0 + du, vb, u0, vb]), 0.72, [-fw / 2, 0, 0], [0, -Math.PI / 2, 0]);
  add(plane(fw, d, [u0, vt - dv, u1, vt - dv, u0, vt, u1, vt]), 0.9, [0, fh / 2, 0], [-Math.PI / 2, 0, 0]);
  add(plane(fw, d, [u0, vb, u1, vb, u0, vb + dv, u1, vb + dv]), 0.62, [0, -fh / 2, 0], [Math.PI / 2, 0, 0]);
  return group;
}

/** Wooden stretcher seen from the back, in the line style: mitred bars, folded cloth, ink edges. */
function buildBack(g: Geo, lines: LineMaterial) {
  const { d, bw, fold, X, Y } = g;
  const group = new THREE.Group();
  const zBack = -d / 2;
  const barDepth = d - 2 * EPS;
  const caps = basic(color.paper2);
  const sides = basic(color.paper3);
  const edgePts: number[] = [];

  const quads: [number, number][][] = [
    [[-X, Y], [X, Y], [X - bw, Y - bw], [-X + bw, Y - bw]],
    [[X, -Y], [-X, -Y], [-X + bw, -Y + bw], [X - bw, -Y + bw]],
    [[X, Y], [X, -Y], [X - bw, -Y + bw], [X - bw, Y - bw]],
    [[-X, -Y], [-X, Y], [-X + bw, Y - bw], [-X + bw, -Y + bw]],
  ];
  for (const q of quads) {
    const shape = new THREE.Shape(q.map(([a, b]) => new THREE.Vector2(a, b)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: barDepth, bevelEnabled: false });
    const bar = new THREE.Mesh(geo, [caps, sides]);
    bar.position.z = zBack;
    group.add(bar);
    const edges = new THREE.EdgesGeometry(geo);
    const p = edges.getAttribute("position");
    for (let i = 0; i < p.count; i++) edgePts.push(p.getX(i), p.getY(i), p.getZ(i) + zBack);
    edges.dispose();
  }

  // The back of the cloth, seen between the bars.
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(2 * X, 2 * Y), basic(color.paperRaised));
  cloth.position.z = d / 2 - EPS / 2;
  cloth.rotation.y = Math.PI;
  group.add(cloth);

  // Cloth folded over the back of the bars, with mitred corner folds.
  const outer = new THREE.Shape([new THREE.Vector2(-X, -Y), new THREE.Vector2(X, -Y), new THREE.Vector2(X, Y), new THREE.Vector2(-X, Y)]);
  const ix = X - fold;
  const iy = Y - fold;
  outer.holes.push(new THREE.Path([new THREE.Vector2(-ix, -iy), new THREE.Vector2(-ix, iy), new THREE.Vector2(ix, iy), new THREE.Vector2(ix, -iy)]));
  const flap = new THREE.Mesh(new THREE.ShapeGeometry(outer), basic(color.paperRaised, { side: THREE.DoubleSide }));
  const zFlap = zBack - 0.3;
  flap.position.z = zFlap;
  group.add(flap);
  const seg = (a: number, b: number, c: number, e: number) => edgePts.push(a, b, zFlap, c, e, zFlap);
  // Outer edge of the fold (the bars' own back edge sits just under the cloth).
  seg(-X, -Y, X, -Y);
  seg(X, -Y, X, Y);
  seg(X, Y, -X, Y);
  seg(-X, Y, -X, -Y);
  seg(-ix, -iy, ix, -iy);
  seg(ix, -iy, ix, iy);
  seg(ix, iy, -ix, iy);
  seg(-ix, iy, -ix, -iy);
  for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) seg(sx * X, sy * Y, sx * ix, sy * iy);

  const ls = new LineSegments2(new LineSegmentsGeometry().setPositions(edgePts), lines);
  group.add(ls);
  return group;
}

/** Three staples along the fold on the top bar, left to right as seen from the back. */
function buildStaples(g: Geo) {
  const len = 0.6 * g.bw;
  const thick = Math.max(4, 0.13 * g.bw);
  const geo = new THREE.PlaneGeometry(len, thick);
  return [0.25, 0, -0.25].map((k) => {
    const m = new THREE.Mesh(geo, basic(color.ink, { transparent: true, side: THREE.DoubleSide }));
    m.position.set(k * g.fw, g.Y - g.fold / 2, -g.d / 2 - 0.8);
    return m;
  });
}

function disposeTree(o: THREE.Object3D) {
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    mats.forEach((x) => x.dispose());
  });
}

/** World matrix of the canvas for the given pose (pivot at the centre of the box, face at z = 0 when unturned). */
function poseMatrix(rotX: number, rotY: number, scale: number, d: number) {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX * DEG, rotY * DEG, 0, "XYZ"));
  return new THREE.Matrix4().compose(new THREE.Vector3(0, 0, (-scale * d) / 2), q, new THREE.Vector3(scale, scale, scale));
}

/**
 * Stretched print on a wooden frame (brief 6.3): the artwork on the face (exact colours), mirrored
 * edges on the sides, the stretcher in the line style on the back, a soft shadow behind.
 *
 * Camera: perspective with its eye `perspective` px in front of the face and the vanishing point on
 * the canvas centre (x, y) — so at rotation 0 the face is exactly faceWidth × faceHeight px.
 */
export function Canvas3D({
  code,
  faceWidth,
  faceHeight,
  x,
  y,
  rotY = 0,
  rotX = 0,
  scale = 1,
  staples = 0,
  shadow = 1,
  perspective = 3000,
  depth = 0.04,
  lineWidth,
  crop,
}: Canvas3DProps) {
  const { width, height } = useVideoConfig();
  const a = getArt(code);
  const img = useArtImageElement(a.file);
  const lw = lineWidth ?? (height > width ? stroke.reels : stroke.promo);
  const c = useMemo(() => crop ?? coverCrop(a.w, a.h, faceWidth / faceHeight), [crop, a.w, a.h, faceWidth, faceHeight]);
  const g = useMemo(() => geometry(faceWidth, faceHeight, depth), [faceWidth, faceHeight, depth]);

  const tex = useMemo(() => {
    if (!img) return null;
    const t = new THREE.Texture(img);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }, [img]);
  useEffect(() => () => tex?.dispose(), [tex]);

  const lines = useMemo(() => lineMaterial(lw, width, height), [lw, width, height]);
  useEffect(() => () => lines.dispose(), [lines]);

  const model = useMemo(() => {
    if (!tex) return null;
    const root = new THREE.Group();
    const inner = new THREE.Group();
    inner.add(buildPrint(tex, g, c, a.w, a.h));
    inner.add(buildBack(g, lines));
    const st = buildStaples(g);
    st.forEach((m) => inner.add(m));
    root.add(inner);
    return { root, inner, staples: st };
  }, [tex, g, c, a.w, a.h, lines]);
  useEffect(() => () => {
    if (model) disposeTree(model.root);
  }, [model]);

  const camera = useMemo(() => Object.assign(new THREE.PerspectiveCamera(), { manual: true }), []);

  // Pose, staples and camera: plain mutations before R3F renders the frame (its render runs in a passive effect).
  useLayoutEffect(() => {
    camera.fov = (2 * Math.atan(height / 2 / perspective)) / DEG;
    camera.aspect = width / height;
    camera.near = 10;
    camera.far = perspective * 4;
    camera.position.set(0, 0, perspective);
    camera.lookAt(0, 0, 0);
    // Shift the picture so the optical axis lands on (x, y): symmetric perspective around the canvas.
    camera.setViewOffset(width, height, width / 2 - x, height / 2 - y, width, height);
    camera.updateProjectionMatrix();
    if (!model) return;
    const m = poseMatrix(rotX, rotY, scale, g.d);
    m.decompose(model.inner.position, model.inner.quaternion, model.inner.scale);
    model.staples.forEach((s, i) => {
      const f = Math.min(1, Math.max(0, staples - i));
      s.visible = f > 0;
      s.scale.setScalar(mix(1.8, 1, ease.out(f)));
      (s.material as THREE.MeshBasicMaterial).opacity = Math.min(1, f * 2.5);
    });
  }, [camera, model, width, height, perspective, x, y, rotX, rotY, scale, staples, g.d]);

  // Screen footprint of the box (for the shadow) and the largest on-screen scale of the face.
  const { box, maxScale } = useMemo(() => {
    const m = poseMatrix(rotX, rotY, scale, g.d);
    const v = new THREE.Vector3();
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    let zMax = -Infinity;
    for (const sx of [-1, 1])
      for (const sy of [-1, 1])
        for (const sz of [-1, 1]) {
          v.set((sx * g.fw) / 2, (sy * g.fh) / 2, (sz * g.d) / 2).applyMatrix4(m);
          const k = perspective / (perspective - v.z);
          x0 = Math.min(x0, x + v.x * k);
          x1 = Math.max(x1, x + v.x * k);
          y0 = Math.min(y0, y - v.y * k);
          y1 = Math.max(y1, y - v.y * k);
          if (sz > 0) zMax = Math.max(zMax, v.z);
        }
    const source = Math.max(faceWidth / c.w, faceHeight / c.h);
    // Only a face turned to the camera counts (seen from the back the picture is hidden).
    const facing = new THREE.Vector3(0, 0, 1).transformDirection(m).z > 0.05;
    return { box: { x0, x1, y0, y1 }, maxScale: facing ? source * scale * (perspective / (perspective - zMax)) : 0 };
  }, [rotX, rotY, scale, g, perspective, x, y, faceWidth, faceHeight, c]);

  if (maxScale > ART_SCALE_LIMIT + 1e-3 && getRemotionEnvironment().isStudio) {
    console.warn(`[Canvas3D] ${code} «${a.title}» on screen at ${maxScale.toFixed(3)}× > ${ART_SCALE_LIMIT}×`);
  }

  // The site's one shadow (0 40px 80px -30px rgba(21,21,21,.45)) as a blurred blob, sized to the footprint;
  // it slides towards the edge that comes off the wall and softens as the canvas turns.
  const bwPx = box.x1 - box.x0;
  const bhPx = box.y1 - box.y0;
  const k = (Math.max(faceWidth, faceHeight) * scale) / 600;
  const turn = Math.sin(-rotY * DEG);
  const blur = 40 * k * (1 + 0.35 * Math.abs(turn));
  const spread = 30 * k;
  const shadowStyle: React.CSSProperties = {
    position: "absolute",
    left: box.x0 + spread + turn * 0.06 * faceWidth * scale,
    top: box.y0 + spread + 40 * k,
    width: Math.max(0, bwPx - 2 * spread),
    height: Math.max(0, bhPx - 2 * spread),
    backgroundColor: "rgba(21,21,21,.45)",
    filter: `blur(${blur}px)`,
    opacity: shadow,
  };

  return (
    <AbsoluteFill>
      {shadow > 0 ? <div style={shadowStyle} /> : null}
      {model ? (
        <ThreeCanvas width={width} height={height} camera={camera} flat gl={{ antialias: true, alpha: true }}>
          <primitive object={model.root} />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
}
