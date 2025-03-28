/* The code is importing the necessary modules and values for running a server in a JavaScript
application. */
import 'dotenv/config.js';
import app from './app.js';

import value from './const/const.js';

/* The code is defining a function called `main` using an immediately invoked function expression
(IIFE). Inside the function, it creates a server using the `app.listen()` method, which listens for
incoming requests on a specified port. The port number is determined by the value of
`value.RUN_PORT` or defaults to 5000 if `value.RUN_PORT` is undefined. */
const main = (() => {
    const server = app.listen( value.RUN_PORT || 5000 ); //instancia 
    console.log("Server activo", value.RUN_PORT || 5000);
    server.timeout = 600000;
})();