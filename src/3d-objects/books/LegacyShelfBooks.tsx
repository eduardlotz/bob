import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { BOOKS, type Book } from "@/store/books";
import { LIBRARY_SHELVES } from "@/store/config/library";
import { shelfBookLayout } from "./libraryLayout";

function LegacyBook({ book, index }: { book: Book; index: number }) {
  const { height, position } = shelfBookLayout(book, index);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 64; canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = book.fallbackBackgroundColor; ctx.fillRect(0, 0, 64, 512);
    ctx.fillStyle = book.fallbackTextColor; ctx.font = "800 23px Nunito, sans-serif";
    ctx.save(); ctx.translate(42, 475); ctx.rotate(-Math.PI / 2); ctx.fillText(book.title, 0, 0, 430); ctx.restore();
    ctx.fillRect(8, 25, 48, 4); ctx.fillRect(8, 39, 48, 2);
    const result = new CanvasTexture(canvas); result.colorSpace = SRGBColorSpace; return result;
  }, [book]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <group position={position} userData={{ foregroundOutline: "foreground", outlineThickness: 0.003 }}>
    <mesh castShadow receiveShadow><boxGeometry args={[0.175, height, 0.47]} /><meshStandardMaterial color={book.fallbackBackgroundColor} roughness={0.85} /></mesh>
    <mesh position={[0, 0, 0.237]}><planeGeometry args={[0.174, height]} /><meshBasicMaterial map={texture} /></mesh>
  </group>;
}
export function LegacyShelfBooks() {
  return <>{LIBRARY_SHELVES.map(shelf => <group key={shelf.status} position={shelf.position} rotation={[0, shelf.rotation, 0]}>
    {BOOKS.filter(book => book.status === shelf.status).map((book, index) => <LegacyBook key={book.id} book={book} index={index} />)}
  </group>)}</>;
}
