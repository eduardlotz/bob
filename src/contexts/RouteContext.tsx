import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useRouter } from "next/router";
import { ObjectFactory } from "@/molecules/ObjectFactory";

export interface RouteConfig {
  id: string;
  label: string;
  href: string;
  backgroundGradient: string;
  sceneObjects: SceneObject[];
  blobCostume?: BlobCostume;
}

export interface SceneObject {
  id: string;
  type: "primitive" | "model" | "custom";
  position: [number, number, number];
  scale: [number, number, number];
  color?: string;
  geometry?: "sphere" | "cube" | "cylinder" | "torus";
  objectType?:
    | "camera"
    | "trophy"
    | "book"
    | "graduationCap"
    | "palette"
    | "paintbrush"
    | "canvas"
    | "codeBlock"
    | "laptop"
    | "server"
    | "message"
    | "guestbook"
    | "pen";
  onClick?: () => void;
  dialogContent?: string;
  dialogTitle?: string;
  orbitRadius?: number;
  orbitSpeed?: number;
}

export interface BlobCostume {
  headColor: string;
  eyeColor: string;
  accessories?: string[];
}

interface RouteContextType {
  currentRoute: RouteConfig;
  setCurrentRoute: (route: RouteConfig) => void;
  routes: RouteConfig[];
  getRouteByPath: (path: string) => RouteConfig | undefined;
}

const defaultRoutes: RouteConfig[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    backgroundGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    sceneObjects: [],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    href: "/portfolio",
    backgroundGradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    sceneObjects: [
      ObjectFactory.createObject("portfolio-camera")!,
      ObjectFactory.createObject("portfolio-trophy")!,
    ],
    blobCostume: {
      headColor: "#ff6b6b",
      eyeColor: "#ffffff",
    },
  },
  {
    id: "about",
    label: "Über mich",
    href: "/about",
    backgroundGradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    sceneObjects: [
      ObjectFactory.createObject("about-book")!,
      ObjectFactory.createObject("about-graduation")!,
    ],
    blobCostume: {
      headColor: "#4facfe",
      eyeColor: "#ffffff",
    },
  },
  {
    id: "creative",
    label: "Kreatives",
    href: "/creative",
    backgroundGradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    sceneObjects: [
      ObjectFactory.createObject("creative-palette")!,
      ObjectFactory.createObject("creative-paintbrush")!,
      ObjectFactory.createObject("creative-canvas")!,
    ],
    blobCostume: {
      headColor: "#a8edea",
      eyeColor: "#333333",
    },
  },
  {
    id: "technical",
    label: "Technisches",
    href: "/technical",
    backgroundGradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    sceneObjects: [
      ObjectFactory.createObject("technical-code")!,
      ObjectFactory.createObject("technical-laptop")!,
      ObjectFactory.createObject("technical-server")!,
    ],
    blobCostume: {
      headColor: "#ffecd2",
      eyeColor: "#333333",
    },
  },
  {
    id: "guestbook",
    label: "Gästebuch",
    href: "/guestbook",
    backgroundGradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    sceneObjects: [
      ObjectFactory.createObject("guestbook-message")!,
      ObjectFactory.createObject("guestbook-book")!,
      ObjectFactory.createObject("guestbook-pen")!,
    ],
    blobCostume: {
      headColor: "#ff9a9e",
      eyeColor: "#ffffff",
    },
  },
];

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export function RouteProvider({ children }: { children: ReactNode }) {
  const [currentRoute, setCurrentRoute] = useState<RouteConfig>(
    defaultRoutes[0]
  );
  const router = useRouter();

  const getRouteByPath = (path: string): RouteConfig | undefined => {
    return defaultRoutes.find((route) => route.href === path);
  };

  // Update current route when router path changes
  useEffect(() => {
    const route = getRouteByPath(router.pathname);
    if (route) {
      setCurrentRoute(route);
    }
  }, [router.pathname]);

  return (
    <RouteContext.Provider
      value={{
        currentRoute,
        setCurrentRoute,
        routes: defaultRoutes,
        getRouteByPath,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
}

export function useRoute() {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error("useRoute must be used within a RouteProvider");
  }
  return context;
}
