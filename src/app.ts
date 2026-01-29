import express, { Request, Response } from "express";
import { generateNewTest, readTestDefinition } from "./services/tests.service";
import { DatabaseDefinition } from "./models/database.model";
import { getDatabaseDefinition } from "./services/database.service";

const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 3000;

const corsOptions = {
    origin: "http://localhost:5173", // WHITELIST the frontend
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
    credentials: true, // Enable set cookie
};

export let databaseDefinition: DatabaseDefinition | null = null;

(async () => {
    try {
        console.log("Loading test database definitions...");
        databaseDefinition = await getDatabaseDefinition();
        console.log(`Loaded ${databaseDefinition.testIds.length} tests`);

        startServer();
    } catch (err) {
        console.error(
            "Critical: Failed to load test definitions → exiting",
            err,
        );
        process.exit(1);
    }
})();

function startServer() {
    app.use(cors(corsOptions));
    app.use(express.json());
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
        generateNewTest().then((genTest) => {
            res.json({ message: "API is up and running!" });
        });
    });

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
