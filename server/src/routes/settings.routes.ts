import { Router } from "express";
import * as settingsController from "../controllers/settings.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const settingsRouter = Router();

settingsRouter.get("/", asyncHandler(settingsController.getPublicSettings));
