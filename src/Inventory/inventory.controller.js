'use strict';

import Inventory from './inventory.model.js';

/**
 * Crear insumo
 */
export const saveInventory = async (req, res) => {
    try {
        const data = req.body;

        const inventory = new Inventory(data);

        await inventory.save(); 

        await inventory.populate('branchId', 'name');

        return res.status(201).send({
            success: true,
            message: 'Insumo guardado',
            inventory
        });

    } catch (err) {
        return res.status(500).send({
            success: false,
            message: 'Error al guardar',
            err: err.message ?? err
        });
    }
};

/**
 * Obtener inventario
 */
export const getInventory = async (req, res) => {
    try {
        const { branchId, status } = req.query;

        const filter = {};

        if (branchId) filter.branchId = branchId;
        if (status) filter.status = status;

        const items = await Inventory.find(filter)
        .populate('branchId', 'name')
        .sort({ createdAt: -1 });

        return res.send({
            success: true,
            items
        });

    } catch (err) {
        return res.status(500).send({
            success: false,
            message: 'Error al obtener inventario',
            err: err.message ?? err
        });
    }
};

/**
 * Editar un insumo
 */
export const updateInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updatedItem = await Inventory.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        }).populate('branchId', 'name');

        if (!updatedItem) {
            return res.status(404).send({
                success: false,
                message: 'Insumo no encontrado'
            });
        }

        return res.send({
            success: true,
            message: 'Insumo actualizado',
            updatedItem
        });

    } catch (err) {
        return res.status(500).send({
            success: false,
            message: 'Error al actualizar',
            err: err.message ?? err
        });
    }
};

/**
 * Soft Delete toggle
 */
export const deleteInventory = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await Inventory.findById(id);

        if (!item) {
            return res.status(404).send({
                success: false,
                message: 'Insumo no encontrado'
            });
        }

        const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const deletionDate = newStatus === 'INACTIVE' ? new Date() : null;

        const updatedItem = await Inventory.findByIdAndUpdate(
            id,
            {
                status: newStatus,
                deletedAt: deletionDate
            },
            {
                new: true
            }
        ).populate('branchId', 'name');

        return res.send({
            success: true,
            message: `Insumo marcado como ${newStatus}`,
            updatedItem
        });

    } catch (err) {
        return res.status(500).send({
            success: false,
            message: 'Error',
            err: err.message ?? err
        });
    }
};