import mysql2 from 'mysql2';
import values from '../const/const.js';

/* The `connectionConfig` object is storing the configuration details for connecting to a MySQL
database. It includes the following properties: */
const connectionConfig = {
    host: values.HOST,
    user: values.USER,
    password: values.PASSWORD,
    database: values.DATABASE
};
/* The code is creating a connection to a MySQL database using the `mysql2` library. */
/* Print the host, user, and password */
console.log('Host:', connectionConfig.host);
console.log('User:', connectionConfig.user);
console.log('Password:', connectionConfig.password);

const connection = mysql2.createConnection({
    host: connectionConfig.host,
    user: connectionConfig.user,
    password: connectionConfig.password
});

/* The code `connection.query(`CREATE DATABASE IF NOT EXISTS ${connectionConfig.database}`, (error) =>
{ ... })` is executing a SQL query to create a database if it does not already exist. */
connection.query(`CREATE DATABASE IF NOT EXISTS ${connectionConfig.database}`, (error) => {
    if (error) {
      console.error('Error al crear la base de datos: ', error);
      return;
    }
  
    console.log('Base de datos creada o ya existente');
  
    // Conectar a la base de datos
    connectionConfig.database = connectionConfig.database;
  
    // Cerrar la conexión temporal
    connection.end();
});

export default connectionConfig;