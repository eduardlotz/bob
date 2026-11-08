import { memo, useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ShaderMaterial } from "three";
import { useAppStore, useViewStore } from "@/store";
import { useLibraryStore } from "@/store/exploration";
import { LIBRARY_MEDIA_ENABLED, LIBRARY_SHELVES } from "@/store/config/library";
import { LibraryRoom, LibraryDaylight, Stone } from "@/3d-objects/books/LibraryRoom";
import { useTemplateCover } from "@/3d-objects/TemplateCover";
import { libraryMedia, type MediaRecommendation } from "@/content/libraryMedia";
import { useI18n } from "@/i18n";
import { useFloatingBar } from "@/layout/FloatingBar";
import { explorationMessages } from "./exploration.messages";
import { createSceneLabelPosition } from "@/utils/sceneLabels";
import { ProjectedVideoScreen } from "@/3d-objects/ProjectedVideoScreen";
import { StaticLibraryBatch } from "@/3d-objects/books/StaticLibraryBatch";
import { ShelfBooks } from "@/3d-objects/books/ShelfBooks";
import { shelfDimensions, SHELF_BASE, SHELF_ROW_HEIGHT } from "@/3d-objects/books/libraryLayout";
import { useLibraryControls } from "@/3d-objects/books/useLibraryControls";
import { EngravedShelfLabel } from "@/3d-objects/books/EngravedShelfLabel";
import { getLibraryWorldTransform } from "@/store/config/libraryFraming";

function BookshelfStructure({ shelf }: { shelf: typeof LIBRARY_SHELVES[number] }) {
  const { width, height, rows } = shelfDimensions(shelf.status);
  return <group position={shelf.position} rotation={[0, shelf.rotation, 0]} userData={{ libraryShelf: shelf.status }}>
    <mesh position={[0, height / 2, -0.25]} receiveShadow><boxGeometry args={[width, height, 0.12]} /><Stone color="#87938e" /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * (width / 2 + 0.07), height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.14, height, 0.7]} /><Stone />
    </mesh>)}
    {Array.from({ length: rows + 1 }, (_, row) => <mesh key={row} position={[0, SHELF_BASE + row * SHELF_ROW_HEIGHT, 0]} castShadow receiveShadow>
      <boxGeometry args={[width, 0.14, 0.7]} /><Stone color="#b9bfbc" />
    </mesh>)}
    <mesh position={[0, 0.15, 0]} castShadow receiveShadow><boxGeometry args={[width + 0.35, 0.3, 0.82]} /><Stone color="#929d99" /></mesh>
    <mesh position={[0, height + 0.04, 0]} castShadow><boxGeometry args={[width + 0.35, 0.16, 0.82]} /><Stone color="#c6ccc8" /></mesh>
  </group>;
}

const LiteratureScenery = memo(function LiteratureScenery() {
  return <StaticLibraryBatch>
    <LibraryRoom />
    {LIBRARY_SHELVES.map(shelf => <BookshelfStructure key={shelf.status} shelf={shelf} />)}
  </StaticLibraryBatch>;
});

const MAGAZINE_COLORS = ["#6d8b77", "#ac765f", "#6f8da4"];
function Magazine({ entry, index }: { entry: MediaRecommendation; index: number }) {
  const texture = useTemplateCover({ title: entry.title, author: entry.author, accent: MAGAZINE_COLORS[index % 3] });
  const openMedia = useLibraryStore(state => state.openMedia);
  const { setHoveredObject } = useFloatingBar();
  return <group position={[-0.76 + index * 0.76, 0.62, 0]} rotation={[-0.22, index * 0.07 - 0.07, 0]}
    onClick={event => { event.stopPropagation(); openMedia("blogs", index); setHoveredObject(null); }}
    onPointerEnter={event => { event.stopPropagation(); setHoveredObject({ title: entry.title }); }} onPointerLeave={() => setHoveredObject(null)}
   >
    <mesh castShadow><boxGeometry args={[0.66, 0.99, 0.04]} /><meshToonMaterial color="#eee1c6" /></mesh>
    <mesh position={[0, 0, 0.022]}><planeGeometry args={[0.66, 0.99]} /><meshBasicMaterial map={texture} /></mesh>
  </group>;
}

function Television() {
  const openMedia = useLibraryStore(state => state.openMedia);
  const shader = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  const playing = useLibraryStore(state => state.playingVideo);
  const index = useLibraryStore(state => state.mediaIndex);
  const showOptions = useAppStore(state => state.showOptions);
  const video = libraryMedia.videos[index];
  const videoId = new URL(video.url).searchParams.get("v");
  const currentView = useViewStore(state => state.currentView);
  useFrame(({ clock }) => { if (shader.current) shader.current.uniforms.time.value = clock.elapsedTime; });
  return <group onClick={event => { event.stopPropagation(); openMedia("videos"); }}>
    <mesh castShadow><boxGeometry args={[1.8, 1.35, 1]} /><meshToonMaterial color="#99714f" /></mesh>
    <mesh position={[-0.15, 0.05, 0.51]}><boxGeometry args={[1.35, 1.04, 0.08]} /><meshToonMaterial color="#3b443e" /></mesh>
    <mesh position={[-0.15, 0.05, 0.555]} visible={!playing}>
      <planeGeometry args={[1.17, 0.85]} />
      <shaderMaterial ref={shader} uniforms={uniforms} toneMapped={false}
        vertexShader={`varying vec2 uvp;void main(){uvp=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`varying vec2 uvp;uniform float time;void main(){vec3 c=vec3(.24,.39,.43);float stripe=mod(floor(uvp.x*7.),7.);if(stripe<1.)c=vec3(.83,.79,.57);else if(stripe<2.)c=vec3(.64,.73,.57);else if(stripe<3.)c=vec3(.51,.64,.72);else if(stripe<4.)c=vec3(.75,.59,.55);else if(stripe<5.)c=vec3(.66,.61,.73);else if(stripe<6.)c=vec3(.48,.69,.63);c*=.88+.12*sin(uvp.y*440.+time*3.);c*=1.-.4*length(uvp-.5);gl_FragColor=vec4(c,1.);}`} />
    </mesh>
    {playing && !showOptions && currentView === "library:videos" && videoId && <ProjectedVideoScreen key={videoId} videoId={videoId} title={video.title} />}
    {[-0.25, 0.3].map(y => <mesh key={y} position={[0.69, y, 0.53]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.1, 0.1, 0.08, 12]} /><meshToonMaterial color="#d4b98a" /></mesh>)}
    {[-0.5, 0.5].map(x => <mesh key={x} position={[x, -0.88, 0]} rotation={[0, 0, x * -0.25]} castShadow><boxGeometry args={[0.1, 0.5, 0.1]} /><meshToonMaterial color="#6b5846" /></mesh>)}
    <mesh position={[0, 1.06, 0]} rotation={[0, 0, -0.4]}><cylinderGeometry args={[0.015, 0.015, 0.9, 6]} /><meshToonMaterial color="#7e8178" /></mesh>
  </group>;
}

export function LiteratureScene() {
  useLibraryControls();
  const width = useThree(state => state.size.width);
  const world = getLibraryWorldTransform();
  const { locale } = useI18n();
  const copy = explorationMessages[locale];
  const openMedia = useLibraryStore(state => state.openMedia);
  const showOptions = useAppStore(state => state.showOptions);
  const calculatePosition = useMemo(createSceneLabelPosition, []);
  return <>
    <LibraryDaylight />
    <ShelfBooks world={world} />
    <group position={world.position} scale={world.scale}>
      <LiteratureScenery />
      {LIBRARY_SHELVES.map(shelf => <EngravedShelfLabel key={shelf.status} shelf={shelf} />)}
      {LIBRARY_MEDIA_ENABLED && <group position={[-3.5, -0.94, 2.65]} rotation={[0, 0.35, 0]}>
        <Television />
        {!showOptions && width >= 760 && <Html position={[0, -1.07, 0.6]} calculatePosition={calculatePosition} center zIndexRange={[45, 0]}><button data-library-media="videos" onClick={() => openMedia("videos")} style={mediaLabelStyle}>{copy.videos}</button></Html>}
      </group>}
      {LIBRARY_MEDIA_ENABLED && <group position={[3.45, -1.02, 2.5]} rotation={[0, -0.3, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow receiveShadow><boxGeometry args={[2.6, 0.15, 1.1]} /><meshToonMaterial color="#bd936c" /></mesh>
        {[-1.05, 1.05].map(x => <mesh key={x} position={[x, -0.57, 0]}><boxGeometry args={[0.09, 1, 0.8]} /><meshToonMaterial color="#494a43" /></mesh>)}
        {libraryMedia.blogs.slice(0, 3).map((entry, index) => <Magazine key={entry.url} entry={entry} index={index} />)}
        {!showOptions && width >= 760 && <Html position={[0, -0.35, 0.7]} calculatePosition={calculatePosition} center zIndexRange={[45, 0]}><button data-library-media="blogs" onClick={() => openMedia("blogs")} style={mediaLabelStyle}>{copy.blogs}</button></Html>}
      </group>}
    </group>
  </>;
}

const mediaLabelStyle = { background: "#fff", color: "#212121", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 3px 9px #0002", borderRadius: 12, padding: "6px 11px", whiteSpace: "nowrap", fontWeight: 700, fontSize: 12, pointerEvents: "auto" } as const;
