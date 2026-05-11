// C:\2022473\Proyectos 2026\Segundo Bimestre\ProyectoRestaurante\restaurant_system_admin\src\Inventory\inventory.routes.js
'use strict';

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

import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const api = Router();

/**
 * GET - Listar Inventario
 * El personal logueado (como cocineros o administradores) necesita ver qué hay en stock.
 */
api.get(
    '/', 
    [validateJWT], 
    getInventory
);

/**
 * POST - Registrar Insumo
 * Solo los administradores pueden ingresar nuevas materias primas al sistema.
 */
api.post(
    '/', 
    [
        validateJWT,
        hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'),
        inventoryValidator
    ], 
    saveInventory
);

/**
 * PUT - Actualizar Insumo
 * Para cuando cambia el costo unitario o hacen ajustes manuales de stock.
 */
api.put(
    '/:id', 
    [
        validateJWT,
        hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'),
        updateInventoryValidator
    ], 
    updateInventory
);

/**
 * PATCH - Cambiar Estado (Soft Delete)
 * Para descontinuar un insumo (ej. ya no vendemos X marca de gaseosa).
 */
api.patch(
    '/:id/status', 
    [
        validateJWT,
        hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN')
    ], 
    deleteInventory
);

export default api;