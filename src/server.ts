import express from "express";
import cors, { CorsOptions } from "cors";
import router from "./routes/ocrRoutes";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS options for both dev and prod
const corsOptions: CorsOptions = {
  // origin: [
  //   process.env.FRONTEND_URL_PROD || "https://ocrclient.vercel.app", 
  //   process.env.FRONTEND_URL_DEV || "http://localhost:5173"          
  // ],
  origin:"*",
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS","PATCH"],
  allowedHeaders: ["Content-Type","Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json()); 
app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
