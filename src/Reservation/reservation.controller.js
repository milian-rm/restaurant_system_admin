'use strict';

import Reservation from './reservation.model.js';
import Table from '../Table/table.model.js';
import Event from '../Event/event.model.js';
import User from '../User/user.model.js';

/**
 * POST - Crear reservación
 */
export const saveReservation = async (req, res) => {
    try {
        const {
            branchId,
            date,
            time,
            numberOfPersons,
            notes,
            clientId
        } = req.body;

        const client = await User.findById(clientId);
        if (!client || client.UserStatus === 'INACTIVE') {
            return res.status(400).send({
                success: false,
                message: 'No se puede crear la reserva: El cliente no existe o está desactivado.'
            });
        }
        if (!clientId) {
            return res.status(400).send({
                success: false,
                message: 'El ID del cliente es requerido.'
            });
        }

        const reservationDate = new Date(date);

        const overlapEvents = await Event.find({
            branchId,
            eventDate: reservationDate,
            status: { $ne: 'Cancelado' },
            $and: [
                { startTime: { $lte: time } },
                { endTime: { $gte: time } }
            ]
        }).select('tables');

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

        const populatedRes = await Reservation.findById(reservation._id)
            .populate('branchId', 'name')
            .populate('tableId', 'numberTable capacity')
            .populate('clientId', 'UserName UserSurname email');

        return res.status(201).send({
            success: true,
            message: 'Reservación creada exitosamente',
            assignedTable: {
                number: bestTable.numberTable
            },
            data: populatedRes
        });

    } catch (err) {
        return res.status(500).send({
            success: false,
            message: 'Error al reservar',
            error: err.message
        });
    }
};

/**
 * GET - Obtener reservaciones
 */
export const getReservations = async (req, res) => {
    try {
        const { branchId, statusRes = 'ACTIVADO' } = req.query;

        const filter = {};

        if (statusRes) filter.statusRes = statusRes;
        if (branchId) filter.branchId = branchId;

        const reservations = await Reservation.find(filter)
            .populate('tableId', 'numberTable capacity')
            .populate('clientId', 'UserName UserSurname email')
            .sort({ date: 1, time: 1 });

        return res.send({
            success: true,
            reservations
        });
    } catch (err) {
        return res.status(500).send({
            success: false,
            message: 'Error al obtener',
            error: err.message
        });
    }
};

/**
 * PUT - Actualizar reservación
 */
export const updateReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const reservation = await Reservation.findById(id);

        if (!reservation) {
            return res.status(404).send({
                success: false,
                message: 'No encontrada'
            });
        }

        if (data.numberOfPersons !== reservation.numberOfPersons || data.date !== reservation.date || data.time !== reservation.time) {
            
            // Aquí podrías reutilizar la lógica de "bestTable" para ver si aún cabe 
            // o si hay que asignarle otra mesa. Por simplicidad inmediata, validamos capacidad:
            const currentTable = await Table.findById(reservation.tableId);
            if (data.numberOfPersons > currentTable.capacity) {
                return res.status(400).send({
                    success: false,
                    message: `La mesa asignada (#${currentTable.numberTable}) solo tiene capacidad para ${currentTable.capacity} personas. No puedes subir a ${data.numberOfPersons}.`
                });
            }
        }

        const updated = await Reservation.findByIdAndUpdate(id, data, {new: true})
        .populate('branchId', 'name')
        .populate('tableId', 'numberTable capacity')
        .populate('clientId', 'UserName UserSurname email');

        return res.send({
            success: true,
            message: 'Actualizado con éxito',
            updated
        });
    } catch (err) {
        return res.status(500).send({
            success: false,
            message: 'Error al actualizar',
            error: err.message
        });
    }
};

/**
 * PATCH - Toggle Soft Delete
 */
export const toggleReservationStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const reservation = await Reservation.findById(id);

        if (!reservation) {
            return res.status(404).send({
                success: false,
                message: 'No encontrada'
            });
        }

        const nuevoEstado = reservation.statusRes === 'ACTIVADO'
            ? 'DESACTIVADO'
            : 'ACTIVADO';

        reservation.status = nuevoEstado === 'DESACTIVADO'
            ? 'Cancelada'
            : 'Pendiente';

        reservation.statusRes = nuevoEstado;

        await reservation.save();

        return res.send({
            success: true,
            message: `Reservación ${nuevoEstado.toLowerCase()}`,
            statusRes: reservation.statusRes
        });

    } catch (err) {
        return res.status(500).send({
            success: false,
            message: 'Error en el toggle',
            error: err.message
        });
    }
};