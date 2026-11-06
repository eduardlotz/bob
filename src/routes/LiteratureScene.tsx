import { memo, useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ShaderMaterial, type Texture } from "three";
import { BOOKS, useAppStore, useViewStore } from "@/store";
import { useLibraryStore } from "@/store/exploration";
import { LIBRARY_MEDIA_ENABLED, LIBRARY_SHELVES } from "@/store/config/library";
import { LibraryRoom, LibraryBackWall, LibraryCandle, Oak, useLibraryOak } from "@/3d-objects/books/LibraryRoom";
import { SceneChip } from "@/components/SceneChip";
import { PottedPlant } from "@/3d-objects/WorkCorner";
import { useTemplateCover } from "@/3d-objects/TemplateCover";
import { libraryMedia, type MediaRecommendation } from "@/content/libraryMedia";
import { useI18n } from "@/i18n";
import { useFloatingBar } from "@/layout/FloatingBar";
import { explorationMessages } from "./exploration.messages";
import { createSceneLabelPosition } from "@/utils/sceneLabels";
import { ProjectedVideoScreen } from "@/3d-objects/ProjectedVideoScreen";
import { StaticLibraryBatch } from "@/3d-objects/books/StaticLibraryBatch";
import { LegacyShelfBooks } from "@/3d-objects/books/LegacyShelfBooks";
import { ShelfBooks } from "@/3d-objects/books/ShelfBooks";
import { FocusedShelfBook } from "@/3d-objects/books/FocusedShelfBook";
import { LibraryProfile } from "@/3d-objects/books/LibraryProfile";
import { useLibraryControls } from "@/3d-objects/books/useLibraryControls";

function BookshelfStructure({ shelf, oak }: { shelf: typeof LIBRARY_SHELVES[number]; oak: Texture }) {
  const books = BOOKS.filter(book => book.status === shelf.status);
  return <group position={shelf.position} rotation={[0, shelf.rotation, 0]} userData={{ libraryShelf: shelf.status }}>
    <group userData={{ foregroundOutline: "foreground" }}>
      <mesh position={[0, 1.98, -0.21]} receiveShadow><boxGeometry args={[3.65, 3.96, 0.12]} /><Oak texture={oak} color="#493023" /></mesh>
      {[-1.86, 1.86].map(x => <mesh key={x} position={[x, 1.98, 0]} castShadow receiveShadow><boxGeometry args={[0.16, 3.96, 0.8]} /><Oak texture={oak} color="#896447" /></mesh>)}
      {[0.3, 1.16, 2.02, 2.88, 3.88].map(y => <mesh key={y} position={[0, y, 0]} castShadow receiveShadow><boxGeometry args={[3.65, 0.14, 0.8]} /><Oak texture={oak} color="#987250" /></mesh>)}
    </group>
    <group userData={{ foregroundOutline: "foreground" }}>
      {[0.13, 3.94, 4.09].map((y, i) => <mesh key={y} position={[0, y, 0.03]} castShadow receiveShadow><boxGeometry args={[3.98 + i * 0.06, 0.13, 0.94 + i * 0.04]} /><Oak texture={oak} color="#765337" /></mesh>)}
      {[-1.85, 1.85].map(x => <group key={x} position={[x, 0, 0.44]}>
        <mesh position={[0, 2.02, 0]} castShadow><cylinderGeometry args={[0.095, 0.12, 3.65, 10]} /><Oak texture={oak} color="#a17a53" /></mesh>
        {[0.4, 3.64].map(y => <mesh key={y} position={[0, y, 0]}><boxGeometry args={[0.25, 0.11, 0.2]} /><Oak texture={oak} color="#b08a5a" /></mesh>)}
      </group>)}
      <mesh position={[0, 4.16, 0.23]} scale={[1, 0.6, 0.22]}><sphereGeometry args={[0.22, 12, 8]} /><meshStandardMaterial color="#b18a4e" roughness={0.5} metalness={0.5} /></mesh>
    </group>
    <LibraryCandle position={[-1.35, 2.96, 0.08]} />
    <LibraryCandle position={[-1.08, 2.96, 0.08]} scale={0.7} />
    {books.length < 16 && <group position={[1.15, 1.23, 0.05]}><PottedPlant scale={0.55} /></group>}
  </group>;
}

function BookshelfLabel({ shelf }: { shelf: typeof LIBRARY_SHELVES[number] }) {
  const width = useThree(state => state.size.width);
  const { messages } = useI18n();
  const browse = useLibraryStore(state => state.browse);
  const showOptions = useAppStore(state => state.showOptions);
  const books = BOOKS.filter(book => book.status === shelf.status);
  const focusedBook = useLibraryStore(state => state.bookId);
  const currentView = useViewStore(state => state.currentView);
  const calculatePosition = useMemo(() => {
    const project = createSceneLabelPosition();
    return (...args: Parameters<typeof project>) => {
      const [x, y] = project(...args);
      const width = args[2].width;
      return width < 760 ? [Math.max(64, Math.min(width - 64, x)), y + (shelf.rotation ? 28 : -12)] : [x, y];
    };
  }, [shelf.rotation]);
  return <group position={shelf.position} rotation={[0, shelf.rotation, 0]}>
    {width < 760 && currentView.startsWith("library") && !showOptions && focusedBook === null && <Html position={[0, 4.47, 0.15]} calculatePosition={calculatePosition} center zIndexRange={[45, 0]}>
      <SceneChip type="button" data-library-shelf={shelf.status} onClick={() => browse(shelf.status)} style={{ fontSize: width < 760 ? 11 : 14, width: width < 760 ? 112 : undefined, maxWidth: width < 760 ? 112 : undefined, whiteSpace: width < 760 ? "normal" : "nowrap" }}>
        {messages.books.statuses[shelf.status]} · {books.length}
      </SceneChip>
    </Html>}
  </group>;
}

const LiteratureScenery = memo(function LiteratureScenery({ oak }: { oak: Texture }) {
  return <StaticLibraryBatch>
    <LibraryRoom oak={oak} />
    {LIBRARY_SHELVES.map(shelf => <BookshelfStructure key={shelf.status} shelf={shelf} oak={oak} />)}
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
    userData={{ foregroundOutline: "foreground", outlineThickness: 0.006 }}>
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
  return <group userData={{ foregroundOutline: "foreground" }} onClick={event => { event.stopPropagation(); openMedia("videos"); }}>
    <mesh castShadow><boxGeometry args={[1.8, 1.35, 1]} /><meshToonMaterial color="#99714f" /></mesh>
    <mesh position={[-0.15, 0.05, 0.51]}><boxGeometry args={[1.35, 1.04, 0.08]} /><meshToonMaterial color="#3b443e" /></mesh>
    <mesh position={[-0.15, 0.05, 0.555]} userData={{ foregroundOutline: false }} visible={!playing}>
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
  const oak = useLibraryOak();
  const width = useThree(state => state.size.width);
  const { locale } = useI18n();
  const copy = explorationMessages[locale];
  const openMedia = useLibraryStore(state => state.openMedia);
  const showOptions = useAppStore(state => state.showOptions);
  const calculatePosition = useMemo(createSceneLabelPosition, []);
  return <>
    {import.meta.env.DEV && new URLSearchParams(window.location.search).has("library-profile") && <LibraryProfile />}
    <LiteratureScenery oak={oak} />
    <LibraryBackWall oak={oak} />
    {new URLSearchParams(window.location.search).has("library-baseline") ? <LegacyShelfBooks /> : <ShelfBooks />}
    {LIBRARY_SHELVES.map(shelf => <BookshelfLabel key={shelf.status} shelf={shelf} />)}
    <FocusedShelfBook />
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
  </>;
}

const mediaLabelStyle = { background: "#fff", color: "#212121", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 3px 9px #0002", borderRadius: 12, padding: "6px 11px", whiteSpace: "nowrap", fontWeight: 700, fontSize: 12, pointerEvents: "auto" } as const;
