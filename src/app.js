import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import expressSanitizer from "express-sanitizer"

const app = express()

// configurations
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// since data can come in any format so we need to tell express that we can expect data in following formats:
app.use(express.json({limit: "16kb"})) // to get data in json format
app.use(express.static("public")) // to get data from static files
app.use(express.urlencoded({extended: true})) // to get data from url
app.use(expressSanitizer()) // prevent injection attacks

app.use(cookieParser()) // to store and remove cookies in user's berowser

// import router

import userRoute from "./routes/user.route.js"

// router defination

app.use("/api/v1/users", userRoute)

export { app }