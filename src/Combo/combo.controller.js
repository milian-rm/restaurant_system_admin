"use strict";

import Combo from "./combo.model.js";
import Product from "../Product/product.model.js";

// Obtener combos
export const getCombos = async (req, res) => {
  try {
    const { page = 1, limit = 10, ComboStatus } = req.query;

    const filter = {};

    if (ComboStatus) filter.ComboStatus = ComboStatus;

    const combos = await Combo.find(filter)
      .populate({
        path: "ComboList.productId",
        select: "nombre precio categoria estado",
      })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Combo.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: combos,
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
      message: "Error al obtener los combos",
      error: error.message,
    });
  }
};

// Obtener combo por ID
export const getComboById = async (req, res) => {
  try {
    const { id } = req.params;

    const combo = await Combo.findById(id).populate({
      path: "ComboList.productId",
      select: "nombre precio categoria imagen_url estado",
    });

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: "Combo no encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data: combo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al obtener el combo",
      error: error.message,
    });
  }
};

// Crear combo
export const createCombo = async (req, res) => {
  try {
    let {
      ComboName,
      ComboDescription,
      ComboList,
      ComboDiscount = 0,
      ComboStatus,
    } = req.body;

    if (typeof ComboList === 'string') {
      ComboList = JSON.parse(ComboList);
    }

    if (!ComboList || ComboList.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "El combo debe tener al menos un producto",
        });
    }

    // Calcular precio total sumando precio * cantidad de cada producto
    let totalBruto = 0;
    for (const item of ComboList) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res
          .status(404)
          .json({
            success: false,
            message: `El producto con ID ${item.productId} no existe`,
          });
      }
      totalBruto += product.precio * item.cantidad;
    }

    // Aplicar descuento: si pones 10, descuenta 10%
    const descuento = Number(ComboDiscount) || 0;
    const ComboPrice = parseFloat(
      (totalBruto * (1 - descuento / 100)).toFixed(2),
    );

    const combo = new Combo({
      ComboName,
      ComboDescription,
      ComboList,
      ComboDiscount: descuento,
      ComboPrice,
      ...(ComboStatus && { ComboStatus }),
      ...(req.file && { image: { url: req.file.path, public_id: req.file.filename } }),
    });

    await combo.save();

    return res.status(201).json({
      success: true,
      message: "Combo creado exitosamente",
      data: combo,
    });
  } catch (error) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Error al crear el combo",
        error: error.message,
      });
  }
};

// Actualizar combo
export const updateCombo = async (req, res) => {
  try {
    const { id } = req.params;
    let data = req.body; // Usamos let por si necesitamos reasignar

    // 1. Convertir ComboList de String a Array si viene de FormData
    if (data.ComboList && typeof data.ComboList === 'string') {
      data.ComboList = JSON.parse(data.ComboList);
    }

    if (req.file) {
      data.image = { url: req.file.path, public_id: req.file.filename };
    }

    if (data.ComboList && Array.isArray(data.ComboList)) {
      if (data.ComboList.length === 0) {
        return res.status(400).json({
          success: false,
          message: "El combo no puede quedarse sin productos",
        });
      }

      let totalBruto = 0;
      for (const item of data.ComboList) {
        const product = await Product.findById(item.productId);

        if (!product) {
          return res.status(404).json({
            success: false,
            message: `El producto con ID ${item.productId} no existe`,
          });
        }
        totalBruto += product.precio * item.cantidad;
      }

      const descuento = Number(data.ComboDiscount) || 0;
      data.ComboPrice = parseFloat(
        (totalBruto * (1 - descuento / 100)).toFixed(2)
      );
    }

    const combo = await Combo.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate("ComboList.productId", "nombre precio");

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: "Combo no encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Combo actualizado y precio recalculado exitosamente",
      data: combo,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Error al actualizar el combo",
      error: error.message,
    });
  }
};

// Cambiar estado del combo
export const changeComboStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const combo = await Combo.findById(id);

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: "Combo no encontrado",
      });
    }

    combo.ComboStatus = combo.ComboStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    combo.deletedAt = combo.ComboStatus === "INACTIVE" ? new Date() : null;

    await combo.save();

    return res.status(200).json({
      success: true,
      message: `Combo ${combo.ComboStatus === "ACTIVE" ? "activado" : "desactivado"} exitosamente`,
      data: combo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al cambiar el estado del combo",
      error: error.message,
    });
  }
};
