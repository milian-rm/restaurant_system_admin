// src/OrderDetail/orderDetail.controller.js
'use strict';

import Order from '../Order/order.model.js';
import OrderDetail from './orderDetail.model.js';
import Product from '../Product/product.model.js';
import Combo from '../Combo/combo.model.js';
import Inventory from '../Inventory/inventory.model.js';
import Billing from '../Billing/billing.model.js';

const buildInventoryNeeds = async ({ productoId, comboId, qty }) => {
  const needs = new Map();
  let unitPrice = 0;
  const resolved = {};

  if (productoId) {
    const product = await Product.findById(productoId).populate('ingredientes.inventoryId');
    if (!product) {
      const err = new Error('Producto no encontrado');
      err.status = 404;
      throw err;
    }
    resolved.product = product;

    unitPrice = Number(product.precio || 0);

    for (const ing of product.ingredientes || []) {
      const inv = ing.inventoryId;
      const invId = inv?._id?.toString();
      if (!invId) {
        const err = new Error('Ingrediente inválido: inventoryId faltante');
        err.status = 400;
        throw err;
      }

      const need = Number(ing.cantidadUsada || 0) * qty;
      needs.set(invId, (needs.get(invId) || 0) + need);
    }
  }

  if (comboId) {
    const combo = await Combo.findById(comboId);
    if (!combo) {
      const err = new Error('Combo no encontrado');
      err.status = 404;
      throw err;
    }
    resolved.combo = combo;

    const comboPrice = Number(combo.ComboPrice || 0);
    const comboDiscount = Number(combo.ComboDiscount || 0);
    unitPrice = Math.max(comboPrice - comboDiscount, 0);

    if (!Array.isArray(combo.ComboList) || combo.ComboList.length === 0) {
      const err = new Error('El combo no tiene productos asociados (ComboList vacío)');
      err.status = 400;
      throw err;
    }

    const productIds = combo.ComboList.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).populate('ingredientes.inventoryId');
    const productsMap = new Map(products.map(p => [p._id.toString(), p]));

    for (const item of combo.ComboList) {
      const p = productsMap.get(item.productId.toString());

      if (!p) {
        const err = new Error(`Producto del combo no encontrado: ${item.productId}`);
        err.status = 404;
        throw err;
      }
    }

    for (const comboItem of combo.ComboList) {
      const product = productsMap.get(comboItem.productId.toString());
      const comboItemQty = Number(comboItem.cantidad || 1);
      const totalProductUnits = comboItemQty * qty;

      for (const ing of product.ingredientes || []) {
        const inv = ing.inventoryId;
        const invId = inv?._id?.toString();

        if (!invId) {
          const err = new Error(`Producto ${product.nombre} tiene un ingrediente inválido (inventoryId faltante)`);
          err.status = 400;
          throw err;
        }

        const need = Number(ing.cantidadUsada || 0) * totalProductUnits;
        needs.set(invId, (needs.get(invId) || 0) + need);
      }
    }
  }

  return { needs, unitPrice, resolved };
};

const validateStock = async (needs) => {
  for (const [invId, needed] of needs.entries()) {
    const inv = await Inventory.findById(invId);

    if (!inv) {
      const err = new Error(`Insumo no encontrado: ${invId}`);
      err.status = 404;
      throw err;
    }

    if (Number(inv.stock) < Number(needed)) {
      const err = new Error(`Stock insuficiente para: ${inv.name}. Requerido: ${needed}, Disponible: ${inv.stock}`);
      err.status = 400;
      throw err;
    }
  }
};

const applyInventoryDelta = async (needs, sign) => {
  for (const [invId, amount] of needs.entries()) {
    await Inventory.findByIdAndUpdate(invId, {
      $inc: { stock: sign * Number(amount) }
    });
  }
};

export const createOrderDetail = async (req, res) => {
  try {
    const { order, productoId, comboId, cantidad } = req.body;

    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'order es requerido'
      });
    }

    const qty = Number(cantidad);

    if (!qty || qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'cantidad debe ser >= 1'
      });
    }

    const hasProduct = Boolean(productoId);
    const hasCombo = Boolean(comboId);

    if ((hasProduct && hasCombo) || (!hasProduct && !hasCombo)) {
      return res.status(400).json({
        success: false,
        message: 'Debe enviar productoId o comboId (solo uno)'
      });
    }

    const existingOrder = await Order.findById(order);

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // ── FIX 1: Blindar contra órdenes ya finalizadas ──────────────────────────
    if (existingOrder.estado === 'Entregado' || existingOrder.estado === 'Cancelado') {
      return res.status(400).json({
        success: false,
        message: `No se pueden agregar productos a una orden con estado "${existingOrder.estado}"`
      });
    }

    // Verificar si la factura vinculada ya fue pagada
    const linkedBilling = await Billing.findOne({ Order: order });
    if (linkedBilling && linkedBilling.BillStatus === 'PAYED') {
      return res.status(400).json({
        success: false,
        message: 'No se pueden agregar productos: la factura vinculada a esta orden ya fue pagada'
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const { needs, unitPrice } = await buildInventoryNeeds({
      productoId,
      comboId,
      qty
    });

    await validateStock(needs);
    await applyInventoryDelta(needs, -1);

    const subtotal = unitPrice * qty;

    const detail = await OrderDetail.create({
      order,
      productoId: productoId || null,
      comboId: comboId || null,
      cantidad: qty,
      precio: unitPrice,
      subtotal
    });

    await Order.findByIdAndUpdate(order, {
      $inc: { total: subtotal }
    });

    return res.status(201).json({
      success: true,
      message: 'Item creado y stock actualizado',
      data: detail
    });

  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      message: 'Error al crear item',
      error: error.message
    });
  }
};

export const getOrderDetailsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const details = await OrderDetail.find({ order: orderId })
      .populate('productoId')
      .populate('comboId')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: details
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener items',
      error: error.message
    });
  }
};

export const updateOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad, productoId, comboId } = req.body;

    const detail = await OrderDetail.findById(id);

    if (!detail) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado'
      });
    }

    const oldQty = Number(detail.cantidad);
    const oldProductoId = detail.productoId ? detail.productoId.toString() : null;
    const oldComboId = detail.comboId ? detail.comboId.toString() : null;

    const newQty = cantidad !== undefined ? Number(cantidad) : oldQty;

    if (!newQty || newQty < 1) {
      return res.status(400).json({
        success: false,
        message: 'cantidad debe ser >= 1'
      });
    }

    const newProductoId = productoId !== undefined ? (productoId || null) : oldProductoId;
    const newComboId = comboId !== undefined ? (comboId || null) : oldComboId;

    const hasProduct = Boolean(newProductoId);
    const hasCombo = Boolean(newComboId);

    if ((hasProduct && hasCombo) || (!hasProduct && !hasCombo)) {
      return res.status(400).json({
        success: false,
        message: 'Debe existir productoId o comboId (solo uno)'
      });
    }

    const oldNeedsResult = await buildInventoryNeeds({
      productoId: oldProductoId,
      comboId: oldComboId,
      qty: oldQty
    });

    await applyInventoryDelta(oldNeedsResult.needs, +1);

    try {
      const newNeedsResult = await buildInventoryNeeds({
        productoId: newProductoId,
        comboId: newComboId,
        qty: newQty
      });

      await validateStock(newNeedsResult.needs);
      await applyInventoryDelta(newNeedsResult.needs, -1);

      const newUnitPrice = newNeedsResult.unitPrice;
      const newSubtotal = newUnitPrice * newQty;
      const diff = Number(newSubtotal) - Number(detail.subtotal);

      detail.set({
        productoId: newProductoId,
        comboId: newComboId,
        cantidad: newQty,
        precio: newUnitPrice,
        subtotal: newSubtotal
      });

      await detail.save();

      await Order.findByIdAndUpdate(detail.order, {
        $inc: { total: diff }
      });

      return res.status(200).json({
        success: true,
        message: 'Item actualizado y stock reconciliado',
        data: detail
      });

    } catch (innerErr) {
      await applyInventoryDelta(oldNeedsResult.needs, -1);
      throw innerErr;
    }

  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      message: 'Error al actualizar item',
      error: error.message
    });
  }
};

export const deleteOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const detail = await OrderDetail.findById(id);

    if (!detail) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado'
      });
    }

    const needsResult = await buildInventoryNeeds({
      productoId: detail.productoId ? detail.productoId.toString() : null,
      comboId: detail.comboId ? detail.comboId.toString() : null,
      qty: Number(detail.cantidad)
    });

    await applyInventoryDelta(needsResult.needs, +1);

    await Order.findByIdAndUpdate(detail.order, {
      $inc: { total: -Number(detail.subtotal) }
    });

    await detail.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Item eliminado y stock restaurado'
    });

  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: 'Error al eliminar item',
      error: error.message
    });
  }
};