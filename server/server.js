import express from 'express';
require('dotenv').config();
import cors from 'cors';
import initRoutes from './src/routes';
import connectDB from './src/config/mongoDb';
import cookieParser from "cookie-parser";


const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true, 
    methods: ["POST", "GET", "PUT", "DELETE"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectDB()
initRoutes(app)

const listener = app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${listener.address().port}`);
});
