import { Request, Response } from "express";

export class ProductController {
	public getProducts(req: Request, res: Response) {
		// Example product data
		const products = [
			{ id: 1, name: "Product 1", model: "model1.gltf" },
			{ id: 2, name: "Product 2", model: "model2.gltf" },
		];
		res.json(products);
	}

	public getProductById(req: Request, res: Response) {
		const id = parseInt(req.params.id);
		// Example single product data
		const product = {
			id: id,
			name: `Product ${id}`,
			model: `model${id}.gltf`,
		};
		res.json(product);
	}
}

export default new ProductController();
