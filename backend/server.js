import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Allowed origins (local + deployed)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://studyplan-silk.vercel.app",
  "https://studyplan-git-main-jivesh-labs-projects.vercel.app"
];

// ✅ CORS (Node 22 compatible)
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests without origin (Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed"));
    },
    credentials: true
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "StudyPlan API is running" });
});

// DB + server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err);
  });
