import { Router } from 'express';
import {
    saveInventory,
    getInventory,
    updateInventory,
    deleteInventory
} from './inventory.controller.js';

import {
    inventoryValidator,
    updateInventoryValidator
} from '../../middlewares/inventory-validator.js';

const api = Router();

api.post('/', inventoryValidator, saveInventory);

api.get('/', getInventory);

// Vamos a usar el estándar: solo el ID para editar y eliminar
api.put('/:id', updateInventoryValidator, updateInventory);

api.patch('/:id/status', deleteInventory);

export default api;