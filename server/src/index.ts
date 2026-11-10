import "dotenv/config";
import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.js";
import cors, { CorsOptions } from "cors";

const app = express();
const port = Number(process.env.PORT) || 3000;

const corsOptions: CorsOptions = {
  origin: process.env.FRONTEND_ADDRESS ?? "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
