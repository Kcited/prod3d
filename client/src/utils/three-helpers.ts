export function loadGLTFModel(url: string, scene: THREE.Scene): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
        const loader = new THREE.GLTFLoader();
        loader.load(url, (gltf) => {
            scene.add(gltf.scene);
            resolve(gltf.scene);
        }, undefined, (error) => {
            reject(error);
        });
    });
}

export function setupScene(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): void {
    camera.position.set(0, 1, 3);
    renderer.setSize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}