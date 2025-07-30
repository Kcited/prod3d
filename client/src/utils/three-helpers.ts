import * as THREE from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

export function loadGLTFModel(
  url: string,
  scene: THREE.Scene
): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf: GLTF) => {
        scene.add(gltf.scene);
        resolve(gltf.scene);
      },
      undefined,
      (error: ErrorEvent) => {
        reject(error);
      }
    );
  });
}

export function setupScene(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
): void {
  camera.position.set(0, 1, 3);
  renderer.setSize(window.innerWidth, window.innerHeight);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
