'use strict';

import { Router } from 'express';
import {
    saveTable,
    getTables,
    updateTable,
    changeTableStatus
} from './table.controller.js';

import { tableValidator } from './table.validator.js';

const api = Router();

api.post(
    '/',
    tableValidator,
    saveTable
);

api.get(
    '/',
    getTables
);

// Usamos PATCH para el estado
api.put(
    '/:id',
    tableValidator,
    updateTable
);

api.patch(
    '/:id',
     changeTableStatus);

export default api;