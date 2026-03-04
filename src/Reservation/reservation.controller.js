'use strict';

import Reservation from './reservation.model.js';
import Table from '../Table/table.model.js';
import Event from '../Event/event.model.js';

/**
 * POST - Crear reservación (ADMIN)
 * Permitido para: EMPLOYEE, BRANCH_ADMIN, PLATFORM_ADMIN
 * Nota: el personal puede asignar clientId manualmente (ventas presenciales/teléfono)
 */
export const saveReservation = async (req, res) => {
    try {
        const { branchId, date, time, numberOfPersons, notes, clientId } = req.body;

        // Solo personal (repo admin)
        if (!['EMPLOYEE', 'BRANCH_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role)) {
            return res.status(403).send({ success: false, message: 'No autorizado' });
        }

        // Restricción por sucursal para BRANCH_ADMIN/EMPLOYEE
        if (['EMPLOYEE', 'BRANCH_ADMIN'].includes(req.user.role)) {
            if (!req.user.branchId) {
                return res.status(400).send({ success: false, message: 'El usuario no tiene branchId asignado' });
            }
            if (branchId?.toString() !== req.user.branchId.toString()) {
                return res.status(403).send({ success: false, message: 'No autorizado para crear reservaciones en otra sucursal' });
            }
        }

        if (!clientId) {
            return res.status(400).send({
                success: false,
                message: 'El ID del cliente es requerido.'
            });
        }

        const reservationDate = new Date(date);

        // 1) Conflictos con eventos (misma fecha y rango de hora)
        const overlapEvents = await Event.find({
            branchId,
            eventDate: reservationDate,
            status: { $ne: 'Cancelado' },
            $and: [
                { startTime: { $lte: time } },
                { endTime: { $gte: time } }
            ]
        }).select('tables');

        // 2) Conflictos con otras reservaciones (misma sucursal, fecha y hora exacta)
        const overlapReservations = await Reservation.find({
            branchId,
            date: reservationDate,
            status: { $in: ['Confirmada', 'Pendiente'] },
            statusRes: 'ACTIVADO',
            time
        }).select('tableId');

        const occupiedTableIds = [
            ...overlapEvents.flatMap(e => (e.tables || []).map(t => t.toString())),
            ...overlapReservations.map(r => r.tableId.toString())
        ];

        // 3) Asignación automática: mesa con capacidad mínima suficiente
        const bestTable = await Table.findOne({
            branchId,
            TableStatus: 'ACTIVE',
            availability: { $ne: 'Mantenimiento' },
            capacity: { $gte: numberOfPersons },
            _id: { $nin: occupiedTableIds }
        }).sort({ capacity: 1 });

        if (!bestTable) {
            return res.status(400).send({
                success: false,
                message: 'No hay mesas disponibles para este horario/capacidad.'
            });
        }

        const reservation = new Reservation({
            branchId,
            clientId,
            tableId: bestTable._id,
            date: reservationDate,
            time,
            numberOfPersons,
            notes,
            status: 'Pendiente'
        });

        await reservation.save();

        return res.status(201).send({
            success: true,
            message: 'Reservación creada exitosamente',
            assignedTable: { number: bestTable.numberTable },
            data: reservation
        });

    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al reservar', error: err.message });
    }
};

/**
 * GET - Obtener reservaciones (ADMIN)
 * Permitido para: EMPLOYEE/BRANCH_ADMIN (solo su sucursal), PLATFORM_ADMIN (todas)
 */
export const getReservations = async (req, res) => {
    try {
        // Solo personal (repo admin)
        if (!['EMPLOYEE', 'BRANCH_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role)) {
            return res.status(403).send({ success: false, message: 'No autorizado' });
        }

        const filter = { statusRes: 'ACTIVADO' };

        if (req.user.role === 'EMPLOYEE' || req.user.role === 'BRANCH_ADMIN') {
            if (!req.user.branchId) {
                return res.status(400).send({ success: false, message: 'El usuario no tiene branchId asignado' });
            }
            filter.branchId = req.user.branchId;
        }
        // PLATFORM_ADMIN ve todo

        const reservations = await Reservation.find(filter)
            .populate('tableId', 'numberTable capacity')
            .populate('clientId', 'UserName UserSurname email')
            .sort({ date: 1, time: 1 });

        return res.send({ success: true, reservations });
    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al obtener', error: err.message });
    }
};

/**
 * PUT - Actualizar reservación (ADMIN)
 * Permitido para: EMPLOYEE/BRANCH_ADMIN (solo su sucursal), PLATFORM_ADMIN (todas)
 */
export const updateReservation = async (req, res) => {
    try {
        if (!['EMPLOYEE', 'BRANCH_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role)) {
            return res.status(403).send({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;
        const data = req.body;

        const reservation = await Reservation.findById(id);
        if (!reservation) return res.status(404).send({ success: false, message: 'No encontrada' });

        // Restricción por sucursal
        if (req.user.role === 'EMPLOYEE' || req.user.role === 'BRANCH_ADMIN') {
            if (!req.user.branchId) {
                return res.status(400).send({ success: false, message: 'El usuario no tiene branchId asignado' });
            }
            if (reservation.branchId?.toString() !== req.user.branchId.toString()) {
                return res.status(403).send({ success: false, message: 'No autorizado' });
            }
        }

        const updated = await Reservation.findByIdAndUpdate(id, data, { new: true });
        return res.send({ success: true, message: 'Actualizado con éxito', updated });
    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al actualizar', error: err.message });
    }
};

/**
 * PATCH - Toggle Soft Delete (ADMIN)
 * Permitido para: EMPLOYEE/BRANCH_ADMIN (solo su sucursal), PLATFORM_ADMIN (todas)
 */
export const toggleReservationStatus = async (req, res) => {
    try {
        if (!['EMPLOYEE', 'BRANCH_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role)) {
            return res.status(403).send({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;

        const reservation = await Reservation.findById(id);
        if (!reservation) return res.status(404).send({ success: false, message: 'No encontrada' });

        // Restricción por sucursal
        if (req.user.role === 'EMPLOYEE' || req.user.role === 'BRANCH_ADMIN') {
            if (!req.user.branchId) {
                return res.status(400).send({ success: false, message: 'El usuario no tiene branchId asignado' });
            }
            if (reservation.branchId?.toString() !== req.user.branchId.toString()) {
                return res.status(403).send({ success: false, message: 'No autorizado' });
            }
        }

        const nuevoEstado = reservation.statusRes === 'ACTIVADO' ? 'DESACTIVADO' : 'ACTIVADO';
        reservation.status = (nuevoEstado === 'DESACTIVADO') ? 'Cancelada' : 'Pendiente';
        reservation.statusRes = nuevoEstado;

        await reservation.save();

        return res.send({
            success: true,
            message: `Reservación ${nuevoEstado.toLowerCase()} por ${req.user.role}`,
            statusRes: reservation.statusRes
        });

    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error en el toggle', error: err.message });
    }
};