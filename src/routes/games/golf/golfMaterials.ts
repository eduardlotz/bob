import * as T from 'three';

const materials = new WeakMap<T.Material, T.Material>();
const moss = new T.Color('#4d673b');
const timber = new T.Color('#72533c');
const brick = new T.Color('#944f43');
const ochre = new T.Color('#a78a55');
const slate = new T.Color('#59676b');
const cream = new T.Color('#c6bda6');

/** Recolour the pack's shared palette in the material, preserving its texture and UVs. */
function gardenMaterial(source: T.Material) {
  const cached = materials.get(source);
  if (cached) return cached;
  const material = source.clone();
  material.onBeforeCompile = (shader, renderer) => {
    source.onBeforeCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, {
      golfMoss: { value: moss }, golfTimber: { value: timber }, golfBrick: { value: brick },
      golfOchre: { value: ochre }, golfSlate: { value: slate }, golfCream: { value: cream },
    });
    shader.fragmentShader = `uniform vec3 golfMoss, golfTimber, golfBrick, golfOchre, golfSlate, golfCream;\n${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #include <map_fragment>
      vec3 kit = diffuseColor.rgb;
      float peak = max(kit.r, max(kit.g, kit.b));
      float low = min(kit.r, min(kit.g, kit.b));
      vec3 natural = kit;
      if (peak - low < .045) natural = golfCream * peak;
      else if (kit.g > kit.r * 1.12 && kit.g > kit.b * 1.08) natural = golfMoss * (.72 + .38 * sqrt(peak));
      else if (kit.r > kit.g * 1.08 && kit.r > kit.b * 1.08) {
        natural = kit.g < kit.r * .2 ? golfBrick : (kit.g > kit.r * .65 ? golfOchre : golfTimber);
        natural *= .72 + .38 * sqrt(peak);
      } else natural = mix(vec3(dot(kit, vec3(.2126, .7152, .0722))), golfSlate, .7) * .85;
      diffuseColor.rgb = natural;
    `);
  };
  material.customProgramCacheKey = () => `${source.customProgramCacheKey()}:golf-garden-palette-v1`;
  materials.set(source, material);
  return material;
}
export function gardenGolfModel(scene: T.Group) {
  const model = scene.clone(true);
  model.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    object.material = Array.isArray(object.material) ? object.material.map(gardenMaterial) : gardenMaterial(object.material);
  });
  return model;
}
