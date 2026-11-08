import { useGLTF, useTexture } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { FrontSide, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, SRGBColorSpace } from "three";
import { useAboutWeather } from "./AboutWeather";

export const ABOUT_ROOM_MODEL = "/gltf/about-me/about-me-shaded-v3.glb?revision=two-sided-5";
const LIGHTNING_MAP = "/gltf/about-me/about-room-lightning-bake-v3.png?revision=soft-2";
const WARM_MAP = "/gltf/about-me/about-room-warm-bake-v3.png?revision=soft-2";

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
  const lightning = useTexture(LIGHTNING_MAP);
  const warm = useTexture(WARM_MAP);
  useLayoutEffect(() => {
    for (const map of [lightning, warm]) {
      map.flipY = false;
      map.colorSpace = SRGBColorSpace;
      map.needsUpdate = true;
    }
  }, [lightning, warm]);
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
        if (material.name.startsWith("About_Baked_") && material instanceof MeshStandardMaterial) {
          clone.dispose();
          clone = new MeshBasicMaterial({ map: material.emissiveMap ?? material.map, color: "#ffffff", side: material.side });
          clone.name = material.name;
        } else if (name === "Exterior" && material instanceof MeshStandardMaterial) {
          clone.dispose();
          clone = new MeshBasicMaterial({ color: material.color.clone().multiplyScalar(.72), side: material.side });
          clone.name = material.name;
        } else if (material instanceof MeshStandardMaterial && (material.map || material.name.startsWith("Photo back ") || material.name === "Photo paper edge" || material.name.startsWith("Record back "))) {
          clone.dispose();
          clone = new MeshBasicMaterial({ map: material.map, color: material.color, side: material.side });
          clone.name = material.name;
        }
        if (isDisplay) clone.side = FrontSide;
        if (clone.name.startsWith("About_Baked_")) {
          const wood = clone.name.endsWith("wood");
          const rug = clone.name.endsWith("rug");
          const plant = clone.name.endsWith("plant");
          clone.onBeforeCompile = shader => {
            shader.uniforms.uAboutFlash = weather.flash;
            shader.uniforms.uAboutLightning = { value: lightning };
            shader.uniforms.uAboutWarm = { value: warm };
            shader.vertexShader = "varying vec3 vAboutWorld;varying vec3 vAboutNormal;\n" + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace("#include <worldpos_vertex>", `#include <worldpos_vertex>
              vAboutWorld=(modelMatrix*vec4(transformed,1.)).xyz;
              vAboutNormal=normalize((modelMatrix*vec4(normal,0.)).xyz);`);
            shader.fragmentShader = "uniform float uAboutFlash;uniform sampler2D uAboutLightning;uniform sampler2D uAboutWarm;varying vec3 vAboutWorld;varying vec3 vAboutNormal;\n" + reflectionShader + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>
              diffuseColor.rgb*=2.6;
              diffuseColor.rgb+=texture2D(uAboutWarm,vMapUv).rgb*2.6;
              diffuseColor.rgb+=texture2D(uAboutLightning,vMapUv).rgb*uAboutFlash*1.6;
              ${wood ? "if(vAboutNormal.y>.6 && vAboutWorld.y< -1.95)diffuseColor.rgb+=aboutWindowReflection(vAboutWorld)*(1.+uAboutFlash*2.5);" : ""}
              ${rug ? "diffuseColor.rgb*=.985+.015*sin(vAboutWorld.x*580.)*sin(vAboutWorld.z*580.);" : ""}`);
            if (plant) shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>
              float leafFill=.65+.35*abs(dot(normalize(vAboutNormal),normalize(vec3(.8,.45,-.2))));
              diffuseColor.rgb+=vec3(.0069,.0092,.0038)*leafFill;`);
          };
          clone.customProgramCacheKey = () => `about-baked-v3-${wood}-${rug}-${plant}`;
        } else if (name === "Exterior") {
          clone.onBeforeCompile = shader => {
            shader.uniforms.uAboutFlash = weather.flash;
            shader.fragmentShader = "uniform float uAboutFlash;\n" + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n diffuseColor.rgb*=1.+uAboutFlash*2.8;");
          };
          clone.customProgramCacheKey = () => "about-exterior-v2";
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
  }, [scene, name, local, managesFocus, isDisplay, weather, lightning, warm]);

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
