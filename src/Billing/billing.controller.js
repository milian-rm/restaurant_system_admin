'use strict';

import Billing from './billing.model.js';
import Order from '../Order/order.model.js';
import Table from '../Table/table.model.js';
import User from '../User/user.model.js';
import OrderRequest from '../OrderRequest/orderRequest.model.js';

/**
 * ADMIN-ONLY
 * Roles: PLATFORM_ADMIN, BRANCH_ADMIN, EMPLOYEE
 */

/**
 * Obtener facturas con paginación y filtro de estado
 * - PLATFORM_ADMIN: ve todo
 * - BRANCH_ADMIN/EMPLOYEE: solo su sucursal
 */
export const getBillings = async (req, res) => {
  try {
    const { page = 1, limit = 10, BillStatus } = req.query;

    const filter = {};
    if (BillStatus) filter.BillStatus = BillStatus;

    // Restricción por sucursal para roles de sucursal
    if (['BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
      if (!req.user.branchId) {
        return res.status(400).json({
          success: false,
          message: 'El usuario no tiene branchId asignado'
        });
      }
      filter.branchId = req.user.branchId;
    }

    const billings = await Billing.find(filter)
      .populate('Order')
      .populate('client', 'UserName UserSurname UserEmail')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ BillDate: -1 });

    const total = await Billing.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: billings,
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
      message: 'Error al obtener las facturas',
      error: error.message,
    });
  }
};

/**
 * Obtener una factura por ID
 * - PLATFORM_ADMIN: cualquiera
 * - BRANCH_ADMIN/EMPLOYEE: solo si pertenece a su sucursal
 */
export const getBillingById = async (req, res) => {
  try {
    const { id } = req.params;

    const billing = await Billing.findById(id).populate('Order client');
    if (!billing) {
      return res.status(404).json({ success: false, message: 'Factura no encontrada' });
    }

    // Restricción por sucursal
    if (['BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
      if (!req.user.branchId) {
        return res.status(400).json({
          success: false,
          message: 'El usuario no tiene branchId asignado'
        });
      }

      if (billing.branchId?.toString() !== req.user.branchId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver esta factura'
        });
      }
    }

    return res.status(200).json({ success: true, data: billing });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la factura',
      error: error.message
    });
  }
};

/**
 * Crear factura (IVA)
 * - PLATFORM_ADMIN: puede crear para cualquier sucursal
 * - BRANCH_ADMIN/EMPLOYEE: solo si la orden pertenece a su sucursal
 */
export const createBilling = async (req, res) => {
  try {
    const {
      Order: orderId,
      BillPaymentMethod,
      BillSerie,
      clientId,
      newClientData
    } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Orden no encontrada' });

    // Restricción por sucursal (para BRANCH_ADMIN/EMPLOYEE)
    if (['BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
      if (!req.user.branchId) {
        return res.status(400).json({
          success: false,
          message: 'El usuario no tiene branchId asignado'
        });
      }

      if (order.branchId?.toString() !== req.user.branchId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado para facturar órdenes de otra sucursal'
        });
      }
    }

    // Evitar duplicados
    const existing = await Billing.findOne({ Order: orderId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Esta orden ya fue facturada' });
    }

    let finalClientId = clientId;

    // Lógica para determinar el cliente
    if (!clientId && newClientData) {
      const userExists = await User.findOne({ UserEmail: newClientData.UserEmail.toLowerCase() });

      if (userExists) {
        finalClientId = userExists._id;
      } else {
        const newUser = await User.create({
          ...newClientData,
          password: 'Password123!', // DEV: podrías generar aleatoria luego
          role: 'CLIENT',
          isVerified: true // opcional: si lo creas desde admin, podrías marcarlo verificado
        });
        finalClientId = newUser._id;
      }
    }

    if (!finalClientId) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un clientId o datos para crear uno (newClientData)'
      });
    }

    // Cálculos de IVA
    const total = Number(order.total || 0);
    const subtotal = total / 1.12;
    const iva = total - subtotal;

    const billing = await Billing.create({
      branchId: order.branchId,
      client: finalClientId,
      Order: orderId,
      BillSerie: BillSerie || `FAC-${Date.now()}`,
      BillSubtotal: Number(subtotal.toFixed(2)),
      BillIVA: Number(iva.toFixed(2)),
      BillTotal: Number(total.toFixed(2)),
      BillPaymentMethod,
      BillStatus: 'GENERATED',
      BillDate: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Factura generada y cliente asignado',
      data: billing,
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error al crear la factura',
      error: error.message
    });
  }
};

/**
 * Pagar factura y liberar mesa
 * - PLATFORM_ADMIN: puede pagar cualquiera
 * - BRANCH_ADMIN/EMPLOYEE: solo si factura pertenece a su sucursal
 */
export const payBilling = async (req, res) => {
  try {
    const { id } = req.params;

    const billing = await Billing.findById(id).populate('Order');
    if (!billing) return res.status(404).json({ success: false, message: 'Factura no encontrada' });

    // Restricción por sucursal
    if (['BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
      if (!req.user.branchId) {
        return res.status(400).json({
          success: false,
          message: 'El usuario no tiene branchId asignado'
        });
      }

      if (billing.branchId?.toString() !== req.user.branchId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado para pagar facturas de otra sucursal'
        });
      }
    }

    if (billing.BillStatus === 'PAYED') {
      return res.status(400).json({ success: false, message: 'La factura ya fue pagada' });
    }

    const order = billing.Order?._id ? await Order.findById(billing.Order._id) : null;

    // Liberar mesa si existe
    if (order && order.mesaId) {
      const table = await Table.findById(order.mesaId);
      if (table) {
        table.availability = 'Disponible';
        await table.save();
      }
    }

    // Actualizar estados
    billing.BillStatus = 'PAYED';
    await billing.save();

    if (order) {
      order.estado = 'Entregado';
      await order.save();

      // Sincronizar con OrderRequest si aplica
      await OrderRequest.findOneAndUpdate(
        { order: order._id },
        { orderStatus: 'Entregado' }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Factura pagada, mesa liberada y orden entregada',
      data: billing
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al procesar el pago',
      error: error.message
    });
  }
};