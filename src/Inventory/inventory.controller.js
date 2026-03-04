'use strict';

import Inventory from './inventory.model.js';

/**
 * Crear insumo
 * PLATFORM_ADMIN: puede crear en cualquier branchId
 * BRANCH_ADMIN: solo puede crear en SU branchId
 */
export const saveInventory = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
            return res.status(403).send({ success: false, message: 'No autorizado' });
        }

        const data = req.body;

        // BRANCH_ADMIN solo puede crear insumos de su sucursal
        if (req.user.role === 'BRANCH_ADMIN') {
            if (!req.user.branchId) {
                return res.status(400).send({ success: false, message: 'BRANCH_ADMIN sin branchId asignado' });
            }
            data.branchId = req.user.branchId; // fuerza su sucursal
        }

        const inventory = new Inventory(data);
        await inventory.save();

        return res.status(201).send({ success: true, message: 'Insumo guardado', inventory });

    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al guardar', err: err.message ?? err });
    }
};

/**
 * Obtener inventario
 * PLATFORM_ADMIN: ve todo (puede filtrar por branchId/status)
 * BRANCH_ADMIN: ve solo su sucursal (puede filtrar status)
 * EMPLOYEE: ve solo su sucursal y SOLO status ACTIVE (por defecto)
 */
export const getInventory = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            return res.status(403).send({ success: false, message: 'No autorizado' });
        }

        const { branchId, status } = req.query;
        const filter = {};

        if (req.user.role === 'PLATFORM_ADMIN') {
            if (branchId) filter.branchId = branchId;
            if (status) filter.status = status;
        }

        if (req.user.role === 'BRANCH_ADMIN') {
            if (!req.user.branchId) {
                return res.status(400).send({ success: false, message: 'BRANCH_ADMIN sin branchId asignado' });
            }
            filter.branchId = req.user.branchId;
            if (status) filter.status = status;
        }

        if (req.user.role === 'EMPLOYEE') {
            if (!req.user.branchId) {
                return res.status(400).send({ success: false, message: 'EMPLOYEE sin branchId asignado' });
            }
            filter.branchId = req.user.branchId;
            filter.status = 'ACTIVE'; // default SOLO activos para employee
        }

        const items = await Inventory.find(filter).sort({ createdAt: -1 });
        return res.send({ success: true, items });

    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al obtener inventario', err: err.message ?? err });
    }
};

/**
 * Editar un insumo
 * PLATFORM_ADMIN: puede editar cualquiera
 * BRANCH_ADMIN: solo su sucursal
 */
export const updateInventory = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
            return res.status(403).send({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;
        const data = req.body;

        // Validación de pertenencia para BRANCH_ADMIN
        if (req.user.role === 'BRANCH_ADMIN') {
            const item = await Inventory.findById(id);
            if (!item) return res.status(404).send({ success: false, message: 'Insumo no encontrado' });

            if (!req.user.branchId) {
                return res.status(400).send({ success: false, message: 'BRANCH_ADMIN sin branchId asignado' });
            }

            if (item.branchId.toString() !== req.user.branchId.toString()) {
                return res.status(403).send({ success: false, message: 'No autorizado' });
            }

            // Evita que el BRANCH_ADMIN cambie el branchId a otra sucursal
            data.branchId = req.user.branchId;
        }

        const updatedItem = await Inventory.findByIdAndUpdate(id, data, { new: true, runValidators: true });

        if (!updatedItem) return res.status(404).send({ success: false, message: 'Insumo no encontrado' });

        return res.send({ success: true, message: 'Insumo actualizado', updatedItem });

    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al actualizar', err: err.message ?? err });
    }
};

/**
 * Soft Delete (toggle)
 * SOLO PLATFORM_ADMIN (lo dejamos igual)
 */
export const deleteInventory = async (req, res) => {
    try {
        if (req.user.role !== 'PLATFORM_ADMIN') {
            return res.status(403).send({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;
        const item = await Inventory.findById(id);

        if (!item) return res.status(404).send({ success: false, message: 'Insumo no encontrado' });

        const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const deletionDate = newStatus === 'INACTIVE' ? new Date() : null;

        const updatedItem = await Inventory.findByIdAndUpdate(
            id,
            { status: newStatus, deletedAt: deletionDate },
            { new: true }
        );

        return res.send({
            success: true,
            message: `Insumo marcado como ${newStatus}`,
            updatedItem
        });

    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error', err: err.message ?? err });
    }
};