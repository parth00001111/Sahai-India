import express from "express";
import cors from "cors";
import dotenv from "dotenv"

dotenv.config();
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());

app.get("/", (req, res) => {
    res.json({
        msg: "Server is running"
    })
})

app.listen(port, () => {
    console.log(`server running on port ${port}`);
    
})
