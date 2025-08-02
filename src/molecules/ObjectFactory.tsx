import { ObjectPrimitives } from "@/3d-objects/primitives";
import { SceneObject } from "@/contexts/RouteContext";

export interface ObjectConfig {
  id: string;
  type: "primitive" | "model" | "custom";
  objectType:
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
  scale: [number, number, number];
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  dialogTitle: string;
  dialogContent: string;
  position: [number, number, number];
}

export interface DialogContent {
  title: string;
  content: string;
  images?: string[];
  components?: React.ReactNode[];
}

export class ObjectFactory {
  private static objectConfigs: Record<string, ObjectConfig> = {
    // Portfolio objects
    "portfolio-camera": {
      id: "portfolio-camera",
      type: "custom",
      objectType: "camera",
      scale: [0.6, 0.6, 0.6],
      color: "#ff6b6b",
      orbitRadius: 1.8,
      orbitSpeed: 0.5,
      dialogTitle: "Photography Portfolio",
      dialogContent:
        "Explore my photography work, including portraits, landscapes, and creative compositions. Each image tells a unique story and captures moments that inspire.",
      position: [0, 0, 0],
    },
    "portfolio-trophy": {
      id: "portfolio-trophy",
      type: "custom",
      objectType: "trophy",
      scale: [0.5, 0.5, 0.5],
      color: "#ffd700",
      orbitRadius: 2.1,
      orbitSpeed: 0.4,
      dialogTitle: "Awards & Recognition",
      dialogContent:
        "View my achievements and awards in design and development. These recognitions represent the quality and innovation in my work.",
      position: [0, 0, 0],
    },

    // About objects
    "about-book": {
      id: "about-book",
      type: "custom",
      objectType: "book",
      scale: [0.7, 0.7, 0.7],
      color: "#4facfe",
      orbitRadius: 1.6,
      orbitSpeed: 0.3,
      dialogTitle: "About Me",
      dialogContent:
        "Hi! I'm Eduard, a passionate designer and developer with a love for creating beautiful, functional experiences. I believe in the power of thoughtful design to make a difference in people's lives.",
      position: [0, 0, 0],
    },
    "about-graduation": {
      id: "about-graduation",
      type: "custom",
      objectType: "graduationCap",
      scale: [0.6, 0.6, 0.6],
      color: "#4facfe",
      orbitRadius: 2.0,
      orbitSpeed: 0.6,
      dialogTitle: "Education & Background",
      dialogContent:
        "My educational journey has shaped my approach to design and development. I combine academic knowledge with practical experience to create innovative solutions.",
      position: [0, 0, 0],
    },

    // Creative objects
    "creative-palette": {
      id: "creative-palette",
      type: "custom",
      objectType: "palette",
      scale: [0.6, 0.6, 0.6],
      color: "#a8edea",
      orbitRadius: 2.2,
      orbitSpeed: 0.7,
      dialogTitle: "Creative Design",
      dialogContent:
        "Discover my creative projects including illustrations, digital art, and experimental design concepts. Each piece reflects my artistic vision and technical skills.",
      position: [0, 0, 0],
    },
    "creative-paintbrush": {
      id: "creative-paintbrush",
      type: "custom",
      objectType: "paintbrush",
      scale: [0.8, 0.8, 0.8],
      color: "#a8edea",
      orbitRadius: 1.8,
      orbitSpeed: 0.5,
      dialogTitle: "Digital Art",
      dialogContent:
        "Explore my digital artwork and illustrations. From concept sketches to finished pieces, each creation showcases my artistic process and style.",
      position: [0, 0, 0],
    },
    "creative-canvas": {
      id: "creative-canvas",
      type: "custom",
      objectType: "canvas",
      scale: [0.5, 0.5, 0.5],
      color: "#a8edea",
      orbitRadius: 2.4,
      orbitSpeed: 0.3,
      dialogTitle: "Art Gallery",
      dialogContent:
        "Browse through my art gallery featuring various styles and mediums. Each canvas represents a moment of inspiration and creative expression.",
      position: [0, 0, 0],
    },

    // Technical objects
    "technical-code": {
      id: "technical-code",
      type: "custom",
      objectType: "codeBlock",
      scale: [0.6, 0.6, 0.6],
      color: "#ffecd2",
      orbitRadius: 1.5,
      orbitSpeed: 0.4,
      dialogTitle: "Technical Projects",
      dialogContent:
        "Discover my technical projects including web applications, mobile apps, and system architectures. Each project demonstrates my problem-solving skills and technical expertise.",
      position: [0, 0, 0],
    },
    "technical-laptop": {
      id: "technical-laptop",
      type: "custom",
      objectType: "laptop",
      scale: [0.5, 0.5, 0.5],
      color: "#ffecd2",
      orbitRadius: 1.7,
      orbitSpeed: 0.6,
      dialogTitle: "Development Work",
      dialogContent:
        "Explore my development work including full-stack applications, APIs, and software solutions. I focus on clean code, performance, and user experience.",
      position: [0, 0, 0],
    },
    "technical-server": {
      id: "technical-server",
      type: "custom",
      objectType: "server",
      scale: [0.4, 0.4, 0.4],
      color: "#ffecd2",
      orbitRadius: 2.1,
      orbitSpeed: 0.2,
      dialogTitle: "Infrastructure & DevOps",
      dialogContent:
        "Learn about my infrastructure and DevOps experience, including cloud deployments, CI/CD pipelines, and system administration.",
      position: [0, 0, 0],
    },

    // Guestbook objects
    "guestbook-message": {
      id: "guestbook-message",
      type: "custom",
      objectType: "message",
      scale: [0.6, 0.6, 0.6],
      color: "#ff9a9e",
      orbitRadius: 1.7,
      orbitSpeed: 0.6,
      dialogTitle: "Guestbook",
      dialogContent:
        "Leave a message in my digital guestbook! Share your thoughts, feedback, or just say hello. I'd love to hear from you.",
      position: [0, 0, 0],
    },
    "guestbook-book": {
      id: "guestbook-book",
      type: "custom",
      objectType: "guestbook",
      scale: [0.6, 0.6, 0.6],
      color: "#ff9a9e",
      orbitRadius: 1.9,
      orbitSpeed: 0.4,
      dialogTitle: "Visitor Messages",
      dialogContent:
        "Read messages from other visitors and leave your own. This is a space for connection and community.",
      position: [0, 0, 0],
    },
    "guestbook-pen": {
      id: "guestbook-pen",
      type: "custom",
      objectType: "pen",
      scale: [0.8, 0.8, 0.8],
      color: "#ff9a9e",
      orbitRadius: 1.5,
      orbitSpeed: 0.8,
      dialogTitle: "Sign Here",
      dialogContent:
        "Use this pen to sign the guestbook and leave your mark. Every signature adds to the community of visitors.",
      position: [0, 0, 0],
    },
  };

  static createObject(configId: string): SceneObject | null {
    const config = this.objectConfigs[configId];
    if (!config) return null;

    return {
      id: config.id,
      type: config.type,
      position: config.position,
      scale: config.scale,
      color: config.color,
      geometry: undefined,
      objectType: config.objectType,
      orbitRadius: config.orbitRadius,
      orbitSpeed: config.orbitSpeed,
      dialogTitle: config.dialogTitle,
      dialogContent: config.dialogContent,
    };
  }

  static getObjectComponent(objectType: string) {
    return ObjectPrimitives[objectType as keyof typeof ObjectPrimitives];
  }

  static getDialogContent(configId: string): DialogContent | null {
    const config = this.objectConfigs[configId];
    if (!config) return null;

    return {
      title: config.dialogTitle,
      content: config.dialogContent,
    };
  }

  static getAllConfigs(): Record<string, ObjectConfig> {
    return this.objectConfigs;
  }

  static getConfigsByCategory(category: string): ObjectConfig[] {
    return Object.values(this.objectConfigs).filter((config) =>
      config.id.startsWith(category)
    );
  }

  // Future methods for enhanced functionality
  static addImageToDialog(configId: string, imageUrl: string): void {
    const config = this.objectConfigs[configId];
    if (config) {
      // This would be implemented when dialog system supports images
    }
  }

  static addComponentToDialog(
    configId: string,
    component: React.ReactNode
  ): void {
    const config = this.objectConfigs[configId];
    if (config) {
      // This would be implemented when dialog system supports custom components
    }
  }

  static updateDialogContent(configId: string, newContent: string): void {
    const config = this.objectConfigs[configId];
    if (config) {
      config.dialogContent = newContent;
    }
  }

  static createCustomObject(
    id: string,
    objectType:
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
      | "pen",
    dialogTitle: string,
    dialogContent: string,
    options: Partial<ObjectConfig> = {}
  ): ObjectConfig {
    const defaultConfig: ObjectConfig = {
      id,
      type: "custom",
      objectType,
      scale: [0.6, 0.6, 0.6],
      color: "#ffffff",
      orbitRadius: 1.8,
      orbitSpeed: 0.5,
      dialogTitle,
      dialogContent,
      position: [0, 0, 0],
    };

    const customConfig = { ...defaultConfig, ...options };
    this.objectConfigs[id] = customConfig;
    return customConfig;
  }
}
