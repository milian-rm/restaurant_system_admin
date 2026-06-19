'use strict';

import Table from './table.model.js';
import Reservation from '../Reservation/reservation.model.js';

const getCurrentlyOccupiedTableIds = async () => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todayDate = new Date(todayStr);

    const h = String(now.getHours()).padStart(2, '0');
    const m = now.getMinutes() < 30 ? '00' : '30';
    const currentSlot = `${h}:${m}`;

    const occupied = await Reservation.find({
        date: todayDate,
        time: currentSlot,
        status: { $in: ['Confirmada', 'Pendiente'] },
        statusRes: 'ACTIVADO'
    }).select('tableId');

    return occupied.map(r => r.tableId.toString());
};

/* -----------------------------------------
    OBTENER MESAS (GET)
------------------------------------------*/
export const getTables = async (req, res) => {
    try {
        // Buscamos solo las mesas ACTIVE
        // IMPORTANTE: Solo hacemos populate de 'branchId' 
        // Verifica que en tu table.model.js el campo se llame exactamente 'branchId'
        const tables = await Table.find({ TableStatus: 'ACTIVE' })
            .populate('branchId', 'name');

        const occupiedNowIds = await getCurrentlyOccupiedTableIds();

        const tablesWithLiveStatus = tables.map(t => {
            const table = t.toObject();
            if (table.availability !== 'Mantenimiento' && occupiedNowIds.includes(t._id.toString())) {
                table.availability = 'Ocupada';
            }
            return table;
        });

        return res.json({
            success: true,
            tables: tablesWithLiveStatus || []
        });
    } catch (err) {
        console.error("Error en getTables:", err);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener mesas',
            error: err.message
        });
    }
};

/* -----------------------------------------
    CREAR MESA (POST)
------------------------------------------*/
export const saveTable = async (req, res) => {
    try {
        const data = { ...req.body };

        // Si el modal manda 'branch', lo pasamos a 'branchId' para el modelo
        if (data.branch && !data.branchId) {
            data.branchId = data.branch;
        }

        const table = await Table.create(data);

        // Hacemos un populate rápido para que la nueva mesa tenga el nombre de la sucursal
        const populatedTable = await Table.findById(table._id).populate('branchId', 'name');

        return res.status(201).json({
            success: true,
            message: 'Mesa creada',
            table: populatedTable
        });
    } catch (err) {
        console.error("Error en saveTable:", err);
        return res.status(500).json({
            success: false,
            message: 'Error al crear mesa',
            error: err.message
        });
    }
};

/* -----------------------------------------
    ACTUALIZAR MESA (PUT)
------------------------------------------*/
export const updateTable = async (req, res) => {
    try {
        const { id } = req.params;
        const data = { ...req.body };

        if (data.branch && !data.branchId) data.branchId = data.branch;

        const updated = await Table.findByIdAndUpdate(id, data, { new: true })
            .populate('branchId', 'name');

        if (!updated) return res.status(404).json({ success: false, message: 'No existe' });

        return res.json({
            success: true,
            message: 'Mesa actualizada',
            updated
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

/* -----------------------------------------
    ELIMINAR MESA (PATCH)
------------------------------------------*/
export const changeTableStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const table = await Table.findByIdAndUpdate(
            id,
            { TableStatus: 'INACTIVE', deletedAt: new Date() },
            { new: true }
        );

        if (!table) return res.status(404).json({ success: false, message: 'No encontrada' });

        return res.json({
            success: true,
            message: 'Mesa eliminada',
            table
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// Aliases para exportación
export const TablePage = getTables;
export const deleteTable = changeTableStatus;