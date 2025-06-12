/* The code is creating a router object using the `Router` class from the `express` module. It then
defines two routes: */
import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getUsuarios,
  setUsuario,
  changePassword,
  login,
  updateUser,
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
  deleteMeet,
  getDepartmentsForRegister,
  getDepartamentosUsuarios,
  getTickets,
  updateTicket,
  getMyTickets,
  createTicket,
  getListWorker,
  getCategory,
  deleteTask,
  updateTaskState 

} from '../controllers/user.js';

const router = Router();

router.route('/ingresar')
    .get(getDepartmentsForRegister)  // ← Devuelve la lista de departamentos
    .post(setUsuario);               // ← Registra al nuevo usuario

router.route('/mostrar')
    .get(getUsuarios);

router.route('/login')
    .post(login);

router.route('/changePassword')
    .post(changePassword);

router.route('/updateUser')
    .post(updateUser);

router.route('/Contacts')
    .get(getContacts);

router.route('/updateContact/:id')
    .put(updateContact);

router.route('/addContact')
    .post(addContact);

router.route('/deleteContact/:id')
    .delete(deleteContact);

    // Task routes
router.route('/getTasks')
    .get(getTask);

router.route('/addTask')
    .post(addTask);

router.route('/updateTask/:id')
    .put(updateTask);

    
// Meeting routes
router.route('/getMeetings')
    .get(getMeet);

router.route('/addMeeting')
    .post(addMeet);

router.route('/updateMeeting/:id')
    .put(updateMeet);

router.route('/deleteMeeting/:id')
    .delete(deleteMeet);


router.route('/departamentosUsuarios')
    .get(getDepartamentosUsuarios); // ← Devuelve los departamentos de los usuarios

router.route('/tickets')
    .get(getTickets); // ← Devuelve la lista de tickets

router.route('/updateTicket/:id')
    .put(updateTicket);

router.route('/createTicket')
  .post(verifyToken, createTicket);

router.route('/myTickets')
  .get(verifyToken, getMyTickets);

router.route('/listWorker')
    .get(getListWorker);


router.route('/Category')
    .get(getCategory);

// Ruta para actualizar solo el estado de una tarea
router.route('/Task/state')
  .put(updateTaskState);

// Ruta para eliminar una tarea por ID
router.route('/Task/:id')
  .delete(deleteTask);



export default router;






