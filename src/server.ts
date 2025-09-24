
import express from "express"
import cors, { CorsOptions } from "cors";
import router from "./routes/ocrRoutes";

const app = express()
import dotenv from "dotenv";
dotenv.config();
const PORT = process.env.PORT || 3000
const corsOptions: CorsOptions = {
  origin: ["FRONTEND_URL","http://localhost:7000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS","PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions))

app.use("/api", router);

app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`)
})