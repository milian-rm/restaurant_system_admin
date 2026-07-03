'use strict';

import Order from './order.model.js';
import OrderDetail from '../OrderDetail/orderDetail.model.js';
import OrderRequest from '../OrderRequest/orderRequest.model.js';
import Table from '../Table/table.model.js';
import Coupon from '../Coupon/coupon.model.js';

// Obtener todas las Ordenes
export const getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, estado, branchId } = req.query;

        const filter = {};

        if (estado) filter.estado = estado;
        if (branchId) filter.branchId = branchId;

        const orders = await Order.find(filter)
            .populate('mesaId', 'numberTable capacity')
            .populate('empleadoId', 'UserName UserSurname UserEmail role')
            .populate('branchId', 'name zone')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Order.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalRecords: total,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las órdenes',
            error: error.message
        });
    }
};

// Obtener una Orden por ID
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate('mesaId', 'numberTable capacity availability')
            .populate('empleadoId', 'UserName UserSurname UserEmail role branchId')
            .populate('branchId', 'name zone');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        const items = await OrderDetail.find({ order: id })
            .populate('productoId')
            .populate('comboId')
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            data: { order, items }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener la orden',
            error: error.message
        });
    }
};

// Crear Orden
export const createOrder = async (req, res) => {
    try {
        const {
            branchId,
            mesaId,
            empleadoId,
            orderType,
            couponCode
        } = req.body;

        if (!orderType) {
            return res.status(400).json({
                success: false,
                message: 'orderType es obligatorio'
            });
        }

        if (!branchId) {
            return res.status(400).json({
                success: false,
                message: 'branchId es obligatorio'
            });
        }

        let table = null;

        if (orderType === 'DINE_IN') {
            if (!mesaId) {
                return res.status(400).json({
                    success: false,
                    message: 'mesaId es obligatorio para DINE_IN'
                });
            }

            if (!empleadoId) {
                return res.status(400).json({
                    success: false,
                    message: 'empleadoId es obligatorio para DINE_IN'
                });
            }

            table = await Table.findById(mesaId);

            if (!table) {
                return res.status(404).json({
                    success: false,
                    message: 'Mesa no encontrada'
                });
            }

            if (table.branchId.toString() !== branchId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Mesa no pertenece a la sucursal'
                });
            }

            if (table.availability !== 'Disponible') {
                return res.status(400).json({
                    success: false,
                    message: 'La mesa no está disponible'
                });
            }
        }

        let appliedCouponId = null;

        if (couponCode) {
            const couponDB = await Coupon.findOne({
                code: couponCode.toUpperCase(),
                status: 'ACTIVE'
            });

            if (!couponDB) {
                return res.status(404).json({
                    success: false,
                    message: 'Cupón no válido o inexistente'
                });
            }

            if (new Date() > couponDB.expirationDate) {
                return res.status(400).json({
                    success: false,
                    message: 'El cupón ha expirado'
                });
            }

            if (couponDB.usedCount >= couponDB.usageLimit) {
                return res.status(400).json({
                    success: false,
                    message: 'El cupón ha alcanzado su límite de usos'
                });
            }

            appliedCouponId = couponDB._id;
        }

        const order = await Order.create({
            branchId,
            // Para TAKEAWAY/DELIVERY estos campos quedan como null
            mesaId:     orderType === 'DINE_IN' ? mesaId     : null,
            empleadoId: orderType === 'DINE_IN' ? empleadoId : null,
            orderType,
            coupon: appliedCouponId,
            total: 0,
            estado: 'Pendiente'
        });

        if (appliedCouponId) {
            await Coupon.findByIdAndUpdate(appliedCouponId, {
                $inc: { usedCount: 1 }
            });
        }

        if (table) {
            table.availability = 'Ocupada';
            await table.save();
        }

        res.status(201).json({
            success: true,
            message: 'Orden creada correctamente',
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear la orden',
            error: error.message
        });
    }
};

// Actualizar Orden
export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;

        // Extraemos y descartamos los campos que NO deben modificarse una vez
        // que la orden fue creada. El resto del body (ej. estado, total) sí se aplica.
        const {
            empleadoId,  // inmutable — se ignora aunque venga en el body
            branchId,    // inmutable
            mesaId,      // inmutable
            orderType,   // inmutable
            ...mutableFields
        } = req.body;

        const order = await Order.findByIdAndUpdate(
            id,
            mutableFields,
            {
                new: true,
                runValidators: true,
            }
        )
            .populate('mesaId',     'numberTable capacity')
            .populate('empleadoId', 'UserName UserSurname')
            .populate('branchId',   'name');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Orden actualizada exitosamente',
            data: order,
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la orden',
            error: error.message,
        });
    }
};

// Cambiar estado de Orden
export const changeOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const VALID_STATES = ['Pendiente', 'En Preparacion', 'Listo', 'Entregado', 'Cancelado'];

        if (!VALID_STATES.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: `Estado inválido: "${estado}". Los estados válidos son: ${VALID_STATES.join(', ')}`
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        // Protección de transiciones imposibles: estados terminales no pueden cambiar
        const TERMINAL_STATES = ['Entregado', 'Cancelado'];

        if (TERMINAL_STATES.includes(order.estado)) {
            return res.status(400).json({
                success: false,
                message: `No se puede cambiar el estado de una orden "${order.estado}". Es un estado final.`
            });
        }

        // Mapa de transiciones permitidas
        const ALLOWED_TRANSITIONS = {
            'Pendiente':      ['En Preparacion', 'Cancelado'],
            'En Preparacion': ['Listo', 'Cancelado'],
            'Listo':          ['Entregado', 'Cancelado'],
        };

        const allowed = ALLOWED_TRANSITIONS[order.estado] || [];
        if (!allowed.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: `Transición inválida: no se puede pasar de "${order.estado}" a "${estado}".`
            });
        }

        order.estado = estado;
        await order.save();

        // Sincronizar estado con OrderRequest si existe
        await OrderRequest.findOneAndUpdate(
            { order: order._id },
            { orderStatus: estado }
        );

        if ((estado === 'Entregado' || estado === 'Cancelado') && order.mesaId) {
            const table = await Table.findById(order.mesaId);
            if (table) {
                table.availability = 'Disponible';
                await table.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Estado de la orden actualizado',
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al cambiar el estado de la orden',
            error: error.message
        });
    }
};