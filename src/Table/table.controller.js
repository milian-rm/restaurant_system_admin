'use strict';

import Table from './table.model.js';

/* -----------------------------------------
   CREAR MESA (ADMIN)
------------------------------------------*/
export const saveTable = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const data = { ...req.body };

        // BRANCH_ADMIN solo en su sucursal
        if (req.user.role === 'BRANCH_ADMIN') {
        if (!req.user.branchId) {
            return res.status(400).json({
            success: false,
            message: 'El usuario no tiene branchId asignado'
            });
        }
        data.branchId = req.user.branchId;
        }

        const table = await Table.create(data);

        return res.status(201).json({
        success: true,
        message: 'Mesa registrada',
        table
        });

    } catch (err) {
        // Error típico por índice compuesto duplicado
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
   OBTENER MESAS (ADMIN)
   - EMPLOYEE / BRANCH_ADMIN: solo ve mesas de su sucursal
   - PLATFORM_ADMIN: ve todas las mesas
   - (En admin-api no se contempla CLIENT)
   - Soporta query TableStatus para filtrar (opcional)
------------------------------------------*/
export const getTables = async (req, res) => {
    try {
        const filter = {};

        // Restricción por sucursal para personal de sucursal
        if (['EMPLOYEE', 'BRANCH_ADMIN'].includes(req.user.role)) {
            if (!req.user.branchId) {
                return res.status(400).json({
                    success: false,
                    message: 'El usuario no tiene branchId asignado'
                });
            }
            filter.branchId = req.user.branchId;
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
   ACTUALIZAR MESA (ADMIN)
   - PLATFORM_ADMIN: puede actualizar cualquier mesa
   - BRANCH_ADMIN: solo puede actualizar mesas de su sucursal
------------------------------------------*/
export const updateTable = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;
        const data = req.body;

        const table = await Table.findById(id);
        if (!table) {
            return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
        }

        // BRANCH_ADMIN solo puede modificar mesas de su sucursal
        if (req.user.role === 'BRANCH_ADMIN') {
            if (!req.user.branchId) {
                return res.status(400).json({
                    success: false,
                    message: 'El usuario no tiene branchId asignado'
                });
            }
            if (table.branchId?.toString() !== req.user.branchId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado para modificar mesas de otra sucursal'
                });
            }
        }

        const updated = await Table.findByIdAndUpdate(id, data, { new: true, runValidators: true });

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
   CAMBIAR ESTADO (SOFT DELETE) (ADMIN)
   - PLATFORM_ADMIN: puede cambiar estado de cualquier mesa
   - BRANCH_ADMIN / EMPLOYEE: solo mesas de su sucursal
------------------------------------------*/
export const changeTableStatus = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;

        const table = await Table.findById(id);
        if (!table) {
            return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
        }

        // Personal de sucursal solo puede cambiar estado de su sucursal
        if (['BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            if (!req.user.branchId) {
                return res.status(400).json({
                    success: false,
                    message: 'El usuario no tiene branchId asignado'
                });
            }
            if (table.branchId?.toString() !== req.user.branchId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado para cambiar estado de mesas de otra sucursal'
                });
            }
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