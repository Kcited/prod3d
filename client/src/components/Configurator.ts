import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class Configurator {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private model: THREE.Group | null = null;

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

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Initialize controls with zoom limits
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 0.4; // Minimum zoom level
    this.controls.maxDistance = 10; // Maximum zoom level

    // Start animation loop
    this.animate();

    // Load default model
    //this.loadModel("/models/product.gltf");
    this.loadModel(import.meta.env.BASE_URL + "models/product.gltf");
  }

  private loadModel(url: string): void {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      if (this.model) {
        this.scene.remove(this.model);
      }
      this.model = gltf.scene;
      this.scene.add(this.model);

      // Center and scale model
      const box = new THREE.Box3().setFromObject(this.model);
      const center = box.getCenter(new THREE.Vector3());
      this.model.position.sub(center);

      // Optional: Auto-adjust camera to fit model
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const fov = this.camera.fov * (Math.PI / 180);
      const distance = sphere.radius / Math.sin(fov / 2);
      this.camera.position.z = distance;
      this.camera.updateProjectionMatrix();
    });
  }

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

  public updateMaterial(color: string): void {
    if (this.model) {
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({ color });
        }
      });
    }
  }
}
