
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import express from 'express';
import value from './const/const.js';
//archivo de la confiraciaona de bd 
import './database/connection.js'

const app = express(); //crear instancia app


const corsOptions = {
    credentials: true,
    optionSuccessStatus:200,
    methods: "GET, PUT, POST, DELETE",
    origin: '*'
};


/* The code `app.set('env', value.NODE_ENV)` is setting the environment variable for the Express.js
application. The value of `value.NODE_ENV` is being assigned to the `env` setting. This is typically
used to determine the application's behavior based on the environment it is running in, such as
development, production, or testing. */

app.set('env', value.NODE_ENV);
app.set('port', value.RUN_PORT);

/* The code `app.use(morgan('dev'))` is setting up the Morgan middleware, which is a logging middleware
for Express.js. It logs HTTP requests to the console in a development-friendly format. */
app.use(morgan('dev'));
app.use(cors(corsOptions));
app.use(express.json({limit: '500MB'}));
app.use(express.urlencoded({extended:true}));

//static folder
app.use(express.static(path.join(path.resolve(), value.STATIC_PATH)));


//ENDPOINTs
import routerUser from './routes/user.js';
//import routerRutas from './routes/rutas.js';

/* `app.use('/user', routerUser)` is setting up a middleware for the Express.js application. It
specifies that any requests with a URL starting with '/user' should be handled by the `routerUser`
router. */
app.use('/user', routerUser);
//app.use('/rutas', routerRutas);

export default app