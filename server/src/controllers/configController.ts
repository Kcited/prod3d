// controllers/configController.ts
import { Request, Response } from "express";

// Temporary in-memory array to store configurations (this will reset when server restarts)
// In a real application, you would use a database to persist this data
// For example, you could use MongoDB, PostgreSQL, etc.
// This is just a placeholder for demonstration purposes.
// Replace this with actual database logic in production.
const configurations: any[] = [];

// Save a new configuration
export const saveConfig = (req: Request, res: Response) => {
  const config = req.body;
  config.id = Date.now().toString(); // simple ID
  configurations.push(config);
  res.json({ id: config.id });
};

// Get a configuration by ID
export const getConfig = (req: Request, res: Response) => {
  const config = configurations.find((c) => c.id === req.params.id);
  if (config) {
    res.json(config);
  } else {
    res.status(404).json({ error: "Not found" });
  }
};
