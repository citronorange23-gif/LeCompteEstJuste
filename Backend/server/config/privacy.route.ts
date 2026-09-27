
import express from "express";
import { htmlText } from "./config";

const router = express.Router();

router.get("/", (req, res) => {
    res
        .status(200)
        .type("html")
        .send(htmlText);
});

export default router;