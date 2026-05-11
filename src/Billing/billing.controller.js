"use strict";

import Billing from "./billing.model.js";
import Order from "../Order/order.model.js";
import Table from "../Table/table.model.js";
import User from "../User/user.model.js";
import OrderRequest from "../OrderRequest/orderRequest.model.js";

/**
 * Obtener facturas con paginación y filtro de estado
 */
export const getBillings = async (req, res) => {
  try {
    const { page = 1, limit = 10, BillStatus, branchId } = req.query;

    const filter = {};

    if (BillStatus) filter.BillStatus = BillStatus;
    if (branchId) filter.branchId = branchId;

    const billings = await Billing.find(filter)
      .populate("Order")
      .populate("client", "UserName UserSurname UserEmail")
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
      message: "Error al obtener las facturas",
      error: error.message,
    });
  }
};

/**
 * Obtener una factura por ID
 */
export const getBillingById = async (req, res) => {
  try {
    const { id } = req.params;

    const billing = await Billing.findById(id)
      .populate("Order")
      .populate("client", "UserName UserSurname UserEmail");

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    return res.status(200).json({
      success: true,
      data: billing,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al obtener la factura",
      error: error.message,
    });
  }
};

/**
 * Crear factura con IVA
 */
export const createBilling = async (req, res) => {
  try {
    const {
      Order: orderId,
      BillPaymentMethod,
      BillSerie,
      clientId,
      newClientData,
    } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada",
      });
    }

    const existing = await Billing.findOne({ Order: orderId });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Esta orden ya fue facturada",
      });
    }

    let finalClientId = clientId;

    if (!clientId && newClientData) {
      const userExists = await User.findOne({
        UserEmail: newClientData.UserEmail.toLowerCase(),
      });

      if (userExists) {
        finalClientId = userExists._id;
      } else {
        const newUser = await User.create({
          ...newClientData,
          password: "Password123!",
          role: "CLIENT",
          isVerified: true,
        });

        finalClientId = newUser._id;
      }
    }

    if (!finalClientId) {
      return res.status(400).json({
        success: false,
        message:
          "Debe proporcionar un clientId o datos para crear uno en newClientData",
      });
    }

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
      BillStatus: "GENERATED",
      BillDate: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Factura generada y cliente asignado",
      data: billing,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Error al crear la factura",
      error: error.message,
    });
  }
};

/**
 * Pagar factura y liberar mesa
 */
export const payBilling = async (req, res) => {
  try {
    const { id } = req.params;

    const billing = await Billing.findById(id).populate("Order");

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    if (billing.BillStatus === "PAYED") {
      return res.status(400).json({
        success: false,
        message: "La factura ya fue pagada",
      });
    }

    const order = billing.Order?._id
      ? await Order.findById(billing.Order._id)
      : null;

    if (order && order.mesaId) {
      const table = await Table.findById(order.mesaId);

      if (table) {
        table.availability = "Disponible";
        await table.save();
      }
    }

    billing.BillStatus = "PAYED";
    await billing.save();

    if (order) {
      order.estado = "Entregado";
      await order.save();

      await OrderRequest.findOneAndUpdate(
        { order: order._id },
        { orderStatus: "Entregado" },
      );
    }

    return res.status(200).json({
      success: true,
      message: "Factura pagada, mesa liberada y orden entregada",
      data: billing,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al procesar el pago",
      error: error.message,
    });
  }
};

/**
 * Sincronizar factura con el total actualizado de la orden
 */
export const syncBillingWithOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Orden no encontrada" });
    }

    const billing = await Billing.findOne({ Order: orderId });
    if (!billing) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Factura no encontrada para esta orden",
        });
    }

    if (billing.BillStatus === "PAYED") {
      return res
        .status(400)
        .json({
          success: false,
          message: "No se puede editar una factura ya pagada",
        });
    }

    const total = Number(order.total || 0);
    const subtotal = total / 1.12;
    const iva = total - subtotal;

    billing.BillSubtotal = Number(subtotal.toFixed(2));
    billing.BillIVA = Number(iva.toFixed(2));
    billing.BillTotal = Number(total.toFixed(2));
    await billing.save();

    return res
      .status(200)
      .json({
        success: true,
        message: "Factura sincronizada con la orden",
        data: billing,
      });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Error al sincronizar factura",
        error: error.message,
      });
  }
};
