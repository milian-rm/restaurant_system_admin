'use strict';

import Event from './event.model.js';
import Table from '../Table/table.model.js';
import Reservation from '../Reservation/reservation.model.js';

// 1. Ver eventos (Paginado y Filtrado)
export const getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, branchId } = req.query;
    const filter = {};

    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;

    const events = await Event.find(filter)
      .populate('branchId')
      .populate('clientId')
      .populate('tables')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Event.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: events,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        limit: parseInt(limit),
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los eventos',
      error: error.message,
    });
  }
};

// 2. Obtener evento por ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id)
      .populate('branchId')
      .populate('clientId')
      .populate('tables');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    return res.status(200).json({ success: true, data: event });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el evento',
      error: error.message,
    });
  }
};

// 3. Actualizar evento (Fix para que funcione el CancelEvent del frontend)
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Event.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    const event = await Event.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('branchId')
      .populate('clientId')
      .populate('tables');

    return res.status(200).json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: event,
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error al actualizar el evento',
      error: error.message
    });
  }
};

// 4. Cambiar estado del evento
export const changeEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    event.status = status;
    await event.save();

    return res.status(200).json({
      success: true,
      message: 'Estado del evento actualizado exitosamente',
      data: event,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado del evento',
      error: error.message
    });
  }
};

// 5. Iniciar o finalizar evento (Manejo de Mesas)
export const toggleEventAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    let newTableStatus;
    let newEventStatus;

    if (action === 'INICIAR') {
      newTableStatus = 'Ocupada';
      newEventStatus = 'Confirmado';
    } else if (action === 'FINALIZAR') {
      newTableStatus = 'Disponible';
      newEventStatus = 'Finalizado';
    } else {
      return res.status(400).json({ success: false, message: 'Acción no válida' });
    }

    await Table.updateMany(
      { _id: { $in: event.tables } },
      { $set: { availability: newTableStatus } }
    );

    event.status = newEventStatus;
    await event.save();

    return res.status(200).json({
      success: true,
      message: `Evento ${action === 'INICIAR' ? 'iniciado' : 'finalizado'} con éxito.`,
      data: { eventStatus: event.status, tablesUpdated: event.tables.length }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al gestionar la asistencia',
      error: error.message
    });
  }
};

// 6. Crear evento con lógica de asignación de mesas
export const createEvent = async (req, res) => {
  try {
    const { branchId, clientId, name, eventDate, startTime, endTime, numberOfPersons, notes } = req.body;
    const dateFilter = new Date(eventDate);

    const overlappingEvents = await Event.find({
      branchId,
      eventDate: dateFilter,
      status: { $ne: 'Cancelado' },
      $or: [ { startTime: { $lt: endTime }, endTime: { $gt: startTime } } ]
    }).select('tables');

    const occupiedTableIds = overlappingEvents.flatMap(event => event.tables.map(t => t.toString()));

    const availableTables = await Table.find({
      branchId,
      TableStatus: 'ACTIVE',
      availability: { $ne: 'Mantenimiento' },
      _id: { $nin: occupiedTableIds }
    }).sort({ capacity: -1 });

    const totalCapacity = availableTables.reduce((acc, table) => acc + table.capacity, 0);

    if (totalCapacity < numberOfPersons) {
      return res.status(400).json({
        success: false,
        message: `Capacidad insuficiente. Espacio disponible: ${totalCapacity}`
      });
    }

    let assignedTables = [];
    let accumulatedCapacity = 0;

    for (const table of availableTables) {
      if (accumulatedCapacity < numberOfPersons) {
        assignedTables.push(table._id);
        accumulatedCapacity += table.capacity;
      } else { break; }
    }

    const newEvent = new Event({
      branchId,
      clientId,
      name,
      eventDate: dateFilter,
      startTime,
      endTime,
      numberOfPersons,
      notes,
      tables: assignedTables
    });

    await newEvent.save();

    return res.status(201).json({ success: true, message: 'Evento creado correctamente', data: newEvent });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al crear evento', error: error.message });
  }
};

// 7. ELIMINACIÓN FÍSICA (FIX FUNDAMENTAL)
export const deleteEventPermanently = async (req, res) => {
  try {
    const { id } = req.params;
    const eventDeleted = await Event.findByIdAndDelete(id);

    if (!eventDeleted) {
      return res.status(404).json({ success: false, message: 'El evento no existe' });
    }

    return res.status(200).json({
      success: true,
      message: 'Evento eliminado físicamente de la base de datos'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar permanentemente',
      error: error.message
    });
  }
};