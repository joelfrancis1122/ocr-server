import express from "express";
import cors, { CorsOptions } from "cors";
import router from "./routes/ocrRoutes";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS options for both dev and prod
app.use(cors()); 

app.use(express.json()); 
app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
