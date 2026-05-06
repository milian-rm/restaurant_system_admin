'use strict';

import AdditionalService from './additionalService.model.js';

// Todos
export const getAdditionalServices = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const filter = {};

        if (req.query.status) {
            filter.status = req.query.status;
        }

        const services = await AdditionalService.find(filter)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await AdditionalService.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: services,
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
            message: 'Error al obtener los servicios adicionales',
            error: error.message,
        });
    }
};

// Crear servicio adicional
export const createAdditionalService = async (req, res) => {
    try {
        const serviceData = req.body;

        if (req.file) {
            serviceData.image = {
                url: req.file.path, // Cloudinary devuelve la URL aquí
                public_id: req.file.filename // este es el public_id
            };
        }

        const service = new AdditionalService(serviceData);
        await service.save();

        return res.status(201).json({
            success: true,
            message: 'Servicio adicional creado exitosamente',
            data: service,
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            success: false,
            message: 'Error al crear el servicio adicional',
            error: error.message,
        });
    }
};

// Actualizar servicio adicional
export const updateAdditionalService = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (req.file) {
            updateData.image = {
                url: req.file.path,
                public_id: req.file.filename
            };
        }

        const service = await AdditionalService.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Servicio adicional no encontrado',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Servicio adicional actualizado exitosamente',
            data: service,
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error al actualizar el servicio adicional',
            error: error.message,
        });
    }
};

// Cambiar estado
export const changeAdditionalServiceStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await AdditionalService.findById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Servicio adicional no encontrado',
            });
        }

        service.status = service.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        service.deletedAt = service.status === 'INACTIVE' ? new Date() : null;

        await service.save();

        return res.status(200).json({
            success: true,
            message: `Estado del servicio cambiado a ${service.status}`,
            data: service,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al cambiar estado',
            error: error.message,
        });
    }
};