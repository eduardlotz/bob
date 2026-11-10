import { useGLTF, useTexture } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { AdditiveBlending, DoubleSide, FrontSide, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, SRGBColorSpace } from "three";
import { useAboutWeather } from "./AboutWeather";

export const ABOUT_ROOM_MODEL = "/gltf/about-me/about-me-shaded-v3.glb?revision=books-window-photos-20261110-6";
const LIGHTNING_MAP = "/gltf/about-me/about-room-lightning-bake-v3.png?revision=books-window-photos-20261110-6";
const WARM_MAP = "/gltf/about-me/about-room-warm-bake-v3.png?revision=books-window-photos-20261110-6";
const FRONT_LIGHTNING_MAP = "/gltf/about-me/about-front-wall-lightning-v3.png?revision=books-window-photos-20261110-6";
const FRONT_WARM_MAP = "/gltf/about-me/about-front-wall-warm-v3.png?revision=books-window-photos-20261110-6";

const RUG_LIGHTNING_MAP = "/gltf/about-me/about-rug-lightning-bake-v3.png?revision=books-window-photos-20261110-6";
const RUG_WARM_MAP = "/gltf/about-me/about-rug-warm-bake-v3.png?revision=books-window-photos-20261110-6";

const SOCIAL_LIGHTNING_MAP = "/gltf/about-me/about-socials-lightning-bake-v3.png?revision=books-window-photos-20261110-6";
const SOCIAL_WARM_MAP = "/gltf/about-me/about-socials-warm-bake-v3.png?revision=books-window-photos-20261110-6";

const reflectionShader = `
float aboutPane(float p,float a,float b,float blur){return smoothstep(a-blur,a+blur,p)*(1.-smoothstep(b-blur,b+blur,p));}
vec3 aboutWindowReflection(vec3 world){
 vec3 ray=world-cameraPosition;
 if(ray.x<=.001)return vec3(0.);
 float t=(5.2-world.x)/ray.x;
 if(t<=0.)return vec3(0.);
 vec3 hit=world+vec3(ray.x,-ray.y,ray.z)*t;
 float mask=aboutPane(hit.y,-.455,2.455,.20)*aboutPane(hit.z,-2.05,1.05,.20);
 mask*=1.-.8*exp(-pow((hit.y-1.)/.12,2.));
 mask*=1.-.8*exp(-pow((hit.z+.5)/.11,2.));
 float fresnel=pow(1.-clamp(abs(normalize(cameraPosition-world).y),0.,1.),2.);
 float grain=.88+.12*sin(world.x*75.+sin(world.z*11.));
 return vec3(.048,.072,.12)*mask*(.25+fresnel*1.5)*grain;
}`;

/** Named Blender parts keep interaction logic independent of authored geometry. */
export function BlenderRoomPart({ name, local = false, focused }: {
  name: string;
  local?: boolean;
  focused?: boolean;
}) {
  const { scene } = useGLTF(ABOUT_ROOM_MODEL);
  const weather = useAboutWeather();
  const [lightning, warm, rugLightning, rugWarm] = useTexture(name === "FrontWall"
    ? [FRONT_LIGHTNING_MAP, FRONT_WARM_MAP]
    : name.startsWith("Social_") ? [SOCIAL_LIGHTNING_MAP, SOCIAL_WARM_MAP]
    : name === "RoomShell" ? [LIGHTNING_MAP, WARM_MAP, RUG_LIGHTNING_MAP, RUG_WARM_MAP]
    : [LIGHTNING_MAP, WARM_MAP]);
  useLayoutEffect(() => {
    for (const map of [lightning, warm, rugLightning, rugWarm]) {
      if (!map) continue;
      map.flipY = false;
      map.colorSpace = SRGBColorSpace;
      map.needsUpdate = true;
    }
  }, [lightning, warm, rugLightning, rugWarm]);
  const managesFocus = focused !== undefined;
  const isDisplay = name.startsWith("Record_") || name.startsWith("Photo_");
  const { object, ownedMaterials, displayFocus } = useMemo(() => {
    const source = scene.getObjectByName(name);
    if (!source) throw new Error(`About Me model is missing part: ${name}`);
    const object = source.clone(true);
    const displayFocus = { value: 0 };
    const ownedMaterials: Material[] = [];
    if (local) {
      object.position.set(0, 0, 0);
      object.quaternion.identity();
      object.scale.set(1, 1, 1);
    }
    object.traverse(child => {
      if (!(child instanceof Mesh)) return;
      const copy = (material: Material) => {
        let clone = material.clone();
        if (name === "DjController") {
          clone.dispose();
          clone = new MeshStandardMaterial({ color: material.name.includes("jog") ? "#38383b" : material.name.includes("panel") ? "#29292d" : "#232327", roughness: .76, metalness: 0 });
          clone.name = "About controller dark grey plastic";
        } else if (name === "Exterior") {
          clone.dispose();
          clone = new MeshBasicMaterial({ color: "#1b2638", side: DoubleSide, fog: false, toneMapped: false });
          clone.name = "About dark storm sky";
        } else if (material.name.startsWith("About_Baked_") && material instanceof MeshStandardMaterial) {
          clone.dispose();
          clone = new MeshBasicMaterial({ map: material.emissiveMap ?? material.map, color: "#ffffff", side: material.side });
          clone.name = material.name;
        } else if ((["Exterior", "ExteriorTree", "ExteriorTreeSecond", "ExteriorBackdrop", "ExteriorMoon"].includes(name)) && material instanceof MeshStandardMaterial) {
          clone.dispose();
          clone = new MeshBasicMaterial({ color: material.color.clone().multiplyScalar(.72), side: material.side });
          clone.name = material.name;
        } else if (material instanceof MeshStandardMaterial && (material.map || material.name.startsWith("Photo back ") || material.name === "Photo dark oak frame" || material.name === "Photo matte black support" || material.name === "Photo paper edge" || material.name.startsWith("Record back "))) {
          clone.dispose();
          clone = new MeshBasicMaterial({ map: material.map, color: material.color, side: material.side });
          clone.name = material.name;
        }
        if (isDisplay) clone.side = FrontSide;
        if (name === "ExteriorMoon") {
          clone.transparent = true; clone.depthWrite = false;
          clone.blending = AdditiveBlending; clone.opacity = .28; clone.side = FrontSide;
        }
        if (clone.name.startsWith("About_Baked_")) {
          const wood = clone.name.endsWith("wood");
          const rug = clone.name.endsWith("rug");
          clone.onBeforeCompile = shader => {
            shader.uniforms.uAboutFlash = weather.flash;
            shader.uniforms.uAboutLightning = { value: rug ? rugLightning : lightning };
            shader.uniforms.uAboutWarm = { value: rug ? rugWarm : warm };
            shader.vertexShader = "varying vec3 vAboutWorld;varying vec3 vAboutNormal;\n" + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace("#include <worldpos_vertex>", `#include <worldpos_vertex>
              vAboutWorld=(modelMatrix*vec4(transformed,1.)).xyz;
              vAboutNormal=normalize((modelMatrix*vec4(normal,0.)).xyz);`);
            shader.fragmentShader = "uniform float uAboutFlash;uniform sampler2D uAboutLightning;uniform sampler2D uAboutWarm;varying vec3 vAboutWorld;varying vec3 vAboutNormal;\n" + reflectionShader + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>
              diffuseColor.rgb*=2.6;
              diffuseColor.rgb+=texture2D(uAboutWarm,vMapUv).rgb*2.6;
              diffuseColor.rgb+=texture2D(uAboutLightning,vMapUv).rgb*uAboutFlash*1.6;
              ${wood ? "if(vAboutNormal.y>.6 && vAboutWorld.y< -1.95)diffuseColor.rgb+=aboutWindowReflection(vAboutWorld)*(1.+uAboutFlash*2.5);" : ""}`);
          };
          clone.customProgramCacheKey = () => `about-baked-v5-${wood}-${rug}`;
        } else if (["Exterior", "ExteriorTree", "ExteriorTreeSecond", "ExteriorBackdrop", "ExteriorMoon"].includes(name)) {
          const tree = name.startsWith("ExteriorTree");
          const sky = name === "Exterior";
          const moon = name === "ExteriorMoon";
          const leaves = material.name.startsWith("Forest leaf");
          clone.onBeforeCompile = shader => {
            shader.uniforms.uAboutFlash = weather.flash;
            shader.uniforms.uAboutTime = weather.time;
            if (tree) {
              shader.vertexShader = "uniform float uAboutTime;\n" + shader.vertexShader;
              shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
                vec3 treeWorld=(modelMatrix*vec4(transformed,1.)).xyz;
                float height=max(0.,treeWorld.y+2.85);
                float gust=sin(uAboutTime*1.15-treeWorld.z*.19+treeWorld.x*.24)+.35*sin(uAboutTime*.47);
                vec3 wind=vec3(gust*.11,0.,gust*.055)*height*height*.12;
                ${leaves ? "wind+=vec3(sin(uAboutTime*3.1+treeWorld.z*5.+treeWorld.y*3.)*.035,cos(uAboutTime*2.7+treeWorld.x*5.)*.018,0.);" : ""}
                transformed+=inverse(mat3(modelMatrix))*wind;`);
            } else {
              shader.vertexShader = "varying vec3 vSkyWorld;\n" + shader.vertexShader;
              shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n vSkyWorld=(modelMatrix*vec4(transformed,1.)).xyz;");
              shader.fragmentShader = `varying vec3 vSkyWorld;
                float skyHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
                float skyNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(skyHash(i),skyHash(i+vec2(1.,0.)),f.x),mix(skyHash(i+vec2(0.,1.)),skyHash(i+vec2(1.)),f.x),f.y);}
                \n` + shader.fragmentShader;
            }
            if (moon) {
              shader.vertexShader = "varying float vMoonEdge;\n" + shader.vertexShader;
              shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
                vMoonEdge=abs(dot(normalize(mat3(modelViewMatrix)*normalize(position)),normalize(-(modelViewMatrix*vec4(transformed,1.)).xyz)));`);
              shader.fragmentShader = "varying float vMoonEdge;\n" + shader.fragmentShader;
            }
            shader.fragmentShader = "uniform float uAboutFlash;uniform float uAboutTime;\n" + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n diffuseColor.rgb*=1.+uAboutFlash*2.8;");
            if (!tree && !sky && !moon) shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
              float haze=clamp((vSkyWorld.x-13.)/28.,0.,.65);
              diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.10,.14,.19),haze);`);
            if (sky || moon) shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>
              vec2 cloudUv=vec2(vSkyWorld.z*.19+uAboutTime*.018,vSkyWorld.y*.32);
              float cloud=skyNoise(cloudUv)*.57+skyNoise(cloudUv*2.1)*.28+skyNoise(cloudUv*4.3)*.15;
              ${moon ? "float veil=smoothstep(.30,.72,cloud)*.52+.16; diffuseColor.rgb*=veil; diffuseColor.a*=smoothstep(.0,.40,vMoonEdge);" : "diffuseColor.rgb*=mix(.54,1.15,smoothstep(.18,.8,cloud));"}`);
          };
          clone.customProgramCacheKey = () => `about-exterior-v6-${tree}-${sky}-${moon}-${leaves}`;
        } else if (isDisplay && clone instanceof MeshBasicMaterial) {
          const gradient = clone.map ? "mix(.94,1.03,vMapUv.y)" : "1.";
          clone.onBeforeCompile = shader => {
            shader.uniforms.uAboutFlash = weather.flash;
            shader.uniforms.uDisplayFocus = displayFocus;
            shader.fragmentShader = "uniform float uAboutFlash;uniform float uDisplayFocus;\n" + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>
              vec3 illumination=mix(vec3(.56,.59,.65),vec3(.85,.87,.9),uDisplayFocus);
              diffuseColor.rgb*=illumination*${gradient}*(1.+uAboutFlash*.4);`);
          };
          clone.customProgramCacheKey = () => "about-artwork-lit-v3";
        }
        ownedMaterials.push(clone);
        return clone;
      };
      child.material = Array.isArray(child.material) ? child.material.map(copy) : copy(child.material);
    });
    return { object, ownedMaterials, displayFocus };
  }, [scene, name, local, managesFocus, isDisplay, weather, lightning, warm, rugLightning, rugWarm]);

  useLayoutEffect(() => {
    displayFocus.value = focused ? 1 : 0;
    if (!managesFocus) return;
    object.traverse(child => {
      if (!(child instanceof Mesh)) return;
      // Artwork sits just in front of its modeled sleeve or backing.
      child.renderOrder = focused ? (child.name.includes("artwork") || child.name.includes("image") ? 1002 : 1001) : 0;
    });
    for (const material of ownedMaterials) {
      // Focus is already in front of the room. Keep depth so the sheet/sleeve
      // occludes its reverse face and the photo's stand correctly as it turns.
      material.depthTest = true;
      material.depthWrite = true;
    }
  }, [object, ownedMaterials, focused, managesFocus, displayFocus]);

  useEffect(() => () => ownedMaterials.forEach(material => material.dispose()), [ownedMaterials]);
  return <primitive object={object} dispose={null} />;
}

useGLTF.preload(ABOUT_ROOM_MODEL);
useTexture.preload(LIGHTNING_MAP);
useTexture.preload(WARM_MAP);
