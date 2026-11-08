import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, DirectionalLight, DoubleSide, InstancedBufferAttribute, InstancedBufferGeometry, PlaneGeometry, ShaderMaterial } from "three";
import { useCoreStore } from "@/store";
import { ABOUT_ROOM } from "@/store/config/aboutRoom";
import { addSoundConfig, playSound, removeSoundConfig, setSoundMix, stopSoundsById } from "@/utils/soundSystem";

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
  const activeAudio = useRef<{ rain: string; thunder: string } | null>(null);
  const [visible, setVisible] = useState(() => !document.hidden);
  const ready = useCoreStore(s => s.isReady);
  const paused = useCoreStore(s => s.isPaused);
  const audioEnabled = useCoreStore(s => s.isReady && !s.isPaused && s.soundSystem.enabled && s.soundSystem.masterVolume > 0 && s.soundSystem.worldVolume > 0 && s.soundSystem.worldEnabled !== false);
  useEffect(() => {
    const visibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  useEffect(() => {
    if (!audioEnabled || !visible) return;
    const session = crypto.randomUUID();
    const ids = { rain: `about-rain:${session}`, thunder: `about-thunder:${session}` };
    activeAudio.current = ids;
    addSoundConfig({ id: ids.rain, filePath: "/audio/ambience/rain.wav", type: "world", category: "ambient", volume: .32, loop: true, preload: true, fadeIn: 1400, fadeOut: 300, distanceAttenuation: true, playback: { group: ids.rain, overlap: "ignore", maxConcurrent: 1 } });
    addSoundConfig({ id: ids.thunder, filePath: "/audio/ambience/about-thunder.wav", type: "world", category: "ambient", volume: .55, loop: false, preload: true, fadeIn: 50, fadeOut: 300, distanceAttenuation: true, playback: { group: ids.thunder, overlap: "restart", maxConcurrent: 1 } });
    setSoundMix(ids.rain, { gain: 1, lowpassHz: 2200 });
    setSoundMix(ids.thunder, { gain: 1, lowpassHz: 1500 });
    playSound(ids.rain);
    return () => {
      activeAudio.current = null;
      for (const id of Object.values(ids)) {
        stopSoundsById(id, 250);
        window.setTimeout(() => { removeSoundConfig(id); setSoundMix(id); }, 280);
      }
    };
  }, [audioEnabled, visible]);
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
      if (audioEnabled && visible && activeAudio.current) playSound(activeAudio.current.thunder);
      schedule.current.thunder = Infinity;
    }
  }, -4);
  return <WeatherContext.Provider value={weather}>{children}<AboutWindowWeather /><AboutLiveLighting /></WeatherContext.Provider>;
}

function AboutLiveLighting() {
  const weather = useAboutWeather();
  const light = useRef<DirectionalLight>(null);
  useFrame(() => { if (light.current) light.current.intensity = .68 + weather.flash.value * 2.2; });
  return <>
    <hemisphereLight args={["#aab9d8", "#252936", .65]} />
    <directionalLight ref={light} position={[5.3, 2.2, -.5]} color="#afc3eb" intensity={.68} />
    <pointLight position={[-3.6, ABOUT_ROOM.floorY + 2.7, .1]} color="#ffc077" intensity={2.5} distance={4.8} decay={2} />
    <pointLight position={[-3.65, ABOUT_ROOM.floorY + 2.45, 3]} color="#ffb768" intensity={1.5} distance={4.2} decay={2} />
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
 float speed=1.65+aSeed.w*1.45;
 float height=7.;
 float y=mod(aSeed.y*height-uTime*speed,height)-height*.5;
 vec3 center=vec3((aSeed.x-.5)*7.+y*.085,y,-.08-aSeed.z*1.7);
 vec2 streak=position.xy*vec2(.012+aSeed.w*.009,.17+aSeed.w*.20);
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
void main(){
 float col=floor(vUv.x*48.);float h=hash(col);
 float runningY=vUv.y+uTime*(.055+h*.035);
 float x=fract(vUv.x*48.)-.5-sin(runningY*8.+h*12.)*.12;
 float trail=(1.-smoothstep(.025,.075,abs(x)))*step(.77,h);
 float drop=pow(max(0.,1.-abs(fract(vUv.y*2.4+uTime*(.18+h*.12)+h)-.5)*2.),22.);
 float edge=pow(abs(vUv.x-.5)*2.,3.);
 float a=.025+edge*.035+trail*(.025+drop*.38);
 gl_FragColor=vec4(vec3(.29,.38,.55)+uFlash*.24,a);
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

function AboutWindowWeather() {
  const weather = useAboutWeather();
  const rain = useRef<ShaderMaterial>(null);
  const glass = useRef<ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(1, 1);
    const result = new InstancedBufferGeometry();
    result.index = plane.index;
    result.setAttribute("position", plane.getAttribute("position"));
    result.setAttribute("uv", plane.getAttribute("uv"));
    let seed = 7843;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    result.setAttribute("aSeed", new InstancedBufferAttribute(Float32Array.from({ length: 240 * 4 }, random), 4));
    result.instanceCount = 240;
    plane.dispose();
    return result;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const rainUniforms = useMemo(() => ({ uTime: { value: 0 }, uFlash: weather.flash, uColor: { value: new Color("#bbcae4") } }), [weather]);
  const uniforms = useMemo(() => ({ uTime: weather.time, uFlash: weather.flash, uBoltX: weather.boltX }), [weather]);
  useFrame(() => {
    if (rain.current) rain.current.uniforms.uTime.value = weather.time.value;
    if (glass.current) glass.current.uniforms.uTime.value = weather.time.value;
  });
  return <group name="about-window-weather" position={[5.34, ABOUT_ROOM.floorY + 3.05, -.5]} rotation={[0, -Math.PI / 2, 0]}>
    <mesh geometry={geometry} frustumCulled={false} raycast={() => {}}>
      <shaderMaterial ref={rain} uniforms={rainUniforms} vertexShader={rainVertex} fragmentShader={rainFragment} transparent depthWrite={false} side={DoubleSide} />
    </mesh>
    <mesh position={[0, 0, .17]} raycast={() => {}}>
      <planeGeometry args={[3.01, 2.89]} />
      <shaderMaterial ref={glass} uniforms={uniforms} vertexShader={vertex} fragmentShader={glassFragment} transparent depthWrite={false} side={DoubleSide} />
    </mesh>
    <mesh position={[0, .3, -2.99]} raycast={() => {}}>
      <planeGeometry args={[12, 9]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertex} fragmentShader={boltFragment} transparent depthWrite={false} side={DoubleSide} />
    </mesh>
  </group>;
}
