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

    // Add metalness slider first so it can be referenced by color buttons
    const colorControl = document.createElement("div");
    colorControl.className = "opacity-control";

    const colorLabel = document.createElement("label");
    colorLabel.textContent = "Metalness: ";
    colorControl.appendChild(colorLabel);

    const colorSlider = document.createElement("input");
    colorSlider.type = "range";
    colorSlider.min = "0.0";
    colorSlider.max = "1.0";
    colorSlider.step = "0.1";
    colorSlider.value = "0.0";
    colorSlider.oninput = (e) => {
      const metalness = parseFloat((e.target as HTMLInputElement).value);
      configurator.updateMaterialMetalness(metalness);
    };
    colorControl.appendChild(colorSlider);

    // Pure color buttons (no blending for maximum brightness)
    const pureColorDiv = document.createElement("div");
    pureColorDiv.style.marginTop = "10px";

    const pureLabel = document.createElement("span");
    pureLabel.textContent = "Shaft: ";
    pureColorDiv.appendChild(pureLabel);

    ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"].forEach(
      (color) => {
        const button = document.createElement("button");
        button.style.backgroundColor = color;
        button.style.border = "2px solid white";
        button.onclick = () => {
          configurator.updateMaterialPure(color, true); // Preserve current metalness
          // Update slider to reflect current metalness after color change
          const currentMetalness = configurator.getCurrentMetalness();
          colorSlider.value = currentMetalness.toString();
        };
        pureColorDiv.appendChild(button);
      }
    );

    colorButtons.appendChild(colorControl);
    colorButtons.appendChild(pureColorDiv);
    container.appendChild(colorButtons);

    // Handle variation controls - will be populated after model loads
    const handleControls = document.createElement("div");
    handleControls.className = "handle-controls";
    handleControls.innerHTML = "<h3>Handle Variations</h3>";
    container.appendChild(handleControls);

    // Screwhead variation controls - will be populated after model loads
    const screwheadControls = document.createElement("div");
    screwheadControls.className = "screwhead-controls";
    screwheadControls.innerHTML = "<h3>Screwhead Types</h3>";
    container.appendChild(screwheadControls);

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

    // Function to setup screwhead controls after model loads
    const setupScrewheadControls = () => {
      const variations = configurator.getAvailableScrewheadVariations();

      // Clear existing screwhead buttons
      const existingButtons = screwheadControls.querySelectorAll("button");
      existingButtons.forEach((btn) => btn.remove());

      if (variations.length > 0) {
        // Add button to show all screwheads
        const showAllBtn = document.createElement("button");
        showAllBtn.textContent = "Show All";
        showAllBtn.onclick = () => configurator.showAllScrewheads();
        screwheadControls.appendChild(showAllBtn);

        // Add button to hide all screwheads
        const hideAllBtn = document.createElement("button");
        hideAllBtn.textContent = "Hide All";
        hideAllBtn.onclick = () => configurator.hideAllScrewheads();
        screwheadControls.appendChild(hideAllBtn);

        // Add buttons for each screwhead variation
        variations.forEach((variation) => {
          const button = document.createElement("button");
          button.textContent = `Show ${variation}`;
          button.onclick = () => configurator.showScrewheadVariation(variation);
          screwheadControls.appendChild(button);
        });
      } else {
        const noScrewheadsMsg = document.createElement("p");
        noScrewheadsMsg.textContent = "No screwhead variations found";
        screwheadControls.appendChild(noScrewheadsMsg);
      }
    };

    // Setup controls after a short delay to ensure model is loaded
    setTimeout(() => {
      setupHandleControls();
      setupScrewheadControls();
    }, 1000);

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
        modelUrl: "/models/screwdriver.glb", // Updated to match the current model
        color: configurator.getCurrentColor(),
        cameraPosition,
        modelScale,
        visibleHandleVariations: configurator.getVisibleHandleVariations(),
        visibleScrewheadVariations:
          configurator.getVisibleScrewheadVariations(),
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
          visibleScrewheadVariations: config.visibleScrewheadVariations,
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
