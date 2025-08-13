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

  constructor(container: HTMLElement) {
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 1; //Smaller values = closer/more zoomed in

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
    this.controls.minDistance = 0.4; // Minimum zoom level
    this.controls.maxDistance = 1; // Maximum zoom level

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
    }
  ): void {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      if (this.model) {
        this.scene.remove(this.model);
      }

      this.model = gltf.scene;
      this.scene.add(this.model);

      // Discover handle variations after loading the model
      this.discoverHandleVariations();

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
        // Auto-adjust camera to fit model (fallback)
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const fov = this.camera.fov * (Math.PI / 180);
        const distance = sphere.radius / Math.sin(fov / 2);
        this.camera.position.z = distance;
        this.camera.updateProjectionMatrix();
      }

      // Apply saved handle variations if provided, otherwise show first handle as default
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

  // Update material color of the model
  // Assumes the model has a MeshStandardMaterial
  // If the model has multiple meshes, it will update all of them
  // If you want to update only specific meshes, you can modify this method accordingly
  public updateMaterial(color: string): void {
    if (this.model) {
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({ color });
        }
      });
    }
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

  // Discover and categorize handle variations in the loaded model
  // This method should be called after loading a model to find all handle meshes
  public discoverHandleVariations(): string[] {
    if (!this.model) return [];

    this.handleVariations.clear();
    const handleTypes: string[] = [];

    this.model.traverse((child) => {
      if (child.name && child.name.toLowerCase().includes("handle")) {
        // Extract handle type from name (e.g., "Handle_Type1", "Handle_Curved", etc.)
        const handleType = this.extractHandleType(child.name);

        if (!this.handleVariations.has(handleType)) {
          this.handleVariations.set(handleType, []);
          handleTypes.push(handleType);
        }

        this.handleVariations.get(handleType)?.push(child);
      }
    });

    console.log("Discovered handle variations:", handleTypes);
    console.log("Handle variations map:", this.handleVariations);

    return handleTypes;
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
}
