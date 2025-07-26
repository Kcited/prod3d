# Product Configurator

This project is a simple product configurator built using Three.js for the client-side and Express.js for the server-side. It allows users to interact with a 3D model of a product, customizing its features in real-time.

## Project Structure

The project is divided into two main parts: the client and the server.

### Client

- **`client/src/main.ts`**: Entry point for the client-side application. Initializes the Three.js scene and renders the product configurator.
- **`client/src/components/Configurator.ts`**: Contains the `Configurator` class that handles the setup and interaction of the product configurator, including loading the GLTF model and managing user inputs.
- **`client/src/styles/main.css`**: Styles for the client-side application, defining the layout and appearance of the configurator.
- **`client/src/utils/three-helpers.ts`**: Utility functions for Three.js, such as loading models and setting up the scene.
- **`client/public/models/product.gltf`**: The GLTF model file for the product used in the configurator.
- **`client/index.html`**: Main HTML file that serves the client-side application, including necessary scripts and styles.
- **`client/package.json`**: Configuration file for the client-side npm project, listing dependencies and scripts.
- **`client/tsconfig.json`**: TypeScript configuration file for the client-side project.
- **`client/vite.config.ts`**: Configuration for Vite, the build tool used for the client-side application.

### Server

- **`server/src/app.ts`**: Entry point for the server-side application. Sets up the Express server and middleware.
- **`server/src/routes/api.ts`**: Exports the API routes for the server, handling requests related to product data.
- **`server/src/controllers/product.ts`**: Contains the `ProductController` class with methods for handling product-related requests.
- **`server/package.json`**: Configuration file for the server-side npm project.
- **`server/tsconfig.json`**: TypeScript configuration file for the server-side project.

### Root

- **`package.json`**: Root configuration file for the entire project, listing shared dependencies and scripts.

## Getting Started

To get started with the project, follow these steps:

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd product-configurator
   ```

2. Install dependencies for the client:
   ```bash
   cd client
   npm install
   ```

3. Install dependencies for the server:
   ```bash
   cd server
   npm install
   ```

4. Run the server:
   ```bash
   npm start
   ```

5. In a new terminal, run the client:
   ```bash
   cd client
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000` to view the product configurator.

## License

This project is licensed under the MIT License.