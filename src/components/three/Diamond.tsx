"use client";

import { memo, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer, MeshRefractionMaterial } from "@react-three/drei";
import * as THREE from "three";
import { createBrilliantGeometry } from "@/lib/diamondGeometry";
import type { DiamondQuality } from "./diamondQuality";

export interface DiamondProps {
  /** Scroll progress from 0 to 1. Ignored when progressRef is supplied. */
  progress?: number;
  /** Mutable progress source read every frame without re-rendering React. */
  progressRef?: RefObject<number>;
  quality?: DiamondQuality;
  /** Uniform scale. At 1 the girdle radius is one world unit. */
  scale?: number;
  /** Freezes the spin and pointer response. */
  reducedMotion?: boolean;
  /** Idle rotation in radians per second. */
  spinSpeed?: number;
  /** Base tilt toward the camera in radians. 0.5 shows the table from above; about 0.14 is a side profile. */
  baseTilt?: number;
  /** Multiplier for the scroll driven drift and shrink (0 keeps the stone centred while the page moves it). */
  drift?: number;
}

// Pose and motion.
const BASE_TILT = 0.5; // radians toward the camera, so the table and crown read from above
const MAX_POINTER_TILT = 0.07; // about four degrees
const POINTER_DAMPING = 4;
const PROGRESS_SPIN = Math.PI; // an extra half turn across the scroll range
const PROGRESS_TILT = 0.12;
const PROGRESS_DRIFT = new THREE.Vector3(0.35, -0.25, 0);
const PROGRESS_SHRINK = 0.08;

// Fresnel reflectance at normal incidence for diamond, ((2.42 - 1) / (2.42 + 1)) squared.
const DIAMOND_F0 = 0.172;

interface PanelSpec {
  position: [number, number, number];
  scale: [number, number];
  color?: string;
  intensity?: number;
  /** Rotation about the panel's own facing axis, in radians. */
  roll?: number;
  form?: "rect" | "circle";
}

/**
 * Studio rig captured into the environment cube. A graded grey dome gives the stone body, black
 * flags carve dark bands into it for facet contrast, thin bright strips produce the sharp glints,
 * a sky blue fill keeps the colour cool, a small warm key adds fire, and pinpoints add
 * scintillation.
 */
const STUDIO_RIG: PanelSpec[] = [
  { position: [0, 6, 0], scale: [12, 1.2], color: "#000000", intensity: 0, roll: 0.5 },
  { position: [3, 5, -4], scale: [12, 1.0], color: "#000000", intensity: 0, roll: -0.8 },
  { position: [-4, 4, 4], scale: [10, 0.8], color: "#000000", intensity: 0, roll: 0.2 },
  { position: [0, 3.2, 7.4], scale: [6, 0.5], color: "#000000", intensity: 0, roll: 0.15 },
  { position: [-4, 5, 2], scale: [9, 0.3], intensity: 8, roll: 0.4 },
  { position: [5, 3.5, -1], scale: [8, 0.25], intensity: 8, roll: -0.7 },
  { position: [0.5, 3, 6], scale: [6, 0.22], intensity: 8, roll: 1.2 },
  { position: [-3, -1, 5], scale: [6, 0.3], intensity: 4, roll: -0.3 },
  { position: [2.5, 1.5, 7.5], scale: [0.3, 3], intensity: 6 },
  { position: [-6, 1.5, 3], scale: [6, 5], color: "#86DFFF", intensity: 0.35 },
  { position: [0, 3, 8], scale: [5, 3], intensity: 1.2 },
  { position: [3, 4.5, 4.5], scale: [2, 2], color: "#FFF1DC", intensity: 2.5 },
  { position: [3, 5, -3], scale: [0.35, 0.35], intensity: 20, form: "circle" },
  { position: [-2.5, 3.5, 6], scale: [0.35, 0.35], intensity: 20, form: "circle" },
  { position: [1, 1.5, -6], scale: [0.35, 0.35], intensity: 20, form: "circle" },
  { position: [5, 0.5, 3], scale: [0.35, 0.35], intensity: 20, form: "circle" },
];

/** Euler that points a panel at the origin, then rolls it about its facing axis. */
function facing(position: [number, number, number], roll: number): [number, number, number] {
  const o = new THREE.Object3D();
  o.position.set(position[0], position[1], position[2]);
  o.lookAt(0, 0, 0);
  o.rotateZ(roll);
  return [o.rotation.x, o.rotation.y, o.rotation.z];
}

const RIG_ROTATIONS = STUDIO_RIG.map((panel) => facing(panel.position, panel.roll ?? 0));

function createDomeMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      zenith: { value: new THREE.Color(0.55, 0.57, 0.62) },
      horizon: { value: new THREE.Color(0.16, 0.165, 0.18) },
      nadir: { value: new THREE.Color(0.02, 0.02, 0.025) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 zenith;
      uniform vec3 horizon;
      uniform vec3 nadir;
      varying vec3 vDir;
      void main() {
        float y = normalize(vDir).y;
        vec3 c = y > 0.0 ? mix(horizon, zenith, pow(y, 0.8)) : mix(horizon, nadir, pow(-y, 0.5));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}

/**
 * Surface reflection pass. The refraction shader only traces light through the stone, so this
 * additive shell mirrors the studio rig off the facets with a Schlick fresnel weight, which is
 * where the crisp specular sparkle comes from.
 */
function createShellMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      envMap: { value: null },
      f0: { value: DIAMOND_F0 },
      strength: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      void main() {
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform samplerCube envMap;
      uniform float f0;
      uniform float strength;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      #include <common>
      void main() {
        vec3 n = normalize(vWorldNormal);
        vec3 v = normalize(cameraPosition - vWorldPos);
        float c = clamp(dot(n, v), 0.0, 1.0);
        float f = f0 + (1.0 - f0) * pow(1.0 - c, 5.0);
        vec3 r = reflect(-v, n);
        gl_FragColor = vec4(textureCube(envMap, r).rgb * f * strength, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/** Soft pool of light under the stone with a few faint caustic streaks. */
function createGlowTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (!ctx) return texture;
  const c = size / 2;
  const pool = ctx.createRadialGradient(c, c, 0, c, c, c);
  pool.addColorStop(0, "rgba(255,255,255,0.85)");
  pool.addColorStop(0.22, "rgba(205,228,255,0.45)");
  pool.addColorStop(0.55, "rgba(120,170,230,0.12)");
  pool.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = pool;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "lighter";
  const streaks: Array<[number, number, number, number]> = [
    [0.0, 0.62, 0.12, 0.0],
    [0.9, 0.5, 0.09, 0.05],
    [2.2, 0.55, 0.1, -0.04],
    [3.6, 0.45, 0.08, 0.03],
  ];
  for (const [angle, length, width, offset] of streaks) {
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(angle);
    ctx.translate(offset * size, 0);
    ctx.scale(length * c, width * c);
    const streak = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    streak.addColorStop(0, "rgba(200,225,255,0.22)");
    streak.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = streak;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  texture.needsUpdate = true;
  return texture;
}

/**
 * Renders the studio rig once into a cube texture. The Environment is pointed at a private scene
 * so the main scene keeps its transparent background; the parent reads the resulting texture from
 * that scene's environment slot. Memoised so scroll driven renders never re-capture the cube.
 */
const StudioLights = memo(function StudioLights({ scene }: { scene: THREE.Scene }) {
  const dome = useMemo(() => createDomeMaterial(), []);
  useEffect(() => () => dome.dispose(), [dome]);
  return (
    <Environment resolution={256} frames={1} scene={scene}>
      <mesh scale={40}>
        <sphereGeometry args={[1, 48, 24]} />
        <primitive object={dome} attach="material" />
      </mesh>
      {STUDIO_RIG.map((panel, i) => (
        <Lightformer
          key={i}
          form={panel.form ?? "rect"}
          position={panel.position}
          rotation={RIG_ROTATIONS[i]}
          scale={panel.scale}
          color={panel.color ?? "#ffffff"}
          intensity={panel.intensity ?? 1}
        />
      ))}
    </Environment>
  );
});

export default function Diamond({
  progress = 0,
  progressRef,
  quality = "high",
  scale = 1,
  reducedMotion = false,
  spinSpeed = 0.09,
  baseTilt = BASE_TILT,
  drift: driftAmount = 1,
}: DiamondProps) {
  const [envScene] = useState(() => new THREE.Scene());
  const [envMap, setEnvMap] = useState<THREE.Texture | null>(null);
  const geometry = useMemo(() => createBrilliantGeometry(1), []);
  const shell = useMemo(() => createShellMaterial(), []);
  const glow = useMemo(() => createGlowTexture(), []);

  const drift = useRef<THREE.Group>(null);
  const stone = useRef<THREE.Group>(null);
  const shellMesh = useRef<THREE.Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const tilt = useRef({ x: 0, y: 0 });
  const spin = useRef(0);

  // StudioLights is a child, so its Environment writes the cube texture into the private scene
  // during its own effect. The frame loop picks it up on the next tick and hands it to the
  // refraction material and the shell uniform.

  useEffect(
    () => () => {
      geometry.dispose();
      shell.dispose();
      glow.dispose();
    },
    [geometry, shell, glow],
  );

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    const onLeave = () => {
      pointer.current.x = 0;
      pointer.current.y = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useFrame((_, delta) => {
    const texture = envScene.environment;
    if (texture && texture !== envMap) setEnvMap(texture);
    const shellMaterial = shellMesh.current?.material as THREE.ShaderMaterial | undefined;
    if (shellMaterial && shellMaterial.uniforms.envMap.value !== envMap) shellMaterial.uniforms.envMap.value = envMap;
    const dt = Math.min(delta, 0.1);
    const p = THREE.MathUtils.clamp(progressRef ? progressRef.current : progress, 0, 1);

    // The stone turns its table toward the pointer, eased with critically damped smoothing.
    const targetX = reducedMotion ? 0 : pointer.current.y * MAX_POINTER_TILT;
    const targetY = reducedMotion ? 0 : pointer.current.x * MAX_POINTER_TILT;
    const k = 1 - Math.exp(-dt * POINTER_DAMPING);
    tilt.current.x += (targetX - tilt.current.x) * k;
    tilt.current.y += (targetY - tilt.current.y) * k;

    if (!reducedMotion) spin.current += dt * spinSpeed;

    if (stone.current) {
      stone.current.rotation.set(
        baseTilt + PROGRESS_TILT * p * driftAmount + tilt.current.x,
        spin.current + PROGRESS_SPIN * p + tilt.current.y,
        0,
      );
    }
    if (drift.current) {
      drift.current.position.copy(PROGRESS_DRIFT).multiplyScalar(p * driftAmount);
      drift.current.scale.setScalar(scale * (1 - PROGRESS_SHRINK * p * driftAmount));
    }
  });

  return (
    <group ref={drift}>
      <StudioLights scene={envScene} />
      <group ref={stone}>
        {envMap && quality === "high" && (
          <mesh geometry={geometry}>
            {/* Two bounces and a faint aberration keep the ray march cheap and stop the grazing-angle speckle. */}
            <MeshRefractionMaterial envMap={envMap} bounces={2} ior={2.42} fresnel={1} aberrationStrength={0.012} fastChroma color="#ffffff" />
          </mesh>
        )}
        {envMap && quality === "low" && (
          <>
            {/* Low tier: a white crystal from two physically based passes, no ray marching. */}
            <mesh geometry={geometry}>
              <meshPhysicalMaterial
                side={THREE.BackSide}
                color="#ffffff"
                roughness={0.05}
                metalness={0}
                envMap={envMap}
                envMapIntensity={1.05}
                emissive="#e8f6ff"
                emissiveIntensity={0.12}
                transparent
                opacity={0.55}
                depthWrite={false}
              />
            </mesh>
            <mesh geometry={geometry}>
              <meshPhysicalMaterial
                side={THREE.FrontSide}
                color="#ffffff"
                roughness={0.02}
                metalness={0}
                envMap={envMap}
                envMapIntensity={1.55}
                emissive="#eef8ff"
                emissiveIntensity={0.16}
                clearcoat={1}
                clearcoatRoughness={0}
                transparent
                opacity={0.9}
              />
            </mesh>
          </>
        )}
        {envMap && (
          <>
            <mesh ref={shellMesh} geometry={geometry} material={shell} />
          </>
        )}
      </group>
      <mesh rotation-x={-Math.PI / 2} position-y={-1}>
        <planeGeometry args={[4.6, 4.6]} />
        <meshBasicMaterial
          map={glow}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.55}
          color="#bfe0ff"
        />
      </mesh>
    </group>
  );
}
