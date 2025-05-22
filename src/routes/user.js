/* The code is creating a router object using the `Router` class from the `express` module. It then
defines two routes: */
import { Router } from 'express';

import { getUsuarios, setUsuario, changePassword, login,updateUser, getContacts,updateContact,addContact,deleteContact} from '../controllers/user.js';

const router = Router();

router.route('/ingresar')
    .post(setUsuario);

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

router.route('/updateContact')
    .put(updateContact);

router.route('/addContact')
    .post(addContact);
    
router.route('/deleteContact')
    .delete(deleteContact);


export default router;






