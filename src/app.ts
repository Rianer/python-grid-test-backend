import express, { Request, Response } from "express";
import { generateNewTest, readTestDefinition } from "./services/tests.service";
import { DatabaseDefinition } from "./models/database.model";
import { getDatabaseDefinition } from "./services/database.service";

const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 3000;

const corsOptions = {
    origin: ["http://localhost:5173", "http://46.225.21.56"], // WHITELIST the frontend
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
    credentials: true, // Enable set cookie
};

export let databaseDefinition: DatabaseDefinition | null = null;

(async () => {
    try {
        console.log("Loading test database definitions...");
        databaseDefinition = await getDatabaseDefinition();
        console.log(`Loaded ${databaseDefinition.topics.length} tests`);

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

    app.get("/test/random", (req: Request, res: Response) => {
        generateNewTest().then((genTest) => {
            res.status(201).json(genTest);
        });
    });

    app.get("/test/:id", (req: Request, res: Response) => {
        const testId = String(req.params.id);
        const parsed = readTestDefinition(testId);

        if (parsed) {
            res.status(200).json(parsed);
        } else {
            res.status(404).json({
                message: `No test found with ID: ${testId}`,
            });
        }
    });

    app.get("/allTests", (req: Request, res: Response) => {
        res.status(200).json([...(databaseDefinition?.topics || [])]);
    });

    app.get("/health", (req: Request, res: Response) => {
        res.status(200).json({
            message: "Service is running",
        });
    });

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
