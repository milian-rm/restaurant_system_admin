'use strict';

import Order from './order.model.js';
import OrderDetail from '../OrderDetail/orderDetail.model.js';
import Table from '../Table/table.model.js';
import Coupon from '../Coupon/coupon.model.js';

// Obtener todas las Ordenes (ADMIN)
export const getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, estado } = req.query;

        const filter = {};
        if (estado) filter.estado = estado;

        // Scope por sucursal
        if (['BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            if (!req.user.branchId) {
                return res.status(400).json({ success: false, message: 'Usuario sin branchId asignado' });
            }
            filter.branchId = req.user.branchId;
        }

        const orders = await Order.find(filter)
            .populate('mesaId', 'numberTable capacity') // ✅ nombres correctos
            .populate('empleadoId', 'UserName UserSurname UserEmail role') // ✅ nombres correctos
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

// Obtener una Orden por ID (ADMIN)
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

        // Scope por sucursal
        if (['BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            if (!req.user.branchId) {
                return res.status(400).json({ success: false, message: 'Usuario sin branchId asignado' });
            }
            if (order.branchId?.toString() !== req.user.branchId.toString()) {
                return res.status(403).json({ success: false, message: 'No autorizado' });
            }
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

// Crear Orden (ADMIN)
// Nota: En ADMIN-API normalmente solo se crea DINE_IN (en mesa).
export const createOrder = async (req, res) => {
    try {
        const { branchId, mesaId, orderType, couponCode } = req.body;

        const userRole = req.user.role;

        // Solo roles admin/personal (esto lo refuerza el router, pero aquí también queda)
        if (!['EMPLOYEE', 'BRANCH_ADMIN', 'PLATFORM_ADMIN'].includes(userRole)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        // En tu schema: DINE_IN, TAKEAWAY, DELIVERY
        if (!orderType) {
            return res.status(400).json({ success: false, message: 'orderType es obligatorio' });
        }

        // Scope branchId:
        // - PLATFORM_ADMIN puede usar branchId del body
        // - BRANCH_ADMIN/EMPLOYEE usan su req.user.branchId
        let finalBranchId = branchId;

        if (['BRANCH_ADMIN', 'EMPLOYEE'].includes(userRole)) {
            if (!req.user.branchId) {
                return res.status(400).json({ success: false, message: 'Usuario sin branchId asignado' });
            }
            finalBranchId = req.user.branchId;
        }

        if (!finalBranchId) {
            return res.status(400).json({ success: false, message: 'branchId es obligatorio' });
        }

        // ADMIN-API: si quieres que personal cree TAKEAWAY/DELIVERY, lo permitimos.
        // Si NO lo quieres, cambia a: if (orderType !== 'DINE_IN') return 400;
        let table = null;

        // Validar Mesa para Comer Aquí
        if (orderType === 'DINE_IN') {
            if (!mesaId) {
                return res.status(400).json({ success: false, message: 'mesaId es obligatorio para DINE_IN' });
            }

            table = await Table.findById(mesaId);
            if (!table) {
                return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
            }

            // Scope por sucursal: la mesa debe pertenecer al branch
            if (table.branchId.toString() !== finalBranchId.toString()) {
                return res.status(403).json({ success: false, message: 'Mesa no pertenece a tu sucursal' });
            }

            if (table.availability !== 'Disponible') {
                return res.status(400).json({ success: false, message: 'La mesa no está disponible' });
            }
        }

        // Cupón (opcional)
        let appliedCouponId = null;

        if (couponCode) {
            const couponDB = await Coupon.findOne({
                code: couponCode.toUpperCase(),
                status: 'ACTIVE'
            });

            if (!couponDB) {
                return res.status(404).json({ success: false, message: 'Cupón no válido o inexistente' });
            }

            if (new Date() > couponDB.expirationDate) {
                return res.status(400).json({ success: false, message: 'El cupón ha expirado' });
            }

            if (couponDB.usedCount >= couponDB.usageLimit) {
                return res.status(400).json({ success: false, message: 'El cupón ha alcanzado su límite de usos' });
            }

            appliedCouponId = couponDB._id;
        }

        const empleadoId = req.user._id;

        const order = await Order.create({
            branchId: finalBranchId,
            mesaId: orderType === 'DINE_IN' ? mesaId : null,
            empleadoId,
            orderType,
            coupon: appliedCouponId,
            total: 0,
            estado: 'Pendiente'
        });

        if (appliedCouponId) {
            await Coupon.findByIdAndUpdate(appliedCouponId, { $inc: { usedCount: 1 } });
        }

        // Ocupar Mesa
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

// Actualizar Orden (ADMIN)
export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.user.role;

        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'].includes(userRole)) {
            return res.status(403).json({ success: false, message: 'No autorizado para editar órdenes' });
        }

        // Scope por sucursal: BRANCH_ADMIN/EMPLOYEE solo su branch
        if (['BRANCH_ADMIN', 'EMPLOYEE'].includes(userRole)) {
            const existing = await Order.findById(id);
            if (!existing) return res.status(404).json({ success: false, message: 'Orden no encontrada' });

            if (!req.user.branchId) {
                return res.status(400).json({ success: false, message: 'Usuario sin branchId asignado' });
            }

            if (existing.branchId.toString() !== req.user.branchId.toString()) {
                return res.status(403).json({ success: false, message: 'No autorizado' });
            }

            // Evita que cambien la sucursal
            if (req.body.branchId && req.body.branchId.toString() !== req.user.branchId.toString()) {
                return res.status(403).json({ success: false, message: 'No puedes cambiar branchId' });
            }
        }

        const order = await Order.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('mesaId', 'numberTable capacity')
            .populate('empleadoId', 'UserName UserSurname')
            .populate('branchId', 'name');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Orden no encontrada' });
        }

        res.status(200).json({
            success: true,
            message: 'Orden actualizada exitosamente',
            data: order
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la orden',
            error: error.message
        });
    }
};

// Cambiar estado de Orden (ADMIN)
export const changeOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Orden no encontrada' });
        }

        // Scope por sucursal
        if (['BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            if (!req.user.branchId) {
                return res.status(400).json({ success: false, message: 'Usuario sin branchId asignado' });
            }
            if (order.branchId.toString() !== req.user.branchId.toString()) {
                return res.status(403).json({ success: false, message: 'No autorizado' });
            }
        }

        order.estado = estado;
        await order.save();

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