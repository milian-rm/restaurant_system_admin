'use strict';

import User from './user.model.js';
import { authServiceClient, buildAuthForm, pickField } from '../../helpers/authService.helper.js';
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

    if (data.UserEmail) {
      const existing = await User.findOne({
        UserEmail: data.UserEmail.toLowerCase().trim(),
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Este cliente ya se encuentra registrado',
        });
      }
    }

    const role = data.role || 'CLIENT';

    // ── Camino nuevo: CLIENT también pasa por aquí si el admin lo crea manualmente,
    // pero el caso típico de esta pantalla es EMPLOYEE / BRANCH_ADMIN / PLATFORM_ADMIN.
    const form = buildAuthForm({
      UserName: data.UserName,
      UserSurname: data.UserSurname,
      Username: data.Username || data.UserEmail, // no hay campo de username en el form admin: usamos el correo como fallback, igual que Cliente
      Email: data.UserEmail,
      Password: data.password,
      Phone: data.UserPhone,
    });

    let authUser;
    try {
      const { data: authData } = await authServiceClient.post('/Auth/register', form);
      authUser = authData?.user || authData?.User || {};
    } catch (authError) {
      const status = authError.response?.status;
      if (status === 409) {
        return res.status(400).json({
          success: false,
          message: 'El correo o nombre de usuario ya está registrado en el servicio de autenticación',
        });
      }
      return res.status(status || 502).json({
        success: false,
        message: authError.response?.data?.message
          || authError.response?.data?.title
          || 'No se pudo crear el usuario en el servicio de autenticación',
      });
    }

    const authId = pickField(authUser, 'id', 'Id', 'userId', 'UserId');

    // El registro público siempre asigna CLIENT. Si el rol pedido es distinto,
    // promovemos usando el nuevo endpoint de UserManagementController.
    if (authId && role !== 'CLIENT') {
      try {
        await authServiceClient.patch(
          `/users/${authId}/role`,
          { roleName: role },
          { headers: { Authorization: req.headers.authorization || `Bearer ${req.token}` } }
        );
      } catch (roleError) {
        // El usuario ya existe en Postgres como CLIENT pero no se pudo promover.
        // No revertimos la creación (no hay endpoint de borrado admin), avisamos
        // claramente para que se resuelva a mano (reintentar la promoción o
        // usar el "cambiar rol" desde updateUser una vez creado).
        const localUser = await User.create({
          authId,
          UserName: data.UserName,
          UserSurname: data.UserSurname,
          UserEmail: data.UserEmail,
          phone: data.UserPhone,
          role: 'CLIENT',
          UserStatus: data.UserStatus || 'ACTIVE',
        });

        return res.status(207).json({
          success: false,
          message: `Usuario creado como CLIENT en el servicio de autenticación, pero no se pudo promover a ${role}. Corrígelo editando el usuario.`,
          error: roleError.response?.data?.message || roleError.message,
          data: localUser,
        });
      }
    }

    const localUser = await User.create({
      authId,
      UserName: data.UserName,
      UserSurname: data.UserSurname,
      UserEmail: data.UserEmail,
      phone: data.UserPhone,
      role,
      branchId: data.branchId,
      UserStatus: data.UserStatus || 'ACTIVE',
    });

    return res.status(201).json({
      success: true,
      message: 'Usuario creado correctamente',
      data: localUser,
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Este cliente ya se encuentra registrado',
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message,
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
    delete updates.addresses;

    const current = await User.findById(id);
    if (current?.authId && updates.role && updates.role !== current.role) {
      try {
        await authServiceClient.patch(
          `/users/${current.authId}/role`,
          { roleName: updates.role },
          { headers: { Authorization: req.headers.authorization || `Bearer ${req.token}` } }
        );
      } catch (roleError) {
        return res.status(roleError.response?.status || 502).json({
          success: false,
          message: 'No se pudo sincronizar el rol con el servicio de autenticación',
          error: roleError.response?.data?.message || roleError.message,
        });
      }
    }

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

    const current = await User.findById(id);
    if (!current) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const newStatus = current.UserStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    // Si el usuario ya vive en el AuthService (authId presente), la fuente
    // real de verdad para el login es Postgres — hay que sincronizarla
    // primero. Si esto falla, no tocamos Mongo (evita quedar desincronizados).
    if (current.authId) {
      try {
        await authServiceClient.patch(
          `/users/${current.authId}/status`,
          { status: newStatus },
          { headers: { Authorization: req.headers.authorization || `Bearer ${req.token}` } }
        );
      } catch (syncError) {
        return res.status(syncError.response?.status || 502).json({
          success: false,
          message: 'No se pudo sincronizar el estado con el servicio de autenticación',
          error: syncError.response?.data?.message || syncError.message,
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        UserStatus: newStatus,
        deletedAt: newStatus === 'INACTIVE' ? new Date() : null,
      },
      { new: true, runValidators: true }
    ).select('-password');

    return res.status(200).json({
      success: true,
      message: `Usuario ${user.UserStatus}`,
      data: user,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error cambiando estado',
      error: error.message,
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