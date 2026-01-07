import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS: works for BOTH local + prod
app.use(
  cors({
    origin: process.env.NODE_ENV === "production"
      ? ["https://intelliplan.vercel.app"]
      : ["http://localhost:3000"],
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
