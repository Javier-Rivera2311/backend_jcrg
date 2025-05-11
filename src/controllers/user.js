import mysql2 from 'mysql2/promise';
import connectionConfig from '../database/connection.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const createConnection = async ( ) => {
    return await mysql2.createConnection(connectionConfig);
}

const getUsuarios = async (req, res) => {
  try {
    const connection = await createConnection();

    const [rows] = await connection.execute(`
      SELECT 
        w.*, 
        d.name_dep AS department_name 
      FROM 
        Workers w
      LEFT JOIN 
        Department d ON w.department_id = d.ID
    `);

    await connection.end();

    return res.status(200).json({
      success: true,
      usuarios: rows
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      error: "Problemas al traer los usuarios",
      code: error
    });
  }
};


const getContacts = async ( req, res ) => {
  try {
      
      const connection = await createConnection();
      const [rows] = await connection.execute('SELECT * FROM Contacts');
      await connection.end();

      return res.status(200).json({
          success: true,
          usuarios: rows
      });

  } catch (error) {
      return res.status(500).json({
          status: false,
          error: "Problemas al traer los usuarios",
          code: error
      });
  }
};


// Para el registro de usuario

const setUsuario = async (req, res) => {
  try {
    const { name, lastname, email, password, confirmPassword} = req.body;
  // Validar que la contraseña cumpla con los requisitos
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      error: 'La contraseña debe tener al menos una mayúscula, una minúscula, un número, un carácter especial y ser de al menos 6 caracteres'
    });
  }      

  // Verificar que las contraseñas coincidan
  if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Las contraseñas no coinciden'
      });
    }

    // Verificar si el correo electrónico ya existe en la base de datos
    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT * FROM userapp WHERE email = ?', [email]);
    if (rows.length > 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        error: 'El correo electrónico ya está registrado'
      });
    }

    // Cifrar la contraseña antes de almacenarla en la base de datos
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el nuevo registro en la base de datos
    const [insertResult] = await connection.execute('INSERT INTO userapp (name, lastname, email, password) VALUES (?, ?, ?, ?)', [name, lastname, email, hashedPassword]);
    await connection.end();

    return res.status(200).json({
      success: true,
      usuarios: insertResult
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      error: 'Problemas al ingresar usuarios',
      code: error
    });
  }
};


// para validar el login del usuario
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT * FROM userapp WHERE email = ?', [email]);
    await connection.end();

    if (rows.length === 1) {
      const user = rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        // Genera un token de autenticación
        const token = jwt.sign({ id: user.ID }, 'secret-key', { expiresIn: '2h' });

        return res.status(200).json({
          success: true,
          message: "Inicio de sesión exitoso",
          token: token,  // Envía el token al cliente
          name: user.name,  // Envía el nombre del usuario al cliente
          email: user.email  // Envía el correo electrónico del usuario al cliente

        });
      } else {
        return res.status(401).json({
          success: false,
          error: "Correo electrónico o contraseña incorrectos"
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        error: "Correo electrónico o contraseña incorrectos"
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: "Problemas al iniciar sesión",
      code: error
    });
  }
};


const updateUser = async (req, res) => {
  try {
    const { email, password, edad, altura, peso, exercise_level } = req.body;

    // Comprobar que el correo electrónico y la contraseña están presentes
    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT * FROM userapp WHERE email = ?', [email]);

    if (rows.length === 1) {
      const user = rows[0];

      // Verificar la contraseña
      const passwordIsValid = await bcrypt.compare(password, user.password);
      if (!passwordIsValid) {
        await connection.end();
        return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
      }

      // Actualizar solo los campos que se proporcionaron
      const fieldsToUpdate = { edad, altura, peso, exercise_level };
      for (const field in fieldsToUpdate) {
        if (fieldsToUpdate[field] !== undefined) {
          await connection.execute(`UPDATE userapp SET ${field} = ? WHERE email = ?`, [fieldsToUpdate[field], email]);
        }
      }

      await connection.end();

      return res.status(200).json({
        success: true,
        message: "Información del usuario actualizada con éxito"
      });
    } else {
      await connection.end();
      return res.status(401).json({
        success: false,
        error: "Usuario no encontrado"
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: "Problemas al actualizar la información del usuario",
      code: error
    });
  }
}
//cambiar la contraseña del usuario

const changePassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT * FROM userapp WHERE email = ?', [email]);

    if (rows.length === 1) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await connection.execute('UPDATE userapp SET password = ? WHERE email = ?', [hashedPassword, email]);
      await connection.end();

      return res.status(200).json({
        success: true,
        message: "Contraseña actualizada con éxito"
      });
    } else {
      await connection.end();
      return res.status(401).json({
        success: false,
        error: "Correo electrónico no encontrado"
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: "Problemas al actualizar la contraseña",
      code: error
    });
  }
};
export {
    login,
    getUsuarios,
    setUsuario,
    updateUser,
    changePassword,
    getContacts,
}
