import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv"
import authRoute from "./src/routes/auth.routes.js"

dotenv.config();
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/api/v1", authRoute)

app.get("/", (req, res) => {
    res.json({
        msg: "Server is running"
    })
})

app.listen(port, () => {
    console.log(`server running on port ${port}`);
    
})
