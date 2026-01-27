import express, { Request, Response } from "express";
import { readTestDefinition } from "./services/tests.service";

const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 3000;

app.use(express.json());

const corsOptions = {
    origin: "http://localhost:5173", // WHITELIST the frontend
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
    credentials: true, // Enable set cookie
};

// Enable CORS
app.use(cors(corsOptions));

// Optionally handle preflight requests
app.options("/test/random", cors(corsOptions));

app.get("/test/random", (req: Request, res: Response) => {
    const parsed = readTestDefinition("data-types");
    if (parsed) {
        res.status(200).json(parsed);
    } else {
        res.status(404).json({ message: "No tests were found!" });
    }
});

app.get("/health", (req: Request, res: Response) => {
    res.json({ message: "API is up and running!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
