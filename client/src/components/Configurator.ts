import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class Configurator {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private model: THREE.Group | null = null;
  private handleVariations: Map<string, THREE.Object3D[]> = new Map();
  private screwheadVariations: Map<string, THREE.Object3D[]> = new Map();
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;

    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.01, // Much closer near plane to prevent clipping
      1000
    );
    this.camera.position.z = 3; // Start further back for better initial view

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Directional light for better shading
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Initialize controls with zoom limits
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 0.25; // Allow very close zoom without clipping
    this.controls.maxDistance = 0.5; // Allow reasonable zoom out range
    this.controls.enablePan = true; // Allow panning
    this.controls.enableZoom = true; // Ensure zoom is enabled

    // Set up viewport resize handling
    this.setupResizeHandler();

    // Start animation loop
    this.animate();

    // Load default model
    //this.loadModel("/models/product.gltf");

    // Use import.meta.env.BASE_URL for correct path resolution
    // This ensures the model path is correctly resolved in both development and production environments
    // This is useful if you are using a build tool like Vite or Webpack
    // It allows you to use relative paths that work in both environments
    // This is a common practice in modern web development to ensure assets are correctly loaded
    // when the application is built and deployed
    this.loadModel(import.meta.env.BASE_URL + "models/screwdriver.glb");
  }

  public loadModel(
    url: string,
    config?: {
      color?: string;
      modelScale?: number[];
      cameraPosition?: number[];
      visibleHandleVariations?: string[];
      visibleScrewheadVariations?: string[];
    }
  ): void {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      if (this.model) {
        this.scene.remove(this.model);
      }

      this.model = gltf.scene;
      this.scene.add(this.model);

      // Discover handle and screwhead variations after loading the model
      this.discoverVariations();

      // List all mesh names for debugging (helps refine shaft detection)
      this.listAllMeshNames();

      // List original colors for debugging
      this.listOriginalColors();

      // Center model
      const box = new THREE.Box3().setFromObject(this.model);
      const center = box.getCenter(new THREE.Vector3());
      this.model.position.sub(center);

      // Apply model scale if provided
      if (config?.modelScale && this.model) {
        this.model.scale.set(
          config.modelScale[0],
          config.modelScale[1],
          config.modelScale[2]
        );
      }

      // Apply material color if provided
      if (config?.color) {
        this.updateMaterial(config.color);
      }

      // Apply saved camera position if provided
      if (config?.cameraPosition) {
        this.camera.position.set(
          config.cameraPosition[0],
          config.cameraPosition[1],
          config.cameraPosition[2]
        );
        this.camera.updateProjectionMatrix();
      } else {
        // Simple camera auto-fit to model
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const fov = this.camera.fov * (Math.PI / 180);
        let distance = sphere.radius / Math.sin(fov / 2);

        // Ensure distance is within our control limits
        distance = Math.max(
          this.controls.minDistance,
          Math.min(distance, this.controls.maxDistance)
        );

        this.camera.position.set(0, 0, distance);
        this.camera.lookAt(0, 0, 0);
        this.camera.updateProjectionMatrix();

        console.log(`Simple camera fit - Distance: ${distance.toFixed(2)}`);
      } // Apply saved handle variations if provided, otherwise show first handle as default
      if (config?.visibleHandleVariations) {
        // First hide all handles
        this.hideAllHandles();
        // Then show only the saved variations
        config.visibleHandleVariations.forEach((variation) => {
          this.showHandleVariation(variation);
        });
      } else {
        // Show first handle variation as default
        this.showDefaultHandle();
      }

      // Apply saved screwhead variations if provided, otherwise show first screwhead as default
      if (config?.visibleScrewheadVariations) {
        // First hide all screwheads
        this.hideAllScrewheads();
        // Then show only the saved variations
        config.visibleScrewheadVariations.forEach((variation) => {
          this.showScrewheadVariation(variation);
        });
      } else {
        // Show first screwhead variation as default
        this.showDefaultScrewhead();
      }
    });
  }

  // Method to animate the scene
  // This method is called recursively using requestAnimationFrame
  // It updates the controls and renders the scene
  // This is the main loop of the application
  // It ensures that the scene is continuously rendered and updated
  // It can also be used to update animations, physics, etc.
  // If you have any animations or physics, you can update them here as well
  // For example, if you have a model with animations, you can update the animation mixer
  // If you have any physics, you can update the physics world here as well
  // This method is called once when the application starts
  // and then continuously in a loop until the application is closed
  private animate = (): void => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public update(): void {
    // Update controls
    this.controls.update();

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  // Set up viewport resize handling
  private setupResizeHandler(): void {
    // Use ResizeObserver for more precise resize detection
    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      resizeObserver.observe(this.container);
    } else {
      // Fallback to window resize event
      (window as any).addEventListener("resize", () => this.handleResize());
    }
  }

  // Handle viewport resize and adjust camera accordingly
  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Update camera aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Update renderer size
    this.renderer.setSize(width, height);

    // Recalculate optimal camera distance for new viewport
    this.recalculateCameraDistance();

    console.log(`Viewport resized to: ${width}x${height}`);
  }

  // Recalculate camera distance based on current viewport and model
  private recalculateCameraDistance(): void {
    if (!this.model) return;

    const box = new THREE.Box3().setFromObject(this.model);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const fov = this.camera.fov * (Math.PI / 180);

    // Simple distance calculation
    let distance = sphere.radius / Math.sin(fov / 2);

    // Ensure distance is within our control limits
    distance = Math.max(
      this.controls.minDistance,
      Math.min(distance, this.controls.maxDistance)
    );

    // Only update camera position if it has changed significantly
    const currentDistance = this.camera.position.length();
    if (Math.abs(distance - currentDistance) > 0.1) {
      this.camera.position.setLength(distance);
      this.camera.updateProjectionMatrix();

      console.log(`Simple camera distance adjusted to: ${distance.toFixed(2)}`);
    }
  }

  // Update material color of the model
  // Applies color only to the shaft, not to handles or screwheads
  // You can customize this logic based on your model's naming convention
  public updateMaterial(color: string): void {
    // Use higher color strength (0.85) to make colors more vibrant
    this.updateMaterialWithOpacity(color, 0.85);
  }

  // Debug method to list all mesh names in the model
  // This helps you understand your model structure and refine the shaft detection logic
  public listAllMeshNames(): string[] {
    const meshNames: string[] = [];

    if (this.model) {
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name) {
          meshNames.push(child.name);
        }
      });
    }

    console.log("All mesh names in model:", meshNames);
    return meshNames;
  }

  // Debug method to show original colors of all meshes
  public listOriginalColors(): void {
    if (this.model) {
      console.log("=== Original Material Colors ===");
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name) {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            console.log(
              `${child.name}: #${child.material.color.getHexString()}`
            );
          } else {
            console.log(`${child.name}: No standard material`);
          }
        }
      });
    }
  }

  // Update material color with custom color blending (not transparency)
  // colorStrength: 1.0 = full color replacement, 0.0 = original color only
  public updateMaterialWithOpacity(
    color: string,
    colorStrength: number = 0.7
  ): void {
    if (this.model) {
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const childName = child.name?.toLowerCase() || "";

          // Only apply color to shaft parts, exclude handles and heads
          const isShaft =
            !childName.includes("handle") &&
            !childName.includes("head") &&
            !childName.includes("grip") &&
            !childName.includes("cylinder");

          // Alternative approach: explicitly look for shaft-related names
          const isShaftExplicit =
            childName.includes("shaft") ||
            childName.includes("body") ||
            childName.includes("barrel") ||
            childName.includes("rod") ||
            childName.includes("stem");

          // Apply color if it's identified as shaft OR if it doesn't contain exclusion keywords
          if (isShaft || isShaftExplicit) {
            // Store original material properties
            let originalColor = new THREE.Color(0x888888); // Default gray
            let originalMetalness = 0.0;
            let originalRoughness = 0.5;
            let originalMap = null;

            // Preserve original material properties if they exist
            if (child.material instanceof THREE.MeshStandardMaterial) {
              originalColor = child.material.color.clone();
              originalMetalness = child.material.metalness || 0.0;
              originalRoughness = child.material.roughness || 0.5;
              originalMap = child.material.map;
            }

            // Create the new color and handle dark original colors better
            const newColor = new THREE.Color(color);
            let finalColor: THREE.Color;

            // Check if original color is too dark (brightness < 0.3)
            const brightness =
              (originalColor.r + originalColor.g + originalColor.b) / 3;

            if (brightness < 0.3) {
              // For very dark original colors, use a lighter base or more of the new color
              const lighterBase = new THREE.Color(0xaaaaaa); // Light gray base
              // Blend the lighter base with the new color instead
              finalColor = lighterBase.clone().lerp(newColor, colorStrength);
              console.log(
                `Dark original detected for ${
                  child.name
                } (brightness: ${brightness.toFixed(2)}), using lighter base`
              );
            } else {
              // For normal colors, blend as usual
              finalColor = originalColor.clone().lerp(newColor, colorStrength);
            }

            // Create new material with preserved properties
            child.material = new THREE.MeshStandardMaterial({
              color: finalColor,
              metalness: originalMetalness,
              roughness: originalRoughness,
              map: originalMap, // Preserve texture if it exists
              transparent: false,
              opacity: 1.0,
            });

            console.log(
              `Applied color to shaft: ${
                child.name
              } - Original: #${originalColor.getHexString()}, Final: #${finalColor.getHexString()}, Strength: ${colorStrength}`
            );
          }
        }
      });
    }
  }

  // Force apply brighter colors (useful for very dark original materials)
  public updateMaterialBright(
    color: string,
    colorStrength: number = 0.9
  ): void {
    if (this.model) {
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const childName = child.name?.toLowerCase() || "";

          // Only apply color to shaft parts, exclude handles and heads
          const isShaft =
            !childName.includes("handle") &&
            !childName.includes("head") &&
            !childName.includes("grip") &&
            !childName.includes("cylinder");

          const isShaftExplicit =
            childName.includes("shaft") ||
            childName.includes("body") ||
            childName.includes("barrel") ||
            childName.includes("rod") ||
            childName.includes("stem");

          if (isShaft || isShaftExplicit) {
            // Use an even brighter base color for blending
            const brightBase = new THREE.Color(0xffffff); // Pure white base
            const newColor = new THREE.Color(color);

            // For maximum brightness, blend white with the color
            const finalColor = brightBase.clone().lerp(newColor, colorStrength);

            // Preserve material properties but reduce metalness for better color visibility
            let originalMetalness = 0.0; // Force low metalness for better colors
            let originalRoughness = 0.3; // Slightly rough for better color appearance
            let originalMap = null;

            if (child.material instanceof THREE.MeshStandardMaterial) {
              originalRoughness = Math.max(
                0.2,
                child.material.roughness || 0.3
              );
              originalMap = child.material.map;
            }

            child.material = new THREE.MeshStandardMaterial({
              color: finalColor,
              metalness: originalMetalness, // Keep metalness low for vibrant colors
              roughness: originalRoughness,
              map: originalMap,
              transparent: false,
              opacity: 1.0,
            });

            console.log(
              `Applied extra bright color to: ${
                child.name
              } - Final: #${finalColor.getHexString()}, Strength: ${colorStrength}`
            );
          }
        }
      });
    }
  }

  // Pure color replacement - no blending, maximum brightness
  public updateMaterialPure(
    color: string,
    preserveMetalness: boolean = true
  ): void {
    if (this.model) {
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const childName = child.name?.toLowerCase() || "";

          // Only apply color to shaft parts, exclude handles and heads
          const isShaft =
            !childName.includes("handle") &&
            !childName.includes("head") &&
            !childName.includes("grip") &&
            !childName.includes("cylinder");

          const isShaftExplicit =
            childName.includes("shaft") ||
            childName.includes("body") ||
            childName.includes("barrel") ||
            childName.includes("rod") ||
            childName.includes("stem");

          if (isShaft || isShaftExplicit) {
            // Use the color directly without any blending
            const pureColor = new THREE.Color(color);

            // Preserve current metalness if requested
            let currentMetalness = 0.0;
            if (
              preserveMetalness &&
              child.material instanceof THREE.MeshStandardMaterial
            ) {
              currentMetalness = child.material.metalness;
            }

            child.material = new THREE.MeshStandardMaterial({
              color: pureColor,
              metalness: currentMetalness,
              roughness: 0.2, // Low roughness for brighter appearance
              transparent: false,
              opacity: 1.0,
            });

            console.log(
              `Applied pure color to: ${
                child.name
              } - Color: #${pureColor.getHexString()}, Metalness: ${currentMetalness}`
            );
          }
        }
      });
    }
  }

  // Update metalness of shaft materials
  public updateMaterialMetalness(metalness: number): void {
    if (this.model) {
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const childName = child.name?.toLowerCase() || "";

          // Only apply to shaft parts, exclude handles and heads
          const isShaft =
            !childName.includes("handle") &&
            !childName.includes("head") &&
            !childName.includes("grip") &&
            !childName.includes("cylinder");

          const isShaftExplicit =
            childName.includes("shaft") ||
            childName.includes("body") ||
            childName.includes("barrel") ||
            childName.includes("rod") ||
            childName.includes("stem");

          if (isShaft || isShaftExplicit) {
            if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.metalness = metalness;
              console.log(`Updated metalness for ${child.name}: ${metalness}`);
            }
          }
        }
      });
    }
  }

  // Get current metalness of the first shaft material found
  public getCurrentMetalness(): number {
    if (this.model) {
      let metalness = 0.0;
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const childName = child.name?.toLowerCase() || "";

          const isShaft =
            !childName.includes("handle") &&
            !childName.includes("head") &&
            !childName.includes("grip") &&
            !childName.includes("cylinder");

          const isShaftExplicit =
            childName.includes("shaft") ||
            childName.includes("body") ||
            childName.includes("barrel") ||
            childName.includes("rod") ||
            childName.includes("stem");

          if (isShaft || isShaftExplicit) {
            if (child.material instanceof THREE.MeshStandardMaterial) {
              metalness = child.material.metalness;
              return; // Exit traverse early
            }
          }
        }
      });
      return metalness;
    }
    return 0.0;
  }

  public setCameraPosition(pos: { x: number; y: number; z: number }) {
    this.camera.position.set(pos.x, pos.y, pos.z);
    this.camera.updateProjectionMatrix();
  }

  public setModelScale(scale: { x: number; y: number; z: number }) {
    if (this.model) {
      this.model.scale.set(scale.x, scale.y, scale.z);
    }
  }

  // Get the current color of the model
  // Returns the color in hex format (e.g., "#ff0000")
  // If the model has multiple meshes, it will return the color of the first mesh found
  // If you want to get colors of all meshes, you can modify this method accordingly
  public getCurrentColor(): string | null {
    if (!this.model) return null;
    let color: string | null = null;

    this.model.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshStandardMaterial
      ) {
        const mat = child.material;
        color = `#${mat.color.getHexString()}`;
        return;
      }
    });

    return color;
  }

  // Get camera position and model scale
  // Returns an object with camera position and model scale
  // Camera position is an array of numbers [x, y, z]
  // Model scale is an array of numbers [x, y, z] or null if no model is loaded
  // This can be useful for saving/loading configurations
  // or for resetting the camera and model scale
  // when loading a new model or configuration
  public getCameraAndScale(): {
    cameraPosition: number[];
    modelScale: number[] | null;
  } {
    const cameraPosition = this.camera.position.toArray();
    const modelScale = this.model ? this.model.scale.toArray() : null;

    return {
      cameraPosition,
      modelScale,
    };
  }

  // Discover and categorize both handle and screwhead variations in the loaded model
  // This method should be called after loading a model to find all variation meshes
  public discoverVariations(): { handles: string[]; screwheads: string[] } {
    if (!this.model) return { handles: [], screwheads: [] };

    this.handleVariations.clear();
    this.screwheadVariations.clear();
    const handleTypes: string[] = [];
    const screwheadTypes: string[] = [];

    this.model.traverse((child) => {
      const childName = child.name?.toLowerCase() || "";

      // Check for handle variations
      if (childName.includes("handle")) {
        const handleType = this.extractHandleType(child.name);

        if (!this.handleVariations.has(handleType)) {
          this.handleVariations.set(handleType, []);
          handleTypes.push(handleType);
        }

        this.handleVariations.get(handleType)?.push(child);
      }

      // Check for screwhead variations
      else if (childName.includes("head")) {
        const screwheadType = this.extractScrewheadType(child.name);

        if (!this.screwheadVariations.has(screwheadType)) {
          this.screwheadVariations.set(screwheadType, []);
          screwheadTypes.push(screwheadType);
        }

        this.screwheadVariations.get(screwheadType)?.push(child);
      }
    });

    console.log("Discovered handle variations:", handleTypes);
    console.log("Handle variations map:", this.handleVariations);
    console.log("Discovered screwhead variations:", screwheadTypes);
    console.log("Screwhead variations map:", this.screwheadVariations);

    return { handles: handleTypes, screwheads: screwheadTypes };
  }

  // Keep the old method for backward compatibility
  public discoverHandleVariations(): string[] {
    const { handles } = this.discoverVariations();
    return handles;
  }

  // Extract handle type from mesh name
  // You can customize this logic based on your model's naming convention
  private extractHandleType(meshName: string): string {
    // Common patterns for handle naming:
    // "Handle_Type1" -> "Type1"
    // "Handle_Curved" -> "Curved"
    // "HandleStraight" -> "Straight"
    // "handle_variation_2" -> "variation_2"

    const name = meshName.toLowerCase();

    // Remove common prefixes
    let handleType = name
      .replace(/^handle[_-]?/i, "")
      .replace(/[_-]?handle$/i, "");

    // If no specific type found, use the full name minus "handle"
    if (!handleType || handleType === name.toLowerCase()) {
      handleType = meshName.replace(/handle/i, "").replace(/^[_-]|[_-]$/g, "");
    }

    // If still empty, use index-based naming
    if (!handleType) {
      handleType = `variation_${this.handleVariations.size + 1}`;
    }

    return handleType || "default";
  }

  // Extract screwhead type from mesh name
  // You can customize this logic based on your model's naming convention
  private extractScrewheadType(meshName: string): string {
    // Common patterns for screwhead naming:
    // "HeadFlat" -> "Flat"
    // "HeadCross" -> "Cross"
    // "Head_Phillips" -> "Phillips"
    // "screwhead_flat" -> "flat"

    const name = meshName.toLowerCase();

    // Remove common prefixes and suffixes
    let screwheadType = name
      .replace(/^head[_-]?/i, "")
      .replace(/[_-]?head$/i, "")
      .replace(/^screwhead[_-]?/i, "")
      .replace(/[_-]?screwhead$/i, "");

    // If no specific type found, use the full name minus "head"
    if (!screwheadType || screwheadType === name.toLowerCase()) {
      screwheadType = meshName
        .replace(/head/i, "")
        .replace(/screwhead/i, "")
        .replace(/^[_-]|[_-]$/g, "");
    }

    // If still empty, use index-based naming
    if (!screwheadType) {
      screwheadType = `type_${this.screwheadVariations.size + 1}`;
    }

    return screwheadType || "default";
  }

  // Show only the specified handle variation and hide all others
  public showHandleVariation(handleType: string): boolean {
    if (!this.model || !this.handleVariations.has(handleType)) {
      console.warn(`Handle variation '${handleType}' not found`);
      return false;
    }

    // Hide all handle variations first
    this.handleVariations.forEach((meshes) => {
      meshes.forEach((mesh) => {
        mesh.visible = false;
      });
    });

    // Show only the selected variation
    const selectedHandles = this.handleVariations.get(handleType);
    if (selectedHandles) {
      selectedHandles.forEach((mesh) => {
        mesh.visible = true;
      });
      console.log(`Showing handle variation: ${handleType}`);
      return true;
    }

    return false;
  }

  // Hide all handle variations
  public hideAllHandles(): void {
    this.handleVariations.forEach((meshes) => {
      meshes.forEach((mesh) => {
        mesh.visible = false;
      });
    });
    console.log("All handles hidden");
  }

  // Show all handle variations
  public showAllHandles(): void {
    this.handleVariations.forEach((meshes) => {
      meshes.forEach((mesh) => {
        mesh.visible = true;
      });
    });
    console.log("All handles shown");
  }

  // Get list of available handle variations
  public getAvailableHandleVariations(): string[] {
    return Array.from(this.handleVariations.keys());
  }

  // SCREWHEAD VARIATION METHODS

  // Show only the specified screwhead variation and hide all others
  public showScrewheadVariation(screwheadType: string): boolean {
    if (!this.model || !this.screwheadVariations.has(screwheadType)) {
      console.warn(`Screwhead variation '${screwheadType}' not found`);
      return false;
    }

    // Hide all screwhead variations first
    this.screwheadVariations.forEach((meshes) => {
      meshes.forEach((mesh) => {
        mesh.visible = false;
      });
    });

    // Show only the selected variation
    const selectedScrewheads = this.screwheadVariations.get(screwheadType);
    if (selectedScrewheads) {
      selectedScrewheads.forEach((mesh) => {
        mesh.visible = true;
      });
      console.log(`Showing screwhead variation: ${screwheadType}`);
      return true;
    }

    return false;
  }

  // Hide all screwhead variations
  public hideAllScrewheads(): void {
    this.screwheadVariations.forEach((meshes) => {
      meshes.forEach((mesh) => {
        mesh.visible = false;
      });
    });
    console.log("All screwheads hidden");
  }

  // Show all screwhead variations
  public showAllScrewheads(): void {
    this.screwheadVariations.forEach((meshes) => {
      meshes.forEach((mesh) => {
        mesh.visible = true;
      });
    });
    console.log("All screwheads shown");
  }

  // Get list of available screwhead variations
  public getAvailableScrewheadVariations(): string[] {
    return Array.from(this.screwheadVariations.keys());
  }

  // Check if a screwhead variation is currently visible
  public isScrewheadVariationVisible(screwheadType: string): boolean {
    const screwheads = this.screwheadVariations.get(screwheadType);
    if (!screwheads || screwheads.length === 0) return false;

    return screwheads.some((mesh) => mesh.visible);
  }

  // Get currently visible screwhead variations
  public getVisibleScrewheadVariations(): string[] {
    const visible: string[] = [];

    this.screwheadVariations.forEach((meshes, screwheadType) => {
      if (meshes.some((mesh) => mesh.visible)) {
        visible.push(screwheadType);
      }
    });

    return visible;
  }

  // HANDLE VARIATION METHODS (continued)

  // Check if a handle variation is currently visible
  public isHandleVariationVisible(handleType: string): boolean {
    const handles = this.handleVariations.get(handleType);
    if (!handles || handles.length === 0) return false;

    return handles.some((mesh) => mesh.visible);
  }

  // Get currently visible handle variations
  public getVisibleHandleVariations(): string[] {
    const visible: string[] = [];

    this.handleVariations.forEach((meshes, handleType) => {
      if (meshes.some((mesh) => mesh.visible)) {
        visible.push(handleType);
      }
    });

    return visible;
  }

  // Show the default handle (first available handle variation or specific "handle 1")
  private showDefaultHandle(): void {
    const availableHandles = this.getAvailableHandleVariations();

    if (availableHandles.length > 0) {
      // Hide all handles first
      this.hideAllHandles();

      // Try to find "handle 1" or similar first
      let defaultHandle = availableHandles.find(
        (handle) =>
          handle.toLowerCase().includes("1") ||
          handle.toLowerCase().includes("one") ||
          handle.toLowerCase() === "default"
      );

      // If no "handle 1" found, use the first available
      if (!defaultHandle) {
        defaultHandle = availableHandles[0];
      }

      this.showHandleVariation(defaultHandle);

      console.log(`Showing default handle variation: ${defaultHandle}`);
    } else {
      console.log("No handle variations found to set as default");
    }
  }

  // Show the default screwhead (first available screwhead variation or specific screwhead)
  private showDefaultScrewhead(): void {
    const availableScrewheads = this.getAvailableScrewheadVariations();

    if (availableScrewheads.length > 0) {
      // Hide all screwheads first
      this.hideAllScrewheads();

      // Try to find "flat" screwhead first (common default), then "cross", then first available
      let defaultScrewhead = availableScrewheads.find(
        (screwhead) =>
          screwhead.toLowerCase().includes("flat") ||
          screwhead.toLowerCase() === "default"
      );

      // If no "flat" found, try "cross"
      if (!defaultScrewhead) {
        defaultScrewhead = availableScrewheads.find((screwhead) =>
          screwhead.toLowerCase().includes("cross")
        );
      }

      // If still nothing found, use the first available
      if (!defaultScrewhead) {
        defaultScrewhead = availableScrewheads[0];
      }

      this.showScrewheadVariation(defaultScrewhead);

      console.log(`Showing default screwhead variation: ${defaultScrewhead}`);
    } else {
      console.log("No screwhead variations found to set as default");
    }
  }
}
