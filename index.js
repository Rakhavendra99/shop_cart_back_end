import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import db from "./config/Database.js";
import SequelizeStore from "connect-session-sequelize";
import UserRoute from "./routes/UserRoute.js";
import ProductRoute from "./routes/ProductRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import CategoryRoute from "./routes/CategoryRoute.js"
import CartRoute from "./routes/CartRoute.js"
import StoreRoute from "./routes/StoreRoute.js"
import VendorRoute from "./routes/VendorRoute.js";
import CookingRateRoute from "./routes/CookingRateRoute.js";
import config from "./config/index.js";
import portocal from 'http'
import OrderRoute from './routes/OrderRoute.js'
import PaymentRoute from './routes/PaymentRoute.js'
import { handleStripeWebhook } from './controllers/StripeController.js'
dotenv.config();
const { port } = config;

const app = express();

// Behind HTTPS reverse proxy / dev tunnel: required so secure cookies and req.secure work.
if (process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
}

const sessionStore = SequelizeStore(session.Store);

const store = new sessionStore({
    db: db,
    // DB schema uses lowercase `sessions`; default package table is `Sessions` (breaks on Linux MySQL).
    tableName: "sessions",
});

// (async()=>{
//     await db.sync({ alter: true });
// })();

// Cross-origin UI (e.g. localhost:3000) + API on another host needs SameSite=None; Secure (see .env).
const rawSameSite = (process.env.SESSION_SAME_SITE || "lax").toLowerCase();
const sameSiteCookie =
    rawSameSite === "none" ? "none" : rawSameSite === "strict" ? "strict" : "lax";
const sessionCookieSecure =
    sameSiteCookie === "none" ? true : "auto";

app.use(session({
    secret: process.env.SESSION_SECRET || "123456789",
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
        secure: sessionCookieSecure,
        sameSite: sameSiteCookie,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
}));

app.use(cors({
  credentials: true,
  origin: true
}));

// Stripe webhook needs raw body for signature verification - must be before express.json()
app.use('/payment/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());
app.use(UserRoute);
app.use(ProductRoute);
app.use(AuthRoute);
app.use(CategoryRoute);
app.use(CartRoute);
app.use(StoreRoute);
app.use(VendorRoute);
app.use(CookingRateRoute);
app.use(OrderRoute);
app.use('/payment', PaymentRoute);

const HttpServer = portocal.createServer(app);

// store.sync();
HttpServer.on('error', onError);
HttpServer.on('listening', onListening);
HttpServer.listen(port);
/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    var addr = HttpServer.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.info('Listening on ' + bind);
}
