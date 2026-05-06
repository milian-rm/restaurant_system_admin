// C:\2022473\Proyectos 2026\Segundo Bimestre\ProyectoRestaurante\restaurant_system_admin\src\Table\table.routes.js
'use strict';

import { Router } from 'express';
import {
    saveTable,
    getTables,
    updateTable,
    changeTableStatus
} from './table.controller.js';

import { tableValidator } from './table.validator.js';

// 👇 1. IMPORTAR SEGURIDAD 👇
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const api = Router();

/**
 * GET - Listar
 * Se requiere estar logueado para ver la disposición de las mesas.
 */
api.get(
    '/', 
    [validateJWT], 
    getTables
);

/**
 * POST - Crear
 * Tanto el admin de plataforma como el de sucursal pueden registrar mesas.
 */
api.post(
    '/',
    [
        validateJWT,
        hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'),
        tableValidator
    ],
    saveTable
);

/**
 * PUT - Actualizar
 * Para mover coordenadas o cambiar capacidad.
 */
api.put(
    '/:id',
    [
        validateJWT,
        hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'),
        tableValidator
    ],
    updateTable
);

/**
 * PATCH - Estado (Soft Delete)
 */
api.patch(
    '/:id/status',
    [
        validateJWT,
        hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN')
    ],
    changeTableStatus
);

export default api;