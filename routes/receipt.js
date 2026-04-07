const express = require("express");
const multer = require("multer");
const router = express.Router();

const upload = multer({ dest: "uploads/" });

// Render the Receipt UI
router.get("/receipt", (req, res) => {
    res.render("receipt"); // views/receipt.ejs
});

// Upload + Parse API
router.post("/api/receipt/parse", upload.single("receipt"), async (req, res) => {
    if (!req.file) {
        return res.json({ success: false, msg: "No file uploaded" });
    }

    // For now, return file info (OCR will be added later)
    res.json({
        success: true,
        msg: "File uploaded successfully",
        file: req.file
    });
});

module.exports = router;
