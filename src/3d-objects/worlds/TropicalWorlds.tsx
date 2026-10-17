import { useEffect, useMemo, useRef, type PropsWithChildren } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { useCoreStore } from "@/store";
import { useAppStore, ROUTE_PATHS } from "@/store";
import { WORLD_DAY_SECONDS } from "@/types/worldEnvironment";
import { createSandTexture } from "./SandGround";
import { IslandSandMaterial, UnderwaterSandMaterial } from "./TropicalSandMaterial";
import { NightMaterialFill } from "./NightLighting";
import { WorldToonMaterial } from "./WorldToonMaterial";
import { useWorldEnvironment } from "./WorldEnvironment";
import { seededRandom, useWorldQuality } from "./quality";
// Shared by the beach mesh and the water shader: foam follows the actual shore.
const SHORE = 8.4;
const ISLAND_PLATEAU = 5.8;
const WATER_Y = -3.42;
function shoreRadius(a: number) { return SHORE + Math.sin(a * 3) * .10 + Math.cos(a * 5) * .055; }
function islandHeight(r: number) { return -1.36 - .04 * Math.min(r / ISLAND_PLATEAU, 1) - Math.pow(Math.max(0, r - ISLAND_PLATEAU) / (SHORE - ISLAND_PLATEAU), 2) * 2.06; }
function islandSurface(x: number, z: number) {
    return islandHeight(Math.hypot(x, z) / shoreRadius(Math.atan2(z, x)) * SHORE);
}
function islandNormal(x: number, z: number) {
    const e = .025;
    return new T.Vector3(-(islandSurface(x + e, z) - islandSurface(x - e, z)) / (2 * e), 1, -(islandSurface(x, z + e) - islandSurface(x, z - e)) / (2 * e)).normalize();
}
/** Baked height noise; independently offset neighboring samples hide the underlying tile. */
function waveTexture() {
    const random = seededRandom(410), size = 256;
    const pixels = new Uint8Array(size * size * 4);
    const octaves = [4, 8, 16].map(cells => ({ cells, grid: Float32Array.from({ length: cells * cells }, random) }));
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
            let value = 0, weight = 0;
            octaves.forEach(({ cells, grid }, k) => {
                const gx = x / size * cells, gy = y / size * cells;
                const ix = Math.floor(gx), iy = Math.floor(gy);
                const u = T.MathUtils.smoothstep(gx - ix, 0, 1), v = T.MathUtils.smoothstep(gy - iy, 0, 1);
                const at = (dx: number, dy: number) => grid[((iy + dy) % cells) * cells + (ix + dx) % cells];
                const sample = T.MathUtils.lerp(T.MathUtils.lerp(at(0, 0), at(1, 0), u), T.MathUtils.lerp(at(0, 1), at(1, 1), u), v);
                const amplitude = 1 / (1 << k);
                value += sample * amplitude;
                weight += amplitude;
            });
            const v = Math.round(value / weight * 255), offset = (y * size + x) * 4;
            pixels.set([v, v, v, 255], offset);
        }
    const texture = new T.DataTexture(pixels, size, size);
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.minFilter = T.LinearMipmapLinearFilter;
    texture.magFilter = T.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
}
function islandGeometry() {
    const vertices: number[] = [], indices: number[] = [], uvs: number[] = [];
    const rings = 12, sides = 48;
    for (let j = 0; j <= rings; j++)
        for (let i = 0; i <= sides; i++) {
            const a = i / sides * Math.PI * 2, r = j / rings * shoreRadius(a);
            vertices.push(Math.cos(a) * r, islandHeight(r / shoreRadius(a) * SHORE), Math.sin(a) * r);
            uvs.push(Math.cos(a) * r / 160 + .5, .5 - Math.sin(a) * r / 160);
        }
    for (let j = 0; j < rings; j++)
        for (let i = 0; i < sides; i++) {
            const a = j * (sides + 1) + i, b = a + sides + 1;
            indices.push(a, b, a + 1, a + 1, b, b + 1);
        }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    const faceted = g.toNonIndexed();
    g.dispose();
    faceted.computeVertexNormals();
    return faceted;
}
const waterVertex = `varying vec2 vSea; uniform float uTime;
#include <fog_pars_vertex>
void main(){vSea=position.xz; vec3 transformed=position;
transformed.y += sin(position.x*.65+uTime*.65)*.055+cos(position.z*.8-uTime*.45)*.04;
vec4 mvPosition=modelViewMatrix*vec4(transformed,1.); gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`;
const waterFragment = `varying vec2 vSea; uniform float uTime; uniform float uDay; uniform sampler2D uWaves;
#include <fog_pars_fragment>
vec2 waveOffset(vec2 cell){
    vec3 p=fract(vec3(cell.xyx)*vec3(.1031,.1030,.0973));
    p+=dot(p,p.yzx+33.33);
    return fract((p.xx+p.yz)*p.zy);
}
float waveNoise(vec2 uv){
    vec2 cell=floor(uv),blend=smoothstep(.15,.85,fract(uv));
    float a=texture2D(uWaves,uv+waveOffset(cell)).r;
    float b=texture2D(uWaves,uv+waveOffset(cell+vec2(1.,0.))).r;
    float c=texture2D(uWaves,uv+waveOffset(cell+vec2(0.,1.))).r;
    float d=texture2D(uWaves,uv+waveOffset(cell+vec2(1.,1.))).r;
    return mix(mix(a,b,blend.x),mix(c,d,blend.x),blend.y);
}
void main(){float a=atan(vSea.y,vSea.x); float shore=${SHORE.toFixed(2)}+sin(a*3.)*.10+cos(a*5.)*.055;
float distanceToShore=length(vSea)-shore;
float shallows=1.-smoothstep(0.,5.,distanceToShore);
vec3 water=mix(vec3(.025,.39,.63),vec3(.12,.76,.75),shallows);
float swell=texture2D(uWaves,vSea*vec2(.035,.11)+vec2(uTime*.003,-uTime*.007)).r;
float crossWave=texture2D(uWaves,vSea*vec2(.08,.025)+vec2(-uTime*.004,uTime*.003)).r;
vec2 foamUv=vSea*vec2(.16,.27)+vec2(-uTime*.006,uTime*.008);
vec2 warp=vec2(swell-.5,crossWave-.5)*.18;
float patches=waveNoise(foamUv+warp);
float breakup=waveNoise(mat2(.8,-.6,.6,.8)*foamUv*1.73+vec2(.31,-uTime*.003));
float gooeyPatch=patches*.85+breakup*.15;
float waveBand=smoothstep(.64,.68,gooeyPatch);
water=mix(water*.92,water*1.05,swell);
water=mix(water,vec3(.76,.96,.91),waveBand*.7);
float foamWidth=.24+.11*sin(a*13.+uTime*.7)+.06*sin(a*27.-uTime);
float foam=1.-smoothstep(foamWidth,foamWidth+.14,abs(distanceToShore-.12*sin(uTime*.7)));
water=mix(water,vec3(.94,1.,.96),foam*.92);
water*=mix(vec3(.12,.25,.39),vec3(1.),uDay);
gl_FragColor=vec4(water,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
}`;
function Ocean() {
    const environment = useWorldEnvironment();
    const geometry = useMemo(() => { const g = new T.PlaneGeometry(190, 190, 80, 80); g.rotateX(-Math.PI / 2); return g; }, []);
    const waves = useMemo(waveTexture, []);
    useEffect(() => () => waves.dispose(), [waves]);
    const uniforms = useMemo(() => ({ ...T.UniformsUtils.clone(T.UniformsLib.fog), uWaves: { value: waves }, uTime: { value: 0 }, uDay: { value: 1 } }), [waves]);
    const material = useRef<T.ShaderMaterial>(null);
    useEffect(() => () => geometry.dispose(), [geometry]);
    useFrame(() => {
        if (material.current) {
            material.current.uniforms.uTime.value = environment.current.elapsed;
            material.current.uniforms.uDay.value = environment.current.daylight;
        }
    });
    return <mesh geometry={geometry} position={[0, WATER_Y, 0]}><shaderMaterial ref={material} uniforms={uniforms} vertexShader={waterVertex} fragmentShader={waterFragment} fog/></mesh>;
}
function Palm({ x, z, scale = 1 }: {
    x: number;
    z: number;
    scale?: number;
}) {
    const leaves = useRef<T.Group>(null), environment = useWorldEnvironment();
    useFrame(() => {
        if (leaves.current)
            leaves.current.rotation.z = Math.sin(environment.current.elapsed * .65 + x) * .045;
    });
    const orientation = useMemo(() => {
        const normal = islandNormal(x, z);
        return new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), normal)
            .multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), Math.atan2(-z, x)));
    }, [x, z]);
    return <group position={[x, islandSurface(x, z) - .06, z]} scale={scale} quaternion={orientation}>
    {[0, 1, 2, 3, 4].map(i => <mesh key={i} position={[i * i * .018, i * .55 + .27, 0]} rotation={[0, 0, -i * .045]}><cylinderGeometry args={[.15 - i * .013, .19 - i * .013, .62, 6]}/><WorldToonMaterial color={i % 2 ? "#ad7746" : "#98643e"}/></mesh>)}
    <group ref={leaves} position={[.38, 2.85, 0]}>{Array.from({ length: 7 }, (_, i) => <group key={i} rotation={[0, i * Math.PI * 2 / 7, 0]}>
      <mesh position={[.78, -.08, 0]} rotation={[0, 0, -.2]} scale={[1, .18, .48]}><octahedronGeometry args={[1.22, 0]}/><WorldToonMaterial color={i % 2 ? "#55b951" : "#26854a"}/></mesh>
      <mesh position={[1.65, -.45, 0]} rotation={[0, 0, -.6]} scale={[.7, .1, .27]}><octahedronGeometry args={[1, 0]}/><WorldToonMaterial color="#43a64e"/></mesh>
    </group>)}</group>
    {[0, 1, 2].map(i => <mesh key={i} position={[.38 + Math.cos(i * 2.1) * .23, 2.62, Math.sin(i * 2.1) * .23]}><icosahedronGeometry args={[.22, 0]}/><WorldToonMaterial color="#725031"/></mesh>)}
  </group>;
}
function IslandVisitors() {
    const environment = useWorldEnvironment(), plane = useRef<T.Group>(null), birds = useRef<T.Group>(null);
    useFrame(() => {
        const t = environment.current.elapsed;
        if (plane.current) {
            const phase = (t + 34) % 105;
            plane.current.visible = phase < 22;
            plane.current.position.set(-28 + phase * 2.6, 12 + Math.sin(phase * .09), -23);
        }
        if (birds.current) {
            const phase = (t + 10) % 38;
            birds.current.visible = phase < 16 && environment.current.daylight > .1;
            birds.current.position.set(-17 + phase * 2.2, 7 + Math.sin(phase * .35), -12);
            birds.current.children.forEach((bird, i) => bird.children.forEach((wing, j) => { wing.rotation.z = (j === 0 ? 1 : -1) * (.2 + Math.sin(t * 5 + i) * .45); }));
        }
    });
    return <>
    <group ref={plane} scale={.65} name="island-distant-plane">
      <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.12, .2, 2.4, 6]}/><WorldToonMaterial color="#fff4cc"/></mesh>
      <mesh scale={[.7, .07, 3.1]}><boxGeometry /><WorldToonMaterial color="#ed8055"/></mesh>
      <mesh position={[-.9, .1, 0]} scale={[.5, .07, 1.1]}><boxGeometry /><WorldToonMaterial color="#ed8055"/></mesh>
      <mesh position={[-1, .3, 0]} scale={[.4, .6, .07]}><boxGeometry /><WorldToonMaterial color="#fff4cc"/></mesh>
    </group>
    <group ref={birds} name="island-white-birds">{[0, 1, 2].map(i => <group key={i} position={[-i * 1.2, i * .35, -i * .6]}>{[-1, 1].map(side => <mesh key={side} position={[side * .22, 0, 0]} scale={[.5, .055, .17]}><octahedronGeometry args={[1, 0]}/><meshBasicMaterial color="#fffdf0"/></mesh>)}</group>)}</group>
  </>;
}
export function IslandWorld() {
    const geometry = useMemo(islandGeometry, []);
    const sand = useMemo(() => createSandTexture("#eddbac", "#fff0cb"), []);
    useEffect(() => () => { geometry.dispose(); sand.dispose(); }, [geometry, sand]);
    return <group name="island-world">
    <Ocean />
    <mesh geometry={geometry}><IslandSandMaterial map={sand}/></mesh>
    <mesh position={[0, -3.5, 0]} scale={[SHORE - .15, 2.2, SHORE - .15]}><sphereGeometry args={[1, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]}/><WorldToonMaterial color="#c99960" side={T.DoubleSide}/></mesh>
    <Palm x={-3.5} z={-5.6} scale={1.6}/><Palm x={6.6} z={-.4} scale={1.2}/><Palm x={-5.3} z={-4.2} scale={.85}/>
    {[[6.25, -.05], [-3.85, -5.15], [-5.5, -3.8]].map(([x, z], i) => <mesh key={i} position={[x, islandSurface(x, z) + .16, z]}><icosahedronGeometry args={[.23, 0]}/><WorldToonMaterial color="#815535"/></mesh>)}
    <IslandBeachDetails />
    <IslandVisitors />
    <SharkFin />
  </group>;
}
/** Irregular quiet gaps and two to four complete laps, sampled from the shared clock. */
function SharkFin() {
    const environment = useWorldEnvironment(), fin = useRef<T.Group>(null);
    const episodes = useMemo(() => {
        const random = seededRandom(821);
        let start = 16;
        return Array.from({ length: 12 }, () => {
            const circles = 2 + Math.floor(random() * 3), duration = circles * (7 + random() * 3);
            const episode = { start, duration, circles, radius: SHORE + 2 + random() * 2.7, angle: random() * Math.PI * 2, direction: random() > .5 ? 1 : -1 };
            start += duration + 28 + random() * 54;
            return episode;
        });
    }, []);
    const geometry = useMemo(() => {
        const g = new T.BufferGeometry();
        // A solid swept dorsal fin; the body remains below the opaque water.
        const points = [.55, 0, 0, -.65, 0, .10, -.22, .92, 0, .55, 0, 0, -.22, .92, 0, -.65, 0, -.10,
            -.65, 0, .10, -.65, 0, -.10, -.22, .92, 0];
        g.setAttribute("position", new T.Float32BufferAttribute(points, 3));
        g.computeVertexNormals();
        return g;
    }, []);
    useEffect(() => () => geometry.dispose(), [geometry]);
    useFrame(() => {
        if (!fin.current)
            return;
        const last = episodes[episodes.length - 1], t = environment.current.elapsed % (last.start + last.duration + 55);
        const episode = episodes.find(e => t >= e.start && t < e.start + e.duration);
        fin.current.visible = !!episode;
        if (!episode)
            return;
        const elapsed = t - episode.start, progress = elapsed / episode.duration;
        const a = episode.angle + episode.direction * progress * Math.PI * 2 * episode.circles;
        const surface = T.MathUtils.smoothstep(elapsed, 0, 2) * (1 - T.MathUtils.smoothstep(elapsed, episode.duration - 2.5, episode.duration));
        fin.current.position.set(Math.cos(a) * episode.radius, WATER_Y - .04 - (1 - surface) * 1.15, Math.sin(a) * episode.radius);
        fin.current.rotation.y = Math.atan2(-Math.cos(a) * episode.direction, -Math.sin(a) * episode.direction);
    });
    return <group ref={fin} visible={false} name="island-shark-fin"><mesh geometry={geometry}><WorldToonMaterial color="#577d8b" side={T.DoubleSide}/></mesh></group>;
}
function seabedHeight(x: number, z: number) {
    return -1.65 + Math.sin(x * .55 + Math.sin(z * .3)) * .13 + Math.cos(z * .4) * .12 + Math.sin(x * 2.7 + z * .9) * .025;
}
function seabedGeometry() {
    const g = new T.PlaneGeometry(160, 160, 100, 100);
    g.rotateX(-Math.PI / 2);
    const p = g.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i);
        p.setY(i, seabedHeight(x, z));
    }
    g.computeVertexNormals();
    return g;
}
function Reef() {
    const quality = useWorldQuality();
    const rocks = useRef<T.InstancedMesh>(null);
    const corals = useRef<T.InstancedMesh>(null);
    const instances = useMemo(() => {
        const random = seededRandom(801), dummy = new T.Object3D();
        const stones: {
            matrix: T.Matrix4;
            color: T.Color;
        }[] = [];
        const branches: {
            matrix: T.Matrix4;
            color: T.Color;
        }[] = [];
        const count = quality === "low" ? 40 : 76;
        for (let i = 0; i < count; i++) {
            const foreground = i % 4 === 0, nearBob = i % 7 === 0;
            let x = (i % 2 ? 1 : -1) * (nearBob ? 1.8 + random() * 1.2 : 3.2 + random() * 19);
            const z = nearBob ? 2 + random() * 2.8 : foreground ? 2 + random() * 6 : -3 - random() * 32;
            // Keep geometry out of the unchanged counter volume and foreground sightline.
            if (Math.abs(x) < 7 && z > -5 && z < 1)
                x = Math.sign(x) * (7 + random() * 3);
            const besideCounter = Math.abs(x) < 6 && z > 0;
            const scale = .22 + Math.pow(random(), 1.7) * (besideCounter ? .65 : foreground ? 1.65 : 3.6);
            const ground = seabedHeight(x, z);
            const color = new T.Color(["#ed7e98", "#f6aa65", "#b597d9", "#61c5a2"][i % 4]);
            if (i % 3 === 0) {
                dummy.position.set(x, ground + scale * .15, z);
                dummy.rotation.set(0, i, .1);
                dummy.scale.set(scale * (.65 + random() * .8), scale * (.35 + random() * .55), scale * (.6 + random() * .65));
                dummy.updateMatrix();
                stones.push({ matrix: dummy.matrix.clone(), color: new T.Color(i % 2 ? "#7e9fa1" : "#a7b0a1") });
            }
            else {
                const root = new T.Object3D();
                root.position.set(x, ground - .03, z);
                root.scale.setScalar(scale);
                root.updateMatrix();
                for (let j = 0; j < 5; j++) {
                    const stem = new T.Object3D();
                    stem.rotation.set(0, j * 1.5, (j - 2) * .24);
                    stem.updateMatrix();
                    dummy.position.set(0, .55 + j % 2 * .17, 0);
                    dummy.rotation.set(0, 0, 0);
                    dummy.scale.set(1, 1.2 + j % 2 * .34, 1);
                    dummy.updateMatrix();
                    branches.push({ matrix: root.matrix.clone().multiply(stem.matrix).multiply(dummy.matrix), color });
                    dummy.position.set(.23, .65, 0);
                    dummy.rotation.set(0, 0, -.8);
                    dummy.scale.set(.65, .65, .65);
                    dummy.updateMatrix();
                    branches.push({ matrix: root.matrix.clone().multiply(stem.matrix).multiply(dummy.matrix), color });
                }
            }
        }
        return { stones, branches };
    }, [quality]);
    useEffect(() => {
        for (const [mesh, data] of [[rocks.current, instances.stones], [corals.current, instances.branches]] as const) {
            if (!mesh)
                continue;
            data.forEach((item, i) => { mesh.setMatrixAt(i, item.matrix); mesh.setColorAt(i, item.color); });
            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor)
                mesh.instanceColor.needsUpdate = true;
            mesh.computeBoundingSphere();
        }
    }, [instances]);
    return <group name="underwater-reef">
    <instancedMesh ref={rocks} args={[undefined, undefined, instances.stones.length]}><icosahedronGeometry args={[.8, 0]}/><WorldToonMaterial /></instancedMesh>
    <instancedMesh ref={corals} args={[undefined, undefined, instances.branches.length]}><cylinderGeometry args={[.09, .16, 1, 5]}/><WorldToonMaterial /></instancedMesh>
  </group>;
}
function FishSchool({ index, small = false }: {
    index: number;
    small?: boolean;
}) {
    const quality = useWorldQuality(), environment = useWorldEnvironment(), ref = useRef<T.InstancedMesh>(null);
    const count = small ? (quality === "low" ? 10 : 22) : 7;
    const fish = useMemo(() => { const random = seededRandom(920 + index); return Array.from({ length: count }, () => ({ x: (random() - .5) * 3.8, y: (random() - .5) * 1.4, z: (random() - .5) * 2.2, phase: random() * 6.28, speed: .55 + random() * .55, size: .65 + random() * .65 })); }, [count, index]);
    const geometry = useMemo(() => {
        // One faceted body and triangle tail per fish, batched into a single draw.
        const body = new T.SphereGeometry(1, 7, 4);
        body.scale(.48, .23, .15);
        const g = body.toNonIndexed();
        body.dispose();
        const p = Array.from(g.getAttribute("position").array);
        p.push(-.38, 0, 0, -.8, .28, 0, -.8, -.28, 0);
        g.setAttribute("position", new T.Float32BufferAttribute(p, 3));
        g.deleteAttribute("normal");
        g.deleteAttribute("uv");
        g.computeVertexNormals();
        return g;
    }, []);
    const dummy = useMemo(() => new T.Object3D(), []);
    useEffect(() => () => geometry.dispose(), [geometry]);
    useFrame(() => {
        const t = environment.current.elapsed;
        fish.forEach((f, i) => {
            // Each large fish has its own long crossing. Schools retain formation on distinct depth routes.
            const phase = t * (small ? .023 + index * .003 : .012 * f.speed) + (small ? index * .29 : i * .173);
            const cycle = ((phase % 1) + 1) % 1;
            const direction = (small ? index % 2 : i % 2) ? -1 : 1;
            const x = (cycle * 84 - 42) * direction + (small ? f.x : 0);
            const angle = cycle * Math.PI * 2;
            const z = small ? (index === 1 ? -25 + Math.sin(angle) * 10 : -9 + Math.cos(angle) * 8) + f.z
                : -5 - (i % 4) * 5.5 + Math.sin(angle + f.phase) * 4;
            const y = small ? 3.2 + index * .6 + f.y + Math.sin(angle) * .8
                : 1.2 + i % 3 * 1.4 + Math.sin(t * .35 + f.phase) * .6;
            const dz = small ? (index === 1 ? Math.cos(angle) * 10 : -Math.sin(angle) * 8) * Math.PI * 2
                : Math.cos(angle + f.phase) * 4 * Math.PI * 2;
            dummy.position.set(x, y, z);
            dummy.rotation.set(0, Math.atan2(-dz, 84 * direction), Math.sin(t * 2 + f.phase) * .045);
            dummy.scale.setScalar((small ? .29 : .85 * f.size) * (1 + Math.sin(t * 5 + f.phase) * .025));
            dummy.updateMatrix();
            ref.current?.setMatrixAt(i, dummy.matrix);
        });
        if (ref.current) {
            ref.current.instanceMatrix.needsUpdate = true;
            ref.current.visible = !small || environment.current.daylight > .025;
            (ref.current.material as T.MeshToonMaterial).opacity = small ? environment.current.daylight : 1;
        }
    });
    return <instancedMesh ref={ref} args={[geometry, undefined, count]} frustumCulled={false}><WorldToonMaterial transparent={small} color={["#f8cf62", "#79e1ce", "#ff9b91"][index % 3]} side={T.DoubleSide}/></instancedMesh>;
}
function FlowerSky() {
    const environment = useWorldEnvironment(), group = useRef<T.Group>(null);
    const paths = useMemo(() => Array.from({ length: 6 }, (_, i) => {
        const pts = Array.from({ length: 121 }, (_, j) => { const a = j / 120 * Math.PI * 2, r = 2.2 + Math.cos(a * 5) * .85; return new T.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0); });
        return new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 100, .055, 4, true);
    }), []);
    useEffect(() => () => paths.forEach(g => g.dispose()), [paths]);
    useFrame(() => {
        if (group.current) {
            group.current.rotation.z = Math.sin(environment.current.elapsed * .035) * .025;
            group.current.traverse(object => {
                const material = (object as T.Mesh).material as T.MeshBasicMaterial;
                if (material?.isMeshBasicMaterial)
                    material.opacity = .48 * (.12 + environment.current.daylight * .88);
            });
        }
    });
    return <group ref={group} name="underwater-flower-sky">{paths.map((g, i) => <group key={i} position={[-23 + i * 9, 9 + (i % 3) * 3, -29 - i % 2 * 5]} rotation={[0, 0, i * .7]} scale={1 + i % 2 * .35}>
    <mesh geometry={g}><meshBasicMaterial color={i % 2 ? "#71b8bd" : "#648fc2"} transparent opacity={.48} depthWrite={false} fog={false}/></mesh>
    <mesh><torusGeometry args={[.42, .045, 4, 16]}/><meshBasicMaterial color="#71b8bd" transparent opacity={.4} depthWrite={false} fog={false}/></mesh>
  </group>)}</group>;
}
function Godrays() {
    const environment = useWorldEnvironment(), materials = useRef<(T.ShaderMaterial | null)[]>([]);
    const rays = useMemo(() => {
        const random = seededRandom(312);
        return Array.from({ length: 8 }, (_, i) => ({
            x: i === 0 ? -13 : -21 + random() * 42, y: 28 + random() * 6,
            z: i === 0 ? -32 : i === 1 ? -3 : -12 - random() * 32,
            width: i === 0 ? 18 : 14 + random() * 5, height: 110 + random() * 20,
            tilt: -.3 + random() * .6, phase: random() * Math.PI * 2,
        }));
    }, []);
    const uniforms = useMemo(() => ({ uTime: { value: 0 }, uPhase: { value: 0 }, uStrength: { value: 1 } }), []);
    useFrame(() => materials.current.forEach((m, i) => {
        if (m) {
            m.uniforms.uTime.value = environment.current.elapsed;
            m.uniforms.uPhase.value = rays[i].phase;
            m.uniforms.uStrength.value = T.MathUtils.lerp(i < 2 ? .035 : 0, 1, environment.current.daylight);
        }
    }));
    return <group name="underwater-godrays">{rays.map((ray, i) => <mesh key={i} position={[ray.x, ray.y, ray.z]} rotation={[0, .1 * Math.sin(ray.phase), ray.tilt]} scale={[ray.width, ray.height, 1]}>
        <planeGeometry />
        <shaderMaterial ref={m => { materials.current[i] = m; }} uniforms={uniforms} transparent depthWrite={false} side={T.DoubleSide} blending={T.AdditiveBlending} vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={`varying vec2 vUv; uniform float uTime; uniform float uPhase; uniform float uStrength; void main(){
                float width=.15+vUv.y*.32;
                float beam=1.-smoothstep(width*.2,width,abs(vUv.x-.5+sin(vUv.y*5.+uTime*.15+uPhase)*.035));
                float fade=sin(vUv.y*3.14159);
                gl_FragColor=vec4(.58,.96,.87,beam*fade*.045*uStrength);
            }`}/>
    </mesh>)}</group>;
}
// Shared hook/bubble placement stays above the unchanged tap-counter silhouette.
const HOOK_X = 4.5, HOOK_Z = -6, HOOK_REST_Y = 4.6;
// Descend, linger, dip in anticipation, then snap upwards.
function hookPhase(time: number) { return ((time + 48) % 100 + 100) % 100; }
function hookHeight(phase: number) {
    if (phase < 4)
        return T.MathUtils.lerp(24, HOOK_REST_Y, T.MathUtils.smoothstep(phase, 0, 4));
    if (phase < 17)
        return HOOK_REST_Y + Math.sin(phase * 1.3) * .07;
    if (phase < 17.6)
        return HOOK_REST_Y - T.MathUtils.smoothstep(phase, 17, 17.6) * .48;
    return HOOK_REST_Y - .48 + Math.pow(T.MathUtils.clamp((phase - 17.6) / .75, 0, 1), 2) * 27;
}
function FishingHook() {
    const environment = useWorldEnvironment(), ref = useRef<T.Group>(null);
    const geometry = useMemo(() => { const curve = new T.CatmullRomCurve3([new T.Vector3(0, .55, 0), new T.Vector3(0, -.15, 0), new T.Vector3(.22, -.42, 0), new T.Vector3(.48, -.2, 0), new T.Vector3(.43, .06, 0)]); return new T.TubeGeometry(curve, 16, .035, 5, false); }, []);
    useEffect(() => () => geometry.dispose(), [geometry]);
    useFrame(() => {
        if (!ref.current)
            return;
        const t = environment.current.elapsed, phase = hookPhase(t);
        ref.current.visible = phase < 18.35;
        ref.current.position.set(HOOK_X + Math.sin(t * .4) * .28, hookHeight(phase), HOOK_Z);
        ref.current.rotation.z = Math.sin(t * .5) * .035;
    });
    return <group ref={ref} scale={1.55} name="decorative-fishing-hook">
        <mesh position={[0, 15, 0]}><cylinderGeometry args={[.012, .012, 29, 4]}/><meshBasicMaterial color="#cae6db" transparent opacity={.65}/></mesh>
        <mesh geometry={geometry}><WorldToonMaterial color="#c4d5d4"/></mesh>
    </group>;
}
function UnderwaterBubbles() {
    const quality = useWorldQuality(), environment = useWorldEnvironment();
    const mesh = useRef<T.InstancedMesh>(null);
    const bubbleMaterial = useRef<T.ShaderMaterial>(null);
    const bubbleUniforms = useMemo(() => ({ ...T.UniformsUtils.clone(T.UniformsLib.fog), uDay: { value: 1 } }), []);
    const bubbles = useMemo(() => {
        const random = seededRandom(1904);
        return Array.from({ length: quality === "low" ? 42 : 84 }, (_, i) => {
            const group = Math.floor(i / 4), cluster = i % 3 !== 0;
            const groupRandom = seededRandom(713 + group);
            const x = (groupRandom() - .5) * 38, z = -24 + groupRandom() * 31;
            const delay = groupRandom() * 20, duration = 14 + groupRandom() * 10;
            return {
                x: cluster ? x + (random() - .5) * .65 : (random() - .5) * 42,
                z: cluster ? z + (random() - .5) * .7 : -26 + random() * 34,
                delay: cluster ? delay + i % 4 * .3 : random() * 25,
                duration: cluster ? duration : 14 + random() * 10, size: .035 + random() * .095, phase: random() * 6.28,
            };
        });
    }, [quality]);
    const dummy = useMemo(() => new T.Object3D(), []);
    const burstCount = quality === "low" ? 10 : 18;
    useFrame(() => {
        if (!mesh.current)
            return;
        const t = environment.current.elapsed;
        if (bubbleMaterial.current)
            bubbleMaterial.current.uniforms.uDay.value = environment.current.daylight;
        bubbles.forEach((bubble, i) => {
            const progress = ((t + bubble.delay) % bubble.duration) / bubble.duration;
            const envelope = T.MathUtils.smoothstep(progress, 0, .07) * (1 - T.MathUtils.smoothstep(progress, .85, 1));
            dummy.position.set(bubble.x + Math.sin(t * .65 + bubble.phase) * .25, -1.2 + progress * 19, bubble.z + Math.cos(t * .4 + bubble.phase) * .15);
            dummy.scale.setScalar(bubble.size * envelope);
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        const phase = hookPhase(t);
        for (let i = 0; i < burstCount; i++) {
            const age = phase - 17.6 - i * .035;
            const visible = age >= 0 && age < 3.2;
            const a = i * 2.39996;
            dummy.position.set(HOOK_X + .3 + Math.cos(a) * age * .32, HOOK_REST_Y - .5 + age * (1.6 + i % 4 * .3), HOOK_Z + Math.sin(a) * age * .3);
            dummy.scale.setScalar(visible ? (.045 + i % 3 * .022) * (1 - T.MathUtils.smoothstep(age, 2.2, 3.2)) : 0);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(bubbles.length + i, dummy.matrix);
        }
        mesh.current.instanceMatrix.needsUpdate = true;
    });
    return <instancedMesh ref={mesh} args={[undefined, undefined, bubbles.length + burstCount]} frustumCulled={false} name="underwater-bubbles">
        <sphereGeometry args={[1, 8, 6]}/>
        <shaderMaterial ref={bubbleMaterial} transparent depthWrite={false} vertexShader={`varying vec3 vNormal; varying vec3 vView;
                #include <fog_pars_vertex>
                void main(){vec4 world=instanceMatrix*vec4(position,1.);vec4 mvPosition=modelViewMatrix*world;
                vNormal=normalize(normalMatrix*mat3(instanceMatrix)*normal);vView=-mvPosition.xyz;
                gl_Position=projectionMatrix*mvPosition;
                #include <fog_vertex>
                }`} fragmentShader={`varying vec3 vNormal; varying vec3 vView; uniform float uDay;
                #include <fog_pars_fragment>
                void main(){float rim=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),2.);
                gl_FragColor=vec4(.73,.98,1.,(.025+rim*.5)*mix(.22,1.,uDay));
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
                #include <fog_fragment>
                }`} uniforms={bubbleUniforms} fog/>
    </instancedMesh>;
}
export function UnderwaterWorld() {
    const geometry = useMemo(seabedGeometry, []);
    const sand = useMemo(() => createSandTexture("#eddbac", "#fff0cb"), []);
    useEffect(() => () => { geometry.dispose(); sand.dispose(); }, [geometry, sand]);
    return <group name="underwater-world"><mesh geometry={geometry}><UnderwaterSandMaterial map={sand}/></mesh><Reef /><FishSchool index={0}/><FishSchool index={1} small/><FishSchool index={2} small/><FlowerSky /><Godrays /><FishingHook /><UnderwaterBubbles /><NightSeaVisitors /><NightMaterialFill kind="underwater"/></group>;
}
/** Separate from Bob's tap and idle transforms, so the whole equipped character floats. */
export function TropicalBobMotion({ children }: PropsWithChildren) {
    const ref = useRef<T.Group>(null), environment = useWorldEnvironment();
    const underwater = useCoreStore(s => { const w = s.previewMode === "world" ? (s.worlds.find(w => w.preview) ?? s.worlds.find(w => w.enabled)) : s.worlds.find(w => w.enabled); return w?.id === "world_underwater"; });
    const home = useAppStore(s => s.currentRoute === ROUTE_PATHS.HOME);
    useFrame(() => {
        if (ref.current) {
            const t = environment.current.elapsed;
            ref.current.position.y = underwater && home ? .45 + Math.sin(t * .8) * .18 : 0;
            ref.current.rotation.z = underwater && home ? Math.sin(t * .55) * .035 : 0;
        }
    });
    return <group ref={ref} name="bob-world-motion">{children}</group>;
}
/** Underwater sky has no sun/clouds: the water column itself darkens with the clock. */
export function UnderwaterSky() {
    const environment = useWorldEnvironment(), material = useRef<T.ShaderMaterial>(null);
    const uniforms = useMemo(() => ({ uDay: { value: 1 } }), []);
    useFrame(() => {
        if (material.current)
            material.current.uniforms.uDay.value = environment.current.daylight;
    });
    return <mesh renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[100, 24, 22]}/>
        <shaderMaterial ref={material} uniforms={uniforms} side={T.BackSide} depthTest={false} depthWrite={false} vertexShader={`varying float vHeight; void main(){vHeight=position.y/100.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={`varying float vHeight; uniform float uDay; void main(){
                float h=smoothstep(-.25,.8,vHeight);
                vec3 day=mix(vec3(.055,.36,.55),vec3(.22,.77,.76),h);
                vec3 night=mix(vec3(.008,.025,.055),vec3(.014,.085,.14),h);
                gl_FragColor=vec4(mix(night,day,uDay),1.);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }`}/>
    </mesh>;
}
const haloVertex = `varying vec3 vNormal; varying vec3 vView;
void main(){vec4 mvPosition=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=-mvPosition.xyz;gl_Position=projectionMatrix*mvPosition;}`;
const haloFragment = `varying vec3 vNormal; varying vec3 vView; uniform float uStrength;
void main(){float center=pow(max(0.,dot(normalize(vNormal),normalize(vView))),2.5);
gl_FragColor=vec4(.58,.95,.7,center*.13*uStrength);}`;
/** Decorative glows/cones only: no extra Three lights or shadow passes. */
function NightSeaVisitors() {
    const environment = useWorldEnvironment();
    const angler = useRef<T.Group>(null), submarine = useRef<T.Group>(null);
    const halo = useRef<T.ShaderMaterial>(null), beam = useRef<T.ShaderMaterial>(null);
    const lamp = useRef<T.MeshBasicMaterial>(null);
    const blink = useRef<(T.MeshBasicMaterial | null)[]>([]);
    const lure = useMemo(() => new T.TubeGeometry(new T.CatmullRomCurve3([
        new T.Vector3(.1, .38, 0), new T.Vector3(.15, 1.15, 0), new T.Vector3(.85, 1.3, 0), new T.Vector3(1.25, .85, 0),
    ]), 16, .035, 5, false), []);
    const haloUniforms = useMemo(() => ({ uStrength: { value: 0 } }), []);
    const beamUniforms = useMemo(() => ({ uStrength: { value: 0 } }), []);
    useEffect(() => () => lure.dispose(), [lure]);
    useFrame(() => {
        const { elapsed: t, daylight } = environment.current;
        const night = 1 - daylight;
        if (angler.current) {
            angler.current.visible = night > .015;
            const phase = (((t - WORLD_DAY_SECONDS * .5) * 2.2 / 72 + .5) % 1 + 1) % 1;
            angler.current.position.set((.5 - phase) * 72, 4.5 + Math.sin(t * .45) * .35, -8 + Math.sin(t * .16) * 2);
            angler.current.rotation.y = Math.atan2(-Math.cos(t * .16) * .32, -2.2);
            angler.current.rotation.z = Math.sin(t * .8) * .045;
            angler.current.scale.setScalar(.85 * T.MathUtils.smoothstep(night, 0, .35));
        }
        if (submarine.current) {
            submarine.current.visible = night > .015;
            const phase = (t % WORLD_DAY_SECONDS) / WORLD_DAY_SECONDS, a = phase * Math.PI * 2;
            submarine.current.position.set((phase - .5) * 84 + 9, 6.5 + Math.sin(t * .12) * .4, -31 + Math.cos(a) * 3);
            submarine.current.rotation.y = Math.atan2(Math.sin(a) * Math.PI * 6, 84);
        }
        if (halo.current)
            halo.current.uniforms.uStrength.value = night;
        if (beam.current)
            beam.current.uniforms.uStrength.value = night;
        if (lamp.current)
            lamp.current.opacity = night;
        blink.current.forEach((material, i) => {
            if (material)
                material.opacity = night * (.12 + .88 * Math.pow(Math.max(0, Math.sin(t * 3.1 + i * 2.1)), 8));
        });
    });
    return <>
        <group ref={angler} name="night-angler-fish" visible={false}>
            <mesh scale={[.85, .6, .48]}><icosahedronGeometry args={[1, 1]}/><WorldToonMaterial color="#276773" emissive="#0d3443" emissiveIntensity={.5}/></mesh>
            <mesh position={[-.95, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[.6, .7, .13]}><coneGeometry args={[.55, 1, 3]}/><WorldToonMaterial color="#205563"/></mesh>
            <mesh position={[0, -.05, .48]} rotation={[.3, 0, -.5]} scale={[.5, .3, .1]}><octahedronGeometry /><WorldToonMaterial color="#367c7c"/></mesh>
            <mesh geometry={lure}><WorldToonMaterial color="#467f76"/></mesh>
            {[-1, 1].map(side => <group key={side}>
                <mesh position={[.56, .14, side * .37]}><sphereGeometry args={[.13, 8, 6]}/><meshBasicMaterial color="#b5e8d0"/></mesh>
                <mesh position={[.61, .14, side * .46]}><sphereGeometry args={[.055, 8, 6]}/><meshBasicMaterial color="#081b27"/></mesh>
            </group>)}
            <mesh position={[1.25, .85, 0]}><sphereGeometry args={[.16, 10, 8]}/><meshBasicMaterial ref={lamp} color="#d5ffd1" transparent/></mesh>
            <mesh position={[1.25, .85, 0]} scale={2.1}><sphereGeometry args={[1, 16, 12]}/><shaderMaterial ref={halo} uniforms={haloUniforms} vertexShader={haloVertex} fragmentShader={haloFragment} transparent depthWrite={false} blending={T.AdditiveBlending}/></mesh>
        </group>
        <group ref={submarine} name="night-distant-submarine" visible={false} scale={1.1}>
            <mesh scale={[1.7, .62, .62]}><icosahedronGeometry args={[1, 1]}/><WorldToonMaterial color="#9c8748" emissive="#55411b" emissiveIntensity={.25}/></mesh>
            <mesh position={[-1.65, 0, 0]} scale={[.7, .12, 1.2]}><boxGeometry /><WorldToonMaterial color="#626f65"/></mesh>
            <mesh position={[-1.65, 0, 0]} scale={[.5, 1.1, .12]}><boxGeometry /><WorldToonMaterial color="#626f65"/></mesh>
            <mesh position={[-.1, .8, 0]}><cylinderGeometry args={[.10, .10, .9, 6]}/><WorldToonMaterial color="#6d7970"/></mesh>
            <mesh position={[.12, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.11, .11, .5, 6]}/><WorldToonMaterial color="#6d7970"/></mesh>
            {[-.7, .1, .85].map(x => <mesh key={x} position={[x, .05, .55]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.18, .18, .06, 10]}/><meshBasicMaterial color="#719b95"/></mesh>)}
            {[-1, 1].map((side, i) => <mesh key={side} position={[-.4, .5, side * .4]}><sphereGeometry args={[.09, 8, 6]}/><meshBasicMaterial ref={m => { blink.current[i] = m; }} color={i ? "#6af0d2" : "#ffa275"} transparent/></mesh>)}
            <mesh position={[1.6, 0, 0]}><sphereGeometry args={[.18, 8, 6]}/><meshBasicMaterial color="#e0f4c5"/></mesh>
            <mesh position={[5.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <coneGeometry args={[2.4, 7.6, 24, 1, true]}/>
                <shaderMaterial ref={beam} uniforms={beamUniforms} transparent depthWrite={false} side={T.DoubleSide} blending={T.AdditiveBlending} vertexShader={`varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;void main(){vUv=uv;vec4 mvPosition=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=-mvPosition.xyz;gl_Position=projectionMatrix*mvPosition;}`} fragmentShader={`varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;uniform float uStrength;void main(){float edge=smoothstep(.02,.5,abs(dot(normalize(vNormal),normalize(vView))));float fade=sin(vUv.y*3.14159)*vUv.y;gl_FragColor=vec4(.72,.93,.69,fade*edge*.085*uStrength);}`}/>
            </mesh>
        </group>
    </>;
}
/** Small, seeded beach finds share two instanced draws and follow the island surface. */
function IslandBeachDetails() {
    const quality = useWorldQuality();
    const stones = useRef<T.InstancedMesh>(null), shells = useRef<T.InstancedMesh>(null);
    const shellGeometry = useMemo(() => {
        const points: number[] = [];
        const rim = (i: number) => {
            const a = i / 12 * Math.PI, r = i % 2 ? .92 : 1;
            return [Math.cos(a) * r, i % 2 ? .04 : 0, Math.sin(a) * r];
        };
        for (let i = 0; i < 12; i++)
            points.push(0, .32, 0, ...rim(i), ...rim(i + 1));
        const geometry = new T.BufferGeometry();
        geometry.setAttribute("position", new T.Float32BufferAttribute(points, 3));
        geometry.computeVertexNormals();
        return geometry;
    }, []);
    useEffect(() => () => shellGeometry.dispose(), [shellGeometry]);
    const placements = useMemo(() => {
        const random = seededRandom(774), dummy = new T.Object3D();
        const count = quality === "low" ? 26 : 46;
        return Array.from({ length: count }, (_, i) => {
            let x = 0, z = 0;
            do {
                const a = random() * Math.PI * 2, r = 2.4 + random() * (SHORE - 2.8);
                x = Math.cos(a) * r;
                z = Math.sin(a) * r;
            } while ((Math.abs(x) < 5.8 && z > -4.2 && z < .5) || Math.hypot(x, z - 2) < 1.6);
            const shell = i % 2 === 0, size = shell ? .14 + random() * .13 : .10 + random() * .16;
            dummy.position.set(x, islandSurface(x, z) + (shell ? .008 : size * .28), z);
            dummy.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), islandNormal(x, z))
                .multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), random() * Math.PI * 2));
            dummy.scale.set(size, shell ? size : size * (.4 + random() * .3), size * (.7 + random() * .5));
            dummy.updateMatrix();
            return { shell, matrix: dummy.matrix.clone(), color: new T.Color(shell ? ["#fff0d8", "#e5c6c5", "#f1d3b0"][i % 3] : ["#9c9c8e", "#b5ad98", "#807f74"][i % 3]) };
        });
    }, [quality]);
    useEffect(() => {
        for (const [mesh, isShell] of [[stones.current, false], [shells.current, true]] as const) {
            if (!mesh)
                continue;
            placements.filter(p => p.shell === isShell).forEach((p, i) => { mesh.setMatrixAt(i, p.matrix); mesh.setColorAt(i, p.color); });
            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor)
                mesh.instanceColor.needsUpdate = true;
            mesh.computeBoundingSphere();
        }
    }, [placements]);
    return <group name="island-shells-and-pebbles">
        <instancedMesh ref={stones} args={[undefined, undefined, placements.filter(p => !p.shell).length]}><icosahedronGeometry args={[1, 0]}/><WorldToonMaterial /></instancedMesh>
        <instancedMesh ref={shells} args={[shellGeometry, undefined, placements.filter(p => p.shell).length]}><WorldToonMaterial side={T.DoubleSide}/></instancedMesh>
    </group>;
}
