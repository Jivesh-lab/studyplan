import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ ALLOWED ORIGINS (LOCAL + DEPLOYED)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://studyplan-silk.vercel.app",
  "https://studyplan-git-main-jivesh-labs-projects.vercel.app"
];

// ✅ CORS CONFIG (FULLY COMPATIBLE)
app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server, curl, postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// ✅ IMPORTANT: Preflight support
app.options("*", cors());

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
