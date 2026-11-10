import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Object3D, DirectionalLight, DoubleSide, InstancedBufferAttribute, InstancedBufferGeometry, PlaneGeometry, ShaderMaterial } from "three";
import { useCoreStore } from "@/store";
import { ABOUT_WINDOW, ABOUT_ROOM, ABOUT_LOUNGE, ABOUT_CIGARETTE_SMOKE_OFFSET } from "@/store/config/aboutRoom";
import { EnvironmentAudio } from "../worlds/EnvironmentAudio";
import { useAboutWindowStore } from "@/store/aboutWindow";
import type { EnvironmentAudioConfig } from "@/types/worldEnvironment";

const ABOUT_WEATHER_AUDIO: EnvironmentAudioConfig = {
  layers: [
    { soundId: "ambience-rain", mode: "loop", volume: .32, fadeSeconds: 1.4 },
    { soundId: "ambience-about-thunder", mode: "event", volume: .55 },
  ],
};

type Weather = {
  time: { value: number };
  flash: { value: number };
  boltX: { value: number };
};
const WeatherContext = createContext<Weather | null>(null);
export function useAboutWeather() {
  const value = useContext(WeatherContext);
  if (!value) throw new Error("About weather requires its room provider");
  return value;
}

export function AboutWeatherProvider({ children }: { children: ReactNode }) {
  const weather = useMemo<Weather>(() => ({ time: { value: 0 }, flash: { value: 0 }, boltX: { value: .68 } }), []);
  const schedule = useRef({ next: 5, strike: -100, thunder: Infinity });
  const cues = useRef<string[]>([]);
  const ready = useCoreStore(s => s.isReady);
  const paused = useCoreStore(s => s.isPaused);
  const open = useAboutWindowStore(s => s.open);
  const mix = useMemo(() => ({ gain: open ? 1 : .22, lowpassHz: open ? 12000 : 850 }), [open]);
  useFrame((_, delta) => {
    if (!ready || paused || document.hidden) { weather.flash.value = 0; return; }
    weather.time.value += Math.min(delta, .05);
    const now = weather.time.value;
    if (now >= schedule.current.next) {
      schedule.current.strike = now;
      schedule.current.next = now + 13 + Math.random() * 16;
      schedule.current.thunder = now + 1.8 + Math.random() * 2;
      weather.boltX.value = .22 + Math.random() * .56;
    }
    const age = now - schedule.current.strike;
    const pulse = (start: number, power: number) => age < start ? 0 : power * (1 - Math.exp(-(age - start) * 700)) * Math.exp(-(age - start) * 23);
    weather.flash.value = pulse(0, 1) + pulse(.14, .72) + pulse(.32, .28);
    if (now >= schedule.current.thunder) {
      cues.current.push("ambience-about-thunder");
      schedule.current.thunder = Infinity;
    }
  }, -4);
  return <WeatherContext.Provider value={weather}>{children}<EnvironmentAudio config={ABOUT_WEATHER_AUDIO} authorized={ready} mix={mix} cues={cues} /><AboutWindowWeather /><AboutLiveLighting /><AboutCigaretteSmoke /></WeatherContext.Provider>;
}

function AboutLiveLighting() {
  const weather = useAboutWeather();
  const light = useRef<DirectionalLight>(null);
  const lampTarget = useMemo(() => { const target = new Object3D(); target.position.set(4.15, ABOUT_ROOM.floorY + .7, 3.12); return target; }, []);
  useFrame(() => { if (light.current) light.current.intensity = .68 + weather.flash.value * 2.2; });
  return <>
    <hemisphereLight args={["#aab9d8", "#252936", .65]} />
    <directionalLight ref={light} position={[5.3, 2.2, -.5]} color="#afc3eb" intensity={.68} />
    {[.25, 2.75].map(z => <pointLight key={z} position={[-3.52, ABOUT_ROOM.floorY + 3.06, z]} color="#ffd2a0" intensity={.65} distance={3.8} decay={2} />)}
    <primitive object={lampTarget} />
    <spotLight position={[ABOUT_LOUNGE.lamp[0] - .08, ABOUT_ROOM.floorY + 2.35, ABOUT_LOUNGE.lamp[2] + .12]}
      target={lampTarget} color="#ffd09b" intensity={2.2} angle={.65} penumbra={.85} distance={4.5} decay={2} />
  </>;
}

const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const rainVertex = `
attribute vec4 aSeed;
uniform float uTime;
varying vec2 vUv;
varying float vRainAlpha;
void main(){
 vUv=uv;
 float speed=3.8+aSeed.w*3.2;
 float height=7.;
 float y=mod(aSeed.y*height-uTime*speed,height)-height*.5;
 vec3 center=vec3((aSeed.x-.5)*7.+y*.085,y,-.08-aSeed.z*3.2);
 vec2 streak=position.xy*vec2(.018+aSeed.w*.013,.26+aSeed.w*.29);
 center.xy+=vec2(streak.x+streak.y*.085,streak.y);
 vRainAlpha=.22+aSeed.z*.12;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(center,1.);
}`;
const rainFragment = `
varying vec2 vUv;
varying float vRainAlpha;
uniform float uFlash;
uniform vec3 uColor;
void main(){
  float streak=(1.-smoothstep(.08,.5,abs(vUv.x-.5)))*sin(vUv.y*3.14159);
  float a=streak*vRainAlpha*(1.+uFlash*1.8);
  if(a<.006)discard;
  gl_FragColor=vec4(uColor*(1.+uFlash*.7),a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const glassFragment = `
varying vec2 vUv;uniform float uTime,uFlash;
float hash(float n){return fract(sin(n*87.3)*43758.5453);}
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 runningDrop(vec2 uv,float columns,float speed,float offset){
 float lane=floor(uv.x*columns);float seed=hash(lane+offset);
 float head=1.-fract(uTime*speed*(.7+seed*.65)+seed*7.);
 float dx=fract(uv.x*columns)-(.25+.5*hash(seed*71.));
 dx-=sin(uv.y*12.+seed*9.)*.065;
 float dy=uv.y-head;
 float shape=length(vec2(dx/.105,dy/.014));
 float bead=(1.-smoothstep(.65,1.05,shape))*step(.14,seed);
 float trail=(1.-smoothstep(.012,.042,abs(dx)))*smoothstep(0.,.018,dy)*(1.-smoothstep(.025,.24,dy))*step(.14,seed);
 float glint=exp(-pow((dx+.028)/.025,2.)-pow((dy-.003)/.0038,2.))*step(.14,seed);
 return vec3(bead,trail,glint);
}
void main(){
 vec3 running=runningDrop(vUv,24.,.12,13.)+runningDrop(vUv+vec2(.017,0.),39.,.072,71.)*.65;
 vec2 cell=floor(vUv*vec2(28.,26.));float seed=hash2(cell);
 vec2 center=vec2(.22+.56*hash(seed*83.),.2+.6*hash(seed*97.));
 vec2 beadUv=(fract(vUv*vec2(28.,26.))-center)*vec2(1.,1.25);
 float radius=.07+.075*hash(seed*131.);float d=length(beadUv);
 float bead=(1.-smoothstep(radius*.75,radius,d))*step(.62,seed);
 float rim=smoothstep(radius*.45,radius*.8,d)*bead;
 float glint=exp(-dot(beadUv-vec2(-radius*.25,radius*.3),beadUv-vec2(-radius*.25,radius*.3))/(radius*radius*.055))*bead;
 // Brief, small impact rings and flecks appear where rain hits the glass.
 vec2 impactCell=floor(vUv*vec2(15.,13.));float impactSeed=hash2(impactCell+19.);
 float clock=uTime*1.25+impactSeed*13.;float cycle=floor(clock);float age=fract(clock);
 vec2 impactCenter=.2+.6*vec2(hash(impactSeed*57.+cycle),hash(impactSeed*91.-cycle));
 vec2 q=(fract(vUv*vec2(15.,13.))-impactCenter)*vec2(1.,1.2);
 float impactRadius=.025+age*.55;
 float hit=(1.-smoothstep(.012,.055,abs(length(q)-impactRadius)))*(1.-smoothstep(.035,.20,age));
 float flecks=pow(max(0.,sin(atan(q.y,q.x)*5.+impactSeed*8.)),9.);
 hit*=step(.64,hash(impactSeed*233.+cycle))*(.65+flecks*.35);
 float edge=pow(abs(vUv.x-.5)*2.,3.);
 float a=.018+edge*.025+bead*.11+rim*.07+glint*.24+running.x*.20+running.y*.12+running.z*.30+hit*.34;
 vec3 tint=vec3(.29,.38,.55)-rim*.10-running.x*.065+glint*.45+running.z*.40+hit*.22;
 gl_FragColor=vec4(tint+uFlash*.24,min(.68,a));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
const boltFragment = `
varying vec2 vUv;uniform float uFlash,uBoltX;
void main(){
 float y=vUv.y;
 float bend=sin(floor(y*28.)*19.7)*.018+sin(floor(y*63.)*7.3)*.009;
 float spine=uBoltX+(1.-y)*.08+bend;
 float d=abs(vUv.x-spine);
 float stroke=1.-smoothstep(.0008,.0028,d);
 float glow=exp(-d*110.)*.13;
 float branch=abs(vUv.x-(spine+(y-.53)*.45));
 stroke+= (1.-smoothstep(.0005,.0015,branch))*step(.34,y)*(1.-step(.53,y));
 float a=(stroke+glow)*uFlash*smoothstep(.18,.3,y);
 if(a<.004)discard;
 gl_FragColor=vec4(vec3(.79,.87,1.),min(a,1.));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

/** Each glass sheet follows its own authored sash, including rain running down the pane. */
export function AboutWindowGlass() {
  const weather = useAboutWeather();
  const uniforms = useMemo(() => ({ uTime: weather.time, uFlash: weather.flash, uBoltX: weather.boltX }), [weather]);
  return <mesh raycast={() => {}}>
    <planeGeometry args={ABOUT_WINDOW.glassSize} />
    <shaderMaterial uniforms={uniforms} vertexShader={vertex} fragmentShader={glassFragment} transparent depthWrite={false} side={DoubleSide} />
  </mesh>;
}

function AboutWindowWeather() {
  const weather = useAboutWeather();
  const rain = useRef<ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(1, 1);
    const result = new InstancedBufferGeometry();
    result.index = plane.index;
    result.setAttribute("position", plane.getAttribute("position"));
    result.setAttribute("uv", plane.getAttribute("uv"));
    let seed = 7843;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    result.setAttribute("aSeed", new InstancedBufferAttribute(Float32Array.from({ length: 560 * 4 }, random), 4));
    result.instanceCount = 560;
    plane.dispose();
    return result;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const rainUniforms = useMemo(() => ({ uTime: { value: 0 }, uFlash: weather.flash, uColor: { value: new Color("#bbcae4") } }), [weather]);
  const uniforms = useMemo(() => ({ uTime: weather.time, uFlash: weather.flash, uBoltX: weather.boltX }), [weather]);
  useFrame(() => {
    if (rain.current) rain.current.uniforms.uTime.value = weather.time.value;
  });
  return <group name="about-window-weather" position={[5.34, ABOUT_ROOM.floorY + 3.05, -.5]} rotation={[0, -Math.PI / 2, 0]}>
    <mesh geometry={geometry} frustumCulled={false} raycast={() => {}}>
      <shaderMaterial ref={rain} uniforms={rainUniforms} vertexShader={rainVertex} fragmentShader={rainFragment} transparent depthWrite={false} side={DoubleSide} />
    </mesh>
    <mesh position={[0, .3, -2.99]} raycast={() => {}}>
      <planeGeometry args={[12, 9]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertex} fragmentShader={boltFragment} transparent depthWrite={false} side={DoubleSide} />
    </mesh>
  </group>;
}


const smokeVertex = `
uniform float uTime;
varying vec2 vUv;
void main(){
 vUv=uv;
 vec3 center=vec3(modelViewMatrix*vec4(0.,0.,0.,1.));
 float rise=uv.y;
 float curl=sin(rise*8.-uTime*.85)*.024*rise+sin(rise*15.+uTime*.55)*.012*rise;
 center.xy+=vec2(position.x+curl,position.y);
 gl_Position=projectionMatrix*vec4(center,1.);
}`;
const smokeFragment = `
uniform float uTime;varying vec2 vUv;
void main(){
 float rise=vUv.y;
 float width=mix(.028,.12,rise);
 float line=exp(-pow((vUv.x-.5)/width,2.));
 float fade=smoothstep(0.,.12,rise)*(1.-smoothstep(.45,1.,rise));
 float drift=.72+.28*sin(rise*14.-uTime*1.1);
 float alpha=line*fade*drift*.19;
 if(alpha<.003)discard;
 gl_FragColor=vec4(.72,.75,.78,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

function AboutCigaretteSmoke() {
 const weather=useAboutWeather();
 const uniforms=useMemo(() => ({ uTime: weather.time }), [weather]);
 return <mesh name="about-cigarette-smoke" position={[ABOUT_LOUNGE.table[0]+ABOUT_CIGARETTE_SMOKE_OFFSET[0],ABOUT_LOUNGE.table[1]+ABOUT_CIGARETTE_SMOKE_OFFSET[1]+.19,ABOUT_LOUNGE.table[2]+ABOUT_CIGARETTE_SMOKE_OFFSET[2]]} raycast={() => {}} frustumCulled={false}>
  <planeGeometry args={[.22,.38]} />
  <shaderMaterial uniforms={uniforms} vertexShader={smokeVertex} fragmentShader={smokeFragment} transparent depthWrite={false} side={DoubleSide} />
 </mesh>;
}
