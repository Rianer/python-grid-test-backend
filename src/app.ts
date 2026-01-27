import express, { Request, Response } from "express";
import { readTestDefinition } from "./services/tests.service";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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
