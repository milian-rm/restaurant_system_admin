'use strict';

import Table from './table.model.js';

/* -----------------------------------------
   CREAR MESA
------------------------------------------*/
export const saveTable = async (req, res) => {
    try {
        const data = { ...req.body };

        const table = await Table.create(data);

        return res.status(201).json({
            success: true,
            message: 'Mesa registrada',
            table
        });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe esa mesa en esta sucursal (numberTable duplicado)'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error al registrar mesa',
            err: err.message
        });
    }
};

/* -----------------------------------------
   OBTENER MESAS
------------------------------------------*/
export const getTables = async (req, res) => {
    try {
        const filter = {};

        if (req.query.branchId) {
            filter.branchId = req.query.branchId;
        }

        if (req.query.TableStatus) {
            filter.TableStatus = req.query.TableStatus;
        }

        const tables = await Table.find(filter).populate('branchId', 'name');

        return res.json({
            success: true,
            tables
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener mesas',
            err: err.message
        });
    }
};

/* -----------------------------------------
   ACTUALIZAR MESA
------------------------------------------*/
export const updateTable = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const table = await Table.findById(id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Mesa no encontrada'
            });
        }

        const updated = await Table.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });

        return res.json({
            success: true,
            message: 'Mesa actualizada',
            updated
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar',
            err: err.message
        });
    }
};

/* -----------------------------------------
   CAMBIAR ESTADO SOFT DELETE
------------------------------------------*/
export const changeTableStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const table = await Table.findById(id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Mesa no encontrada'
            });
        }

        table.TableStatus = table.TableStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        table.deletedAt = table.TableStatus === 'INACTIVE' ? new Date() : null;

        await table.save();

        return res.json({
            success: true,
            message: `Estado de mesa cambiado a ${table.TableStatus}`,
            table
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error al cambiar estado',
            err: err.message
        });
    }
};