import * as THREE from "three";
import "./style.css";
import { Configurator } from "./components/Configurator";

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
