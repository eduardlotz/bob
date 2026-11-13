export function BlobFormIcon({ form }: { form: "sphere" | "egg" | "cube" | "cuboid" }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {form === "sphere" && <circle cx="12" cy="12" r="9" />}
    {form === "egg" && <path d="M20 14c0 5-3.6 8-8 8s-8-3-8-8S8 2 12 2s8 7 8 12Z" />}
    {form === "cube" && <rect x="4" y="4" width="16" height="16" rx="1" />}
    {form === "cuboid" && <rect x="6" y="2" width="12" height="20" rx="1" />}
  </svg>;
}
