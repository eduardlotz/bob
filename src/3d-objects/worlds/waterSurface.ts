import * as T from "three";
import { seededRandom } from "./quality";

/** Baked height noise; independently offset neighboring samples hide the underlying tile. */
export function waveTexture() {
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
export const waterVertex = `varying vec2 vSea; uniform float uTime;
#include <fog_pars_vertex>
void main(){vSea=position.xz; vec3 transformed=position;
transformed.y += sin(position.x*.65+uTime*.65)*.055+cos(position.z*.8-uTime*.45)*.04;
vec4 mvPosition=modelViewMatrix*vec4(transformed,1.); gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`;
export const waterFragment = `varying vec2 vSea; uniform float uTime; uniform float uDay; uniform sampler2D uWaves;
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
void main(){float a=atan(vSea.y,vSea.x); float shore=8.40+sin(a*3.)*.10+cos(a*5.)*.055;
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
