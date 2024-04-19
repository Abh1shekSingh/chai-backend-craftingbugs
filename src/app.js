import express from "express";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json({limit: '16kb'}))
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    optionsSuccessStatus: 200,
    Credential:true
}))
app.use(express.urlencoded({extended: true, limit:'16kb'}))
app.use(express.static('public'))
app.use(cookieParser())

export { app }