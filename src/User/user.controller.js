'use strict';

import User from './user.model.js';

/**
 * GET /users
 * PLATFORM_ADMIN: ve todos (con filtros opcionales)
 * BRANCH_ADMIN: ve solo EMPLOYEE/CLIENT de su propia sucursal
 */
export const getUsers = async (req, res) => {
  try {
    if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const { role, UserStatus } = req.query;
    const filter = {};

    if (req.user.role === 'BRANCH_ADMIN') {
      // Solo puede ver EMPLOYEE y CLIENT
      filter.role = { $in: ['EMPLOYEE', 'CLIENT'] };

      // Solo de su sucursal
      filter.branchId = req.user.branchId;

      // Si piden role, solo acepta EMPLOYEE/CLIENT
      if (role && !['EMPLOYEE', 'CLIENT'].includes(role)) {
        return res.status(403).json({ success: false, message: 'No puede ver administradores' });
      }
      if (role) filter.role = role;
    } else {
      // PLATFORM_ADMIN puede filtrar cualquier rol
      if (role) filter.role = role;
    }

    if (UserStatus) filter.UserStatus = UserStatus;

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
 * PLATFORM_ADMIN: puede ver cualquiera
 * BRANCH_ADMIN: solo EMPLOYEE/CLIENT y solo de su sucursal
 */
export const getUserById = async (req, res) => {
  try {
    if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (req.user.role === 'BRANCH_ADMIN') {
      // No puede ver admins
      if (!['EMPLOYEE', 'CLIENT'].includes(user.role)) {
        return res.status(403).json({ success: false, message: 'No autorizado' });
      }
      // Solo puede ver usuarios de su sucursal
      if (user.branchId?.toString() !== req.user.branchId?.toString()) {
        return res.status(403).json({ success: false, message: 'No autorizado' });
      }
    }

    return res.status(200).json({ success: true, data: user });

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
 * PLATFORM_ADMIN: puede crear cualquiera
 * BRANCH_ADMIN: solo EMPLOYEE/CLIENT (y debe asignarse a su branch)
 */
export const createUser = async (req, res) => {
  try {
    const creator = req.user;
    let { role, ...data } = req.body;

    if (!creator) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    switch (creator.role) {
      case 'PLATFORM_ADMIN':
        break;

      case 'BRANCH_ADMIN':
        if (role === 'PLATFORM_ADMIN' || role === 'BRANCH_ADMIN') {
          return res.status(403).json({ message: 'No puede crear administradores' });
        }
        // Fuerza la sucursal del BRANCH_ADMIN
        data.branchId = creator.branchId;
        break;

      default:
        return res.status(403).json({ message: 'No tiene permisos para crear usuarios' });
    }

    const user = new User({ ...data, role });
    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Usuario creado correctamente',
      data: user
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
 * PLATFORM_ADMIN: puede editar cualquiera (sin password)
 * BRANCH_ADMIN: solo EMPLOYEE/CLIENT y solo de su sucursal
 */
export const updateUser = async (req, res) => {
  try {
    if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const { id } = req.params;
    const updates = req.body;

    delete updates.password;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (req.user.role === 'BRANCH_ADMIN') {
      // Solo EMPLOYEE/CLIENT
      if (!['EMPLOYEE', 'CLIENT'].includes(targetUser.role)) {
        return res.status(403).json({ success: false, message: 'No puede editar a otros administradores' });
      }
      // Solo de su sucursal
      if (targetUser.branchId?.toString() !== req.user.branchId?.toString()) {
        return res.status(403).json({ success: false, message: 'No autorizado' });
      }
      // Evita cambiar branchId fuera de su sucursal
      updates.branchId = req.user.branchId;
    }

    if (updates.role) {
      if (req.user.role === 'BRANCH_ADMIN' && ['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(updates.role)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para asignar roles administrativos'
        });
      }
    } else {
      delete updates.role;
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .select('-password');

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
 * PLATFORM_ADMIN: puede cambiar estado de cualquiera
 * BRANCH_ADMIN: solo EMPLOYEE/CLIENT y solo de su sucursal
 */
export const changeUserStatus = async (req, res) => {
  try {
    if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    if (req.user.role === 'BRANCH_ADMIN') {
      if (!['EMPLOYEE', 'CLIENT'].includes(user.role)) {
        return res.status(403).json({ success: false, message: 'No puede cambiar estado de administradores' });
      }
      if (user.branchId?.toString() !== req.user.branchId?.toString()) {
        return res.status(403).json({ success: false, message: 'No autorizado' });
      }
    }

    user.UserStatus = user.UserStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    user.deletedAt = user.UserStatus === 'INACTIVE' ? new Date() : null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: `Usuario ${user.UserStatus}`,
      data: user
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
 * Devuelve el usuario autenticado (req.user) según el JWT.
 */
export const getProfile = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};