'use strict';

import User from './user.model.js';

/**
 * GET /users
 * Obtener usuarios con filtros opcionales
 */
export const getUsers = async (req, res) => {
  try {
    const { role, UserStatus, branchId } = req.query;

    const filter = {};

    if (role) filter.role = role;
    if (UserStatus) filter.UserStatus = UserStatus;
    if (branchId) filter.branchId = branchId;

    const users = await User.find(filter).select('-password');

    return res.status(200).json({
      success: true,
      data: users
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

/**
 * GET /users/:id
 * Obtener usuario por ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

/**
 * POST /users
 * Crear usuario
 */
export const createUser = async (req, res) => {
  try {
    const data = req.body;

    const user = new User(data);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: 'Usuario creado correctamente',
      data: userResponse
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message
    });
  }
};

/**
 * PUT /users/:id
 * Actualizar usuario
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    delete updates.password;

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Usuario actualizado correctamente',
      data: user
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error actualizando usuario',
      error: error.message
    });
  }
};

/**
 * PATCH /users/:id/status
 * Cambiar estado del usuario
 */
export const changeUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    user.UserStatus = user.UserStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    user.deletedAt = user.UserStatus === 'INACTIVE' ? new Date() : null;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: `Usuario ${user.UserStatus}`,
      data: userResponse
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error cambiando estado',
      error: error.message
    });
  }
};

/**
 * GET /users/profile
 * Sin JWT ya no hay usuario autenticado.
 * Usa GET /users/:id para obtener un usuario específico.
 */
export const getProfile = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'La ruta profile requiere autenticación. Sin validateJWT, usa /users/:id'
  });
};