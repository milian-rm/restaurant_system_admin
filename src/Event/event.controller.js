'use strict';

import Event from './event.model.js';
import Table from '../Table/table.model.js';

// ADMIN: ver eventos (PLATFORM_ADMIN todos / BRANCH_ADMIN & EMPLOYEE solo su sucursal)
export const getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = {};

    if (req.user.role === 'BRANCH_ADMIN' || req.user.role === 'EMPLOYEE') {
      filter.branchId = req.user.branchId;
    }

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

    // BRANCH_ADMIN/EMPLOYEE solo pueden ver eventos de su sucursal
    if (
      (req.user.role === 'BRANCH_ADMIN' || req.user.role === 'EMPLOYEE') &&
      event.branchId?._id?.toString() !== req.user.branchId?.toString()
    ) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
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

// PLATFORM_ADMIN y BRANCH_ADMIN (pero BRANCH_ADMIN solo la suya)
export const updateEvent = async (req, res) => {
  try {
    if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const { id } = req.params;

    const existing = await Event.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Evento no encontrado' });

    if (req.user.role === 'BRANCH_ADMIN' && existing.branchId.toString() !== req.user.branchId.toString()) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const event = await Event.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
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

// PLATFORM_ADMIN, BRANCH_ADMIN y EMPLOYEE (BRANCH_ADMIN/EMPLOYEE solo su sucursal)
export const changeEventStatus = async (req, res) => {
  try {
    if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ success: false, message: 'Evento no encontrado' });

    if (
      (req.user.role === 'BRANCH_ADMIN' || req.user.role === 'EMPLOYEE') &&
      event.branchId.toString() !== req.user.branchId.toString()
    ) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
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

// EMPLOYEE/BRANCH_ADMIN/PLATFORM_ADMIN (BRANCH_ADMIN/EMPLOYEE solo su sucursal)
export const toggleEventAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'INICIAR' o 'FINALIZAR'

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ success: false, message: 'Evento no encontrado' });

    if (
      (req.user.role === 'BRANCH_ADMIN' || req.user.role === 'EMPLOYEE') &&
      event.branchId.toString() !== req.user.branchId.toString()
    ) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
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
      return res.status(400).json({ success: false, message: 'Acción no válida. Use INICIAR o FINALIZAR' });
    }

    await Table.updateMany(
      { _id: { $in: event.tables } },
      { $set: { availability: newTableStatus } }
    );

    event.status = newEventStatus;
    await event.save();

    return res.status(200).json({
      success: true,
      message: `Evento ${action === 'INICIAR' ? 'iniciado' : 'finalizado'} con éxito. Mesas marcadas como ${newTableStatus}.`,
      data: {
        eventStatus: event.status,
        tablesUpdated: event.tables.length
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al gestionar la asistencia del evento',
      error: error.message
    });
  }
};

// Crear evento
export const createEvent = async (req, res) => {
  try {

    if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const {
      branchId,
      clientId,
      name,
      additionalServices,
      eventDate,
      startTime,
      endTime,
      numberOfPersons,
      notes
    } = req.body;

    // BRANCH_ADMIN y EMPLOYEE solo pueden crear eventos en su sucursal
    if (
      (req.user.role === 'BRANCH_ADMIN' || req.user.role === 'EMPLOYEE') &&
      branchId !== req.user.branchId
    ) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para crear eventos en otra sucursal'
      });
    }

    const dateFilter = new Date(eventDate);

    const overlappingEvents = await Event.find({
      branchId,
      eventDate: dateFilter,
      status: { $ne: 'Cancelado' },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    }).select('tables');

    const occupiedTableIds = overlappingEvents.flatMap(event =>
      event.tables.map(t => t.toString())
    );

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
      } else {
        break;
      }

    }

    const newEvent = new Event({
      branchId,
      clientId,
      name,
      additionalServices,
      eventDate: dateFilter,
      startTime,
      endTime,
      numberOfPersons,
      notes,
      tables: assignedTables
    });

    await newEvent.save();

    return res.status(201).json({
      success: true,
      message: 'Evento creado correctamente',
      data: newEvent
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: 'Error al crear evento',
      error: error.message
    });

  }
};