import express from 'express'
import authRoutes from "./routes/auth.route.js"
import messageRoutes from "./routes/message.route.js"
import dotenv from "dotenv"
import { connectDB } from './lib/db.js';
import cookieParser from "cookie-parser"
import cors from "cors"
import { app,server } from './lib/socket.js';

import path from "path"


const __dirname=path.resolve();
dotenv.config()


app.use(express.json({limit:"50mb"}))
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(cookieParser())
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}
))

const PORT=process.env.PORT
app.use("/api/auth",authRoutes)
app.use("/api/messages",messageRoutes)

if(process.env.NODE_ENV==="production"){
    app.use(express.static(path.join(__dirname,"../frontend/dist")));

    app.get("/*",(req,res)=>{
        res.sendFile(path.join(__dirname,"../frontend","dist","index.html"));
    })
}
server.listen(PORT,()=>{
    console.log("Server is running on port:"+ PORT)
    connectDB()
})