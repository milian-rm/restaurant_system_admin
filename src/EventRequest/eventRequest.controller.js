'use strict';

import EventRequest from './eventRequest.model.js';
import Event from '../Event/event.model.js';
import Table from '../Table/table.model.js';

// 1. Listar solicitudes (con filtros)
export const getEventRequests = async (req, res) => {
    try {
        const { status, branchId } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (branchId) filter.branchId = branchId;

        const requests = await EventRequest.find(filter)
            .populate('branchId', 'name zone')
            .populate('clientId', 'UserName UserSurname email')
            .populate('additionalServices.additionalServiceId', 'Name AdditionalPrice')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error al obtener las solicitudes.', error: error.message });
    }
};

// 2. Ver una solicitud puntual
export const getEventRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await EventRequest.findById(id)
            .populate('branchId', 'name zone')
            .populate('clientId', 'UserName UserSurname email')
            .populate('additionalServices.additionalServiceId', 'Name AdditionalPrice');
            
        if (!request) return res.status(404).json({ success: false, message: 'Solicitud no encontrada.' });

        return res.status(200).json({ success: true, data: request });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error al obtener la solicitud.', error: error.message });
    }
};

// 3. Aceptar o rechazar una solicitud
export const respondEventRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body; // 'ACEPTAR' | 'RECHAZAR'

        const request = await EventRequest.findById(id);
        if (!request) return res.status(404).json({ success: false, message: 'Solicitud no encontrada.' });

        if (request.status !== 'Pendiente') {
            return res.status(400).json({ success: false, message: 'Esta solicitud ya fue resuelta.' });
        }

        if (action === 'RECHAZAR') {
            if (!reason || !reason.trim()) {
                return res.status(400).json({ success: false, message: 'Debes indicar un motivo de rechazo.' });
            }
            request.status = 'Rechazada';
            request.rejectionReason = reason.trim();
            await request.save();
            return res.status(200).json({ success: true, message: 'Solicitud rechazada.', data: request });
        }

        if (action !== 'ACEPTAR') {
            return res.status(400).json({ success: false, message: 'Acción no válida.' });
        }

        // ── Lógica de asignación de mesas (igual que createEvent) ──
        const dateFilter = new Date(request.eventDate);

        const overlappingEvents = await Event.find({
            branchId: request.branchId,
            eventDate: dateFilter,
            status: { $ne: 'Cancelado' },
            $or: [{ startTime: { $lt: request.endTime }, endTime: { $gt: request.startTime } }]
        }).select('tables');

        const occupiedTableIds = overlappingEvents.flatMap(e => e.tables.map(t => t.toString()));

        const availableTables = await Table.find({
            branchId: request.branchId,
            TableStatus: 'ACTIVE',
            availability: { $ne: 'Mantenimiento' },
            _id: { $nin: occupiedTableIds }
        }).sort({ capacity: -1 });

        const totalCapacity = availableTables.reduce((acc, t) => acc + t.capacity, 0);

        if (totalCapacity < request.numberOfPersons) {
            return res.status(400).json({
                success: false,
                message: `No hay capacidad suficiente para aceptar este evento. Espacio disponible: ${totalCapacity}.`
            });
        }

        let assignedTables = [];
        let accumulatedCapacity = 0;
        for (const table of availableTables) {
            if (accumulatedCapacity < request.numberOfPersons) {
                assignedTables.push(table._id);
                accumulatedCapacity += table.capacity;
            } else break;
        }

        const newEvent = new Event({
            branchId: request.branchId,
            clientId: request.clientId,
            name: request.name,
            eventDate: dateFilter,
            startTime: request.startTime,
            endTime: request.endTime,
            numberOfPersons: request.numberOfPersons,
            additionalServices: request.additionalServices,
            notes: request.notes,
            tables: assignedTables,
            status: 'Confirmado'
        });
        await newEvent.save();

        request.status = 'Aceptada';
        request.eventId = newEvent._id;
        await request.save();

        return res.status(200).json({
            success: true,
            message: 'Solicitud aceptada y evento creado exitosamente.',
            data: { request, event: newEvent }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error al procesar la solicitud.', error: error.message });
    }
};