import * as THREE from "three";
import "./style.css";
import { Configurator } from "./components/Configurator";
import { saveConfiguration } from "./api/configApi";
import { getConfiguration } from "./api/configApi";

let configurator: Configurator;

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("app");
  if (container) {
    configurator = new Configurator(container);

    // Example: Add color controls
    const colorButtons = document.createElement("div");
    colorButtons.className = "color-controls";

    ["#7e0101", "#47cc00", "#224f96"].forEach((color) => {
      const button = document.createElement("button");
      button.style.backgroundColor = color;
      button.onclick = () => configurator.updateMaterial(color);
      colorButtons.appendChild(button);
    });
    container.appendChild(colorButtons);

    // Save configuration button
    const saveBtn = document.createElement("button");
    saveBtn.id = "save-btn";
    saveBtn.textContent = "Save Configuration";
    container.appendChild(saveBtn);

    saveBtn.addEventListener("click", async () => {
      // Get camera position and model scale in one call
      const { cameraPosition, modelScale } = configurator.getCameraAndScale();

      // Compose the configuration object to save
      const config = {
        modelUrl: "/models/product.gltf", // Can be dynamic in the future
        color: configurator.getCurrentColor(),
        cameraPosition,
        modelScale,
        // Add more settings like rotation, environment, lighting etc. later
      };

      try {
        const id = await saveConfiguration(config); // Save to server
        localStorage.setItem("lastConfigId", id); // Save to localStorage
        alert(`Saved! You can load it with ID: ${id}`);
        console.log("Saved config:", config);
      } catch (err) {
        console.error("Save failed:", err);
        alert("Failed to save configuration.");
      }
    });

    // Load configuration button
    const loadBtn = document.createElement("button");
    loadBtn.id = "load-btn";
    loadBtn.textContent = "Load Configuration";
    container.appendChild(loadBtn);

    loadBtn.addEventListener("click", async () => {
      // Try to get last saved config ID from localStorage
      const lastId = localStorage.getItem("lastConfigId");

      if (!lastId) {
        alert("No saved configuration found. Please save one first.");
        return;
      }

      try {
        const config = await getConfiguration(lastId);

        configurator.loadModel(config.modelUrl, {
          color: config.color,
          modelScale: config.modelScale,
          cameraPosition: config.cameraPosition,
        });

        console.log(`Loaded last saved configuration ID: ${lastId}`);
      } catch (err) {
        console.error(err);
        alert("Failed to load configuration.");
      }
    });

    // Start animation loop
    animate();
  }
});

function animate() {
  requestAnimationFrame(animate);
  if (configurator) {
    configurator.update();
  }
}
