
import express from "express";
import { privacyText, contactText } from "./config";

const router = express.Router();

router.get("/privacy", (req, res) => {
    res
        .status(200)
        .type("html")
        .send(privacyText);
});

router.get("/contact", (req, res) => {
    res.status(200).type("html").send(contactText);
});

export default router;