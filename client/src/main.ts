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

    // Handle variation controls - will be populated after model loads
    const handleControls = document.createElement("div");
    handleControls.className = "handle-controls";
    handleControls.innerHTML = "<h3>Handle Variations</h3>";
    container.appendChild(handleControls);

    // Function to setup handle controls after model loads
    const setupHandleControls = () => {
      const variations = configurator.getAvailableHandleVariations();

      // Clear existing handle buttons
      const existingButtons = handleControls.querySelectorAll("button");
      existingButtons.forEach((btn) => btn.remove());

      if (variations.length > 0) {
        // Add button to show all handles
        const showAllBtn = document.createElement("button");
        showAllBtn.textContent = "Show All";
        showAllBtn.onclick = () => configurator.showAllHandles();
        handleControls.appendChild(showAllBtn);

        // Add button to hide all handles
        const hideAllBtn = document.createElement("button");
        hideAllBtn.textContent = "Hide All";
        hideAllBtn.onclick = () => configurator.hideAllHandles();
        handleControls.appendChild(hideAllBtn);

        // Add buttons for each variation
        variations.forEach((variation) => {
          const button = document.createElement("button");
          button.textContent = `Show ${variation}`;
          button.onclick = () => configurator.showHandleVariation(variation);
          handleControls.appendChild(button);
        });
      } else {
        const noHandlesMsg = document.createElement("p");
        noHandlesMsg.textContent = "No handle variations found";
        handleControls.appendChild(noHandlesMsg);
      }
    };

    // Setup handle controls after a short delay to ensure model is loaded
    setTimeout(setupHandleControls, 1000);

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
        visibleHandleVariations: configurator.getVisibleHandleVariations(),
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
          visibleHandleVariations: config.visibleHandleVariations,
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
