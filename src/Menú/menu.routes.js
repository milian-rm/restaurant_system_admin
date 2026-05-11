// src/Menú/menu.routes.js
import { Router } from 'express';
import { getMenu } from './menu.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const api = Router();

// Todos los usuarios logueados (clientes y admins) pueden ver el menú consolidado
api.get(
    '/', 
    [validateJWT], 
    getMenu
);

export default api;