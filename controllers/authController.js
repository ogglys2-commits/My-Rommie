const Pair = require('../models/Pair');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mailer = require('../config/mailer');

// 1. REGISTRO DE PAREJA
exports.registerPair = async (req, res) => {
  try {
    const { pairId, email, user1, user2, password } = req.body;

    if (!pairId || !email || !user1 || !user2 || !password) {
      return res.status(400).json({ msg: 'Por favor completa todos los campos requeridos.' });
    }

    // Verificar si ya existe el ID de pareja o el correo
    let pairExists = await Pair.findOne({ $or: [{ pairId }, { email }] });
    if (pairExists) {
      return res.status(400).json({ msg: 'El ID de Pareja o el Correo Electrónico ya están registrados.' });
    }

    // Definir si es el primer usuario en el sistema para asignarle ROL ADMIN automáticamente
    const totalPairs = await Pair.countDocuments();
    const role = totalPairs === 0 ? 'admin' : 'user';

    const newPair = new Pair({
      pairId,
      email,
      user1,
      user2,
      password, // En producción se recomienda encriptar con bcrypt
      role
    });

    await newPair.save();

    // Intentar enviar correo de bienvenida (sin tumbar la respuesta si falla la red)
    try {
      await mailer.sendWelcomeEmail(email, pairId, user1, user2);
    } catch (mailErr) {
      console.log('⚠️ No se pudo enviar el correo de bienvenida:', mailErr.message);
    }

    res.status(201).json({
      msg: 'Pareja registrada con éxito.',
      pair: {
        pairId: newPair.pairId,
        email: newPair.email,
        user1: newPair.user1,
        user2: newPair.user2,
        role: newPair.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al registrar la pareja en el servidor.' });
  }
};

// 2. INICIO DE SESIÓN
exports.loginPair = async (req, res) => {
  try {
    const { pairId, password } = req.body;

    const pair = await Pair.findOne({ pairId: pairId.toLowerCase() });
    if (!pair) {
      return res.status(404).json({ msg: 'Pareja no encontrada.' });
    }

    if (pair.password !== password) {
      return res.status(400).json({ msg: 'Contraseña incorrecta.' });
    }

    // Generar Token JWT con rol
    const token = jwt.sign(
      { id: pair._id, pairId: pair.pairId, role: pair.role },
      process.env.JWT_SECRET || 'secreto_super_seguro',
      { expiresIn: '7d' }
    );

    res.json({
      msg: 'Inicio de sesión exitoso',
      token,
      pair: {
        pairId: pair.pairId,
        email: pair.email,
        user1: pair.user1,
        user2: pair.user2,
        role: pair.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al iniciar sesión.' });
  }
};

// 3. SOLICITAR RECUPERACIÓN DE CONTRASEÑA
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const pair = await Pair.findOne({ email: email.toLowerCase() });

    if (!pair) {
      return res.status(404).json({ msg: 'No existe ninguna cuenta asociada a este correo.' });
    }

    // Generar token aleatorio
    const resetToken = crypto.randomBytes(20).toString('hex');
    pair.resetPasswordToken = resetToken;
    pair.resetPasswordExpires = Date.now() + 3600000; // 1 hora de validez

    await pair.save();

    await mailer.sendResetPasswordEmail(pair.email, pair.pairId, resetToken);

    res.json({ msg: 'Correo de recuperación enviado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al procesar la solicitud de contraseña.' });
  }
};

// 4. RESTABLECER CONTRASEÑA CON TOKEN
exports.resetPassword = async (req, res) => {
  try {
    const { token, pairId, newPassword } = req.body;

    const pair = await Pair.findOne({
      pairId: pairId.toLowerCase(),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!pair) {
      return res.status(400).json({ msg: 'El enlace de recuperación es inválido o ha expirado.' });
    }

    pair.password = newPassword;
    pair.resetPasswordToken = null;
    pair.resetPasswordExpires = null;
    await pair.save();

    res.json({ msg: 'Contraseña actualizada con éxito. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al restablecer la contraseña.' });
  }
};

// 5. OBTENER TODAS LAS PAREJAS (PANEL ADMIN)
exports.getAllPairsAdmin = async (req, res) => {
  try {
    const pairs = await Pair.find({}, '-password').sort({ createdAt: -1 });
    res.json(pairs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener la lista de parejas.' });
  }
};