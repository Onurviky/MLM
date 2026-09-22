import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

export async function uploadImage(req: Request, res: Response) {
  if (!req.file) {
    throw new ApiError(400, "No se recibio ningun archivo");
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
}
