import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useRouter } from "next/router";

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
  objectType?: "camera" | "book" | "palette" | "codeBlock" | "message";
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
      {
        id: "portfolio-camera",
        type: "custom",
        position: [0, 0, 0],
        scale: [0.6, 0.6, 0.6],
        color: "#ff6b6b",
        objectType: "camera",
        onClick: () => console.log("Portfolio camera clicked"),
        dialogTitle: "Design Portfolio",
        dialogContent:
          "A collection of my best design work, including UI/UX projects, branding, and creative concepts.",
        orbitRadius: 2.5,
        orbitSpeed: 0.5,
      },
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
      {
        id: "about-book",
        type: "custom",
        position: [0, 0, 0],
        scale: [0.7, 0.7, 0.7],
        color: "#4facfe",
        objectType: "book",
        onClick: () => console.log("About book clicked"),
        dialogTitle: "About Me",
        dialogContent:
          "Hi! I'm Eduard, a passionate designer and developer. I love creating beautiful, functional experiences that make a difference.",
        orbitRadius: 2.2,
        orbitSpeed: 0.3,
      },
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
      {
        id: "creative-palette",
        type: "custom",
        position: [0, 0, 0],
        scale: [0.6, 0.6, 0.6],
        color: "#a8edea",
        objectType: "palette",
        onClick: () => console.log("Creative palette clicked"),
        dialogTitle: "Creative Work",
        dialogContent:
          "Explore my creative projects including illustrations, digital art, and experimental design concepts.",
        orbitRadius: 2.8,
        orbitSpeed: 0.7,
      },
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
      {
        id: "technical-code",
        type: "custom",
        position: [0, 0, 0],
        scale: [0.6, 0.6, 0.6],
        color: "#ffecd2",
        objectType: "codeBlock",
        onClick: () => console.log("Technical code clicked"),
        dialogTitle: "Technical Projects",
        dialogContent:
          "Discover my technical projects including web applications, mobile apps, and system architectures.",
        orbitRadius: 2.0,
        orbitSpeed: 0.4,
      },
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
      {
        id: "guestbook-message",
        type: "custom",
        position: [0, 0, 0],
        scale: [0.6, 0.6, 0.6],
        color: "#ff9a9e",
        objectType: "message",
        onClick: () => console.log("Guestbook message clicked"),
        dialogTitle: "Guestbook",
        dialogContent:
          "Leave a message in my digital guestbook! Share your thoughts, feedback, or just say hello.",
        orbitRadius: 2.3,
        orbitSpeed: 0.6,
      },
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
