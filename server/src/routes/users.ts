import { Router } from 'express';
import {
  createUserValidator,
  idParamValidator,
  updateUserValidator,
} from '../validators/userValidator';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/userController';
import { handleValidationErrors } from '../middleware/handleValidationErrors';

const router = Router();


// For creating user
router.post('/', createUserValidator, handleValidationErrors, createUser);

// For getting a user by id
router.get('/:id', idParamValidator, handleValidationErrors, getUserById);

// For updating user
router.patch('/:id', idParamValidator, updateUserValidator, handleValidationErrors, updateUser);

// For deleting user
router.delete('/:id', idParamValidator, handleValidationErrors, deleteUser);


export default router;