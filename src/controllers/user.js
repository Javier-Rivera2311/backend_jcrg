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


const addContact = async (req, res) => {
  const { Name, email, Phone, Commune, job, project } = req.body;
  const name = Name;
  const phone = Phone;
  const commune = Commune;
  if (!name || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: "Faltan campos obligatorios: name, email o phone"
    });
  }

  try {
    const connection = await createConnection();
    const [result] = await connection.execute(
      `INSERT INTO Contacts (Name, email, Phone, Commune, job, project) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone, commune, job, project]
    );
    await connection.end();

    return res.status(201).json({
      success: true,
      message: "Usuario insertado correctamente",
      insertedId: result.insertId
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Problemas al insertar el usuario",
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

// editar contactos

const updateContact = async (req, res) => {
  const { id } = req.params;
  const { Name, email, Phone, Commune, job, project } = req.body;
  const name = Name;
  const phone = Phone;
  const commune = Commune;

  try {
    const connection = await createConnection();
    const [result] = await connection.execute(
      `UPDATE Contacts SET Name = ?, email = ?, Phone = ?, Commune = ?, job = ?, project = ? WHERE ID = ?`,
      [name, email, phone, commune, job, project, id]
    );
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Contacto no encontrado' });
    }

    return res.status(200).json({
      success: true,
      message: 'Contacto actualizado correctamente'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Problemas al actualizar el contacto",
      code: error
    });
  }
};

const deleteContact = async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await createConnection();
    const [result] = await connection.execute(
      'DELETE FROM Contacts WHERE ID = ?',
      [id]
    );
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Contacto no encontrado' });
    }

    return res.status(200).json({
      success: true,
      message: 'Contacto eliminado correctamente'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Problemas al eliminar el contacto",
      code: error
    });
  }
};


// Para el registro de usuario
const setUsuario = async (req, res) => {
  try {
    const {
      name,
      mail,
      password,
      confirmPassword,
      department_id,
    } = req.body;

    // Validar seguridad de la contraseña
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos una mayúscula, una minúscula, un número, un carácter especial y mínimo 6 caracteres.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Las contraseñas no coinciden'
      });
    }

    const connection = await createConnection();

    // Validar si el correo ya existe (respetando "mail" exacto)
    const [existing] = await connection.execute(
      'SELECT * FROM Workers WHERE mail = ?',
      [mail]
    );

    if (existing.length > 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        error: 'El correo ya está registrado'
      });
    }

    // Verificar que el departamento exista
    const [depCheck] = await connection.execute(
      'SELECT * FROM Department WHERE ID = ?',
      [department_id]
    );

    if (depCheck.length === 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        error: 'Departamento inválido'
      });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario (sin mail_personal)
    const [insertResult] = await connection.execute(
      'INSERT INTO Workers (Name, mail, password, department_id) VALUES (?, ?, ?, ?)',
      [name, mail, hashedPassword, department_id]
    );

    await connection.end();

    return res.status(200).json({
      success: true,
      message: 'Usuario registrado correctamente',
      insertId: insertResult.insertId
    });

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return res.status(500).json({
      success: false,
      error: 'Problemas al registrar usuario',
      code: error
    });
  }
};


const getDepartmentsForRegister = async (req, res) => {
  try {
    const connection = await createConnection();
    const [departments] = await connection.execute('SELECT ID, name_dep FROM Department');
    await connection.end();

    return res.status(200).json({
      success: true,
      departments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error al obtener los departamentos',
      code: error
    });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const connection = await createConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM Workers WHERE mail = ?', 
      [email]
    );
    await connection.end();

    if (rows.length === 1) {
      const user = rows[0];

      // Comparar la contraseña ingresada con el hash almacenado
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        const token = jwt.sign({ id: user.ID }, 'secret-key', { expiresIn: '12h' });

        return res.status(200).json({
          success: true,
          message: "Inicio de sesión exitoso",
          token: token,
          name: user.Name,
          email: user.mail,
          department_id: user.department_id,
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
    console.error('Error en login:', error);
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

const getTask = async (req, res) => {
  try {
    const connection = await createConnection();

    const [rows] = await connection.execute(`
      SELECT 
        t.ID,
        t.title,
        t.state,
        t.date_finish,
        t.workers,
        t.description,
        c.name AS category
      FROM 
        Task t
      JOIN 
        Category c ON t.category_id = c.id;
    `);

    await connection.end();

    return res.status(200).json({
      success: true,
      tasks: rows
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener las tareas",
      code: error
    });
  }
};



const addTask = async (req, res) => {
  try {
    const { title, date_finish, workers, category_name, description } = req.body;

    if (!title || !date_finish || !workers || !category_name || !description) {
      return res.status(400).json({
        success: false,
        error: "Faltan campos",
        body: { title, date_finish, workers, category_name, description }
      });
    }

    const connection = await createConnection();

    // Buscar el ID de la categoría por su nombre
    const [categoryResult] = await connection.execute(
      `SELECT id FROM Category WHERE name = ?`,
      [category_name]
    );

    if (categoryResult.length === 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        error: `La categoría '${category_name}' no existe`
      });
    }

    const category_id = categoryResult[0].id;

    // Insertar tarea con descripción
    await connection.execute(
      `INSERT INTO Task (title, state, date_finish, workers, category_id, description)
       VALUES (?, 'pendiente', ?, ?, ?, ?)`,
      [title, date_finish, workers, category_id, description]
    );

    await connection.end();

    return res.status(201).json({
      success: true,
      message: "Tarea creada exitosamente"
    });

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({
      success: false,
      error: "Error interno al crear la tarea",
      code: error.message
    });
  }
};



const updateTask = async (req, res) => {
  try {
    const { id, title, description, state, date_finish, workers } = req.body;

    if (!id || !title || !description || !state || !date_finish || !workers) {
      return res.status(400).json({
        success: false,
        error: "Faltan campos para actualizar la tarea",
        body: { id, title, description, state, date_finish, workers }
      });
    }

    const connection = await createConnection();

    await connection.execute(`
      UPDATE Task
      SET title = ?, description = ?, state = ?, date_finish = ?, workers = ?
      WHERE ID = ?
    `, [title, description, state, date_finish, workers, id]);

    await connection.end();

    return res.status(200).json({
      success: true,
      message: "Tarea actualizada correctamente"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error al actualizar la tarea",
      code: error
    });
  }
};

const updateTaskState = async (req, res) => {
  try {
    const { id, state } = req.body;

    if (!id || !state) {
      return res.status(400).json({
        success: false,
        error: "Faltan campos: id y state son obligatorios",
        body: { id, state }
      });
    }

    const connection = await createConnection();

    await connection.execute(`
      UPDATE Task
      SET state = ?
      WHERE ID = ?
    `, [state, id]);

    await connection.end();

    return res.status(200).json({
      success: true,
      message: "Estado de la tarea actualizado correctamente"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error al actualizar el estado de la tarea",
      code: error
    });
  }
};


const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "El ID de la tarea es obligatorio"
      });
    }

    const connection = await createConnection();

    await connection.execute(`
      DELETE FROM Task
      WHERE ID = ?
    `, [id]);

    await connection.end();

    return res.status(200).json({
      success: true,
      message: "Tarea eliminada correctamente"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error al eliminar la tarea",
      code: error
    });
  }
};


const getMeet = async (req, res) => {
  try {
    const connection = await createConnection();

    const [rows] = await connection.execute(`
      SELECT * FROM Meetings
    `);

    await connection.end();

    return res.status(200).json({
      success: true,
      meetings: rows
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener las reuniones",
      code: error
    });
  }
};

const addMeet = async (req, res) => {
  try {
    const { date, time, type, Title, details, url, address } = req.body;
    const connection = await createConnection();

    // Verifica el tipo y define valores nulos si no corresponden
    const finalUrl = type === 'presencial' ? url || null : null;
    const finalAddress = type === 'virtual' ? address || null : null;

    await connection.execute(`
      INSERT INTO Meetings (date, time, type, title, details, url, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [date, time, type, Title, details, finalUrl, finalAddress]);

    await connection.end();

    return res.status(200).json({
      success: true,
      message: "Reunión añadida correctamente"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error al añadir la reunión",
      code: error
    });
  }
};


const updateMeet = async (req, res) => {
  try {
    const { date, time, type, Title, details, url, address } = req.body;
    const { id } = req.params;
    const connection = await createConnection();

    const finalUrl = type === 'virtual' ? url || null : null;
    const finalAddress = type === 'presencial' ? address || null : null;

    await connection.execute(`
      UPDATE Meetings
      SET date = ?, time = ?, type = ?, title = ?, details = ?, url = ?, address = ?
      WHERE ID = ?
    `, [date, time, type, Title, details, finalUrl, finalAddress, id]);

    await connection.end();

    return res.status(200).json({
      success: true,
      message: "Reunión actualizada correctamente"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error al actualizar la reunión",
      code: error
    });
  }
};


const getTickets = async (req, res) => {
  try {
    const connection = await createConnection();

    const [rows] = await connection.execute(`
      SELECT 
        T.id AS id,
        T.title,
        T.description,
        T.status,
        T.priority,
        T.creation_date,
        T.resolution_date,
        T.support_response,
        W.Name AS worker_name,
        D.name_dep AS department_name
      FROM 
        Tickets T
      JOIN 
        Workers W ON T.worker_id = W.ID
      JOIN 
        Department D ON T.department_id = D.ID
    `);

    await connection.end();

    return res.status(200).json({
      success: true,
      data: rows
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener los tickets",
      code: error
    });
  }
};



const getDepartamentosUsuarios = async (req, res) => {
  try {
    // Obtener el token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'No token' });

    // Decodificar el token
    const decoded = jwt.verify(token, 'secret-key');
    const userId = decoded.id;

    const connection = await createConnection();

    // Buscar SOLO los departamentos del usuario autenticado
    const [rows] = await connection.execute(`
      SELECT 
        ID, Name, department_id 
      FROM 
        Workers
      WHERE
        ID = ?
    `, [userId]);

    await connection.end();

    return res.status(200).json({
      success: true,
      departamentos: rows
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      error: "Problemas al traer los department_id de los usuarios",
      code: error
    });
  }
};

const updateTicket = async (req, res) => {
  const { id } = req.params;
  let { status, priority, resolution_date, support_response } = req.body;

  try {
    // Si el ticket se cierra y no hay fecha de resolución, usar la actual
    if (status === 'Cerrado' && (!resolution_date || resolution_date === '')) {
      const now = new Date();
      resolution_date = now.toISOString().slice(0, 19).replace('T', ' ');
    }

    console.log("Datos a actualizar:", {
      id,
      status,
      priority,
      resolution_date,
    });

    const connection = await createConnection();

    const [result] = await connection.execute(
      `UPDATE Tickets 
       SET status = ?, priority = ?, resolution_date = ? , support_response = ?
       WHERE id = ?`,
      [status, priority, resolution_date || null, support_response || null, id]
    );

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Ticket actualizado correctamente'
    });

  } catch (error) {
    console.error('Error al actualizar ticket:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar el ticket',
      code: error
    });
  }
};

const createTicket = async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    const worker_id = req.user.id;

    const connection = await createConnection();

    // Obtener el departamento del trabajador
    const [userRow] = await connection.execute(
      'SELECT department_id FROM Workers WHERE ID = ?',
      [worker_id]
    );

    if (userRow.length === 0) {
      await connection.end();
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const department_id = userRow[0].department_id;

    await connection.execute(`
      INSERT INTO Tickets (title, description, status, priority, creation_date, worker_id, department_id)
      VALUES (?, ?, 'Abierto', ?, NOW(), ?, ?)
    `, [title, description, priority, worker_id, department_id]);

    await connection.end();

    return res.status(201).json({
      success: true,
      message: "Ticket creado correctamente"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error al crear el ticket",
      code: error
    });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const worker_id = req.user.id;

    const connection = await createConnection();

    const [rows] = await connection.execute(`
      SELECT 
        T.id AS id,
        T.title,
        T.description,
        T.status,
        T.priority,
        T.creation_date,
        T.resolution_date,
        T.support_response,
        W.Name AS worker_name,
        D.name_dep AS department_name
      FROM 
        Tickets T
      JOIN 
        Workers W ON T.worker_id = W.ID
      JOIN 
        Department D ON T.department_id = D.ID
      WHERE 
        T.worker_id = ?
      ORDER BY 
        T.creation_date DESC
    `, [worker_id]);

    await connection.end();

    return res.status(200).json({
      success: true,
      tickets: rows
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener los tickets del usuario",
      code: error
    });
  }
};

const getListWorker = async (req, res) => {
  try {
    const connection = await createConnection();

    const [rows] = await connection.execute(`
      SELECT * FROM Workers_task
    `);

    await connection.end();

    return res.status(200).json({
      success: true,
      meetings: rows
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener los trabajadores de la oficina",
      code: error
    });
  }
};

const getCategory = async (req, res) => {
  try {
    const connection = await createConnection();

    const [rows] = await connection.execute(`
      SELECT * FROM Category
    `);

    await connection.end();

    return res.status(200).json({
      success: true,
      meetings: rows
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener las categorias",
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
    updateContact,
    addContact,
    deleteContact,
    getTask,
    addTask,
    updateTask,
    getMeet,
    addMeet,
    updateMeet,
    getDepartmentsForRegister,
    getDepartamentosUsuarios,
    getTickets,
    updateTicket,
    createTicket,
    getMyTickets,
    getListWorker,
    getCategory,
    deleteTask,
    updateTaskState 
}
