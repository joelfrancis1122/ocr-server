import express from "express"
import cors, { CorsOptions } from "cors";
import router from "./routes/ocrRoutes";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


const corsOptions: CorsOptions = {
  origin: process.env.FRONTEND_URL,  
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Frontend URL allowed: ${process.env.FRONTEND_URL}`);
});
