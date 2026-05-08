import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../services/db';
import { createAutologinToken, verifyAutologinToken } from '../utils/token';
import { sendLoginEmail, sendPasswordResetEmail } from '../services/email.service';
import {
  ensureUserAvatarColor,
  findOrCreateEmailUser,
  normalizeEmail,
  resolveSessionUser
} from '../services/authSession';

const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_ROUNDS = 12;
const PASSWORD_RESET_EXPIRY_MINUTES = 30;

const frontendUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:8081';
const backendPublicUrl =
  process.env.BACKEND_PUBLIC_URL ??
  process.env.API_URL ??
  process.env.BACKEND_URL ??
  `http://localhost:${process.env.PORT || 3001}`;

const hashOneTimeToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const serializeUser = (user: {
  id: string;
  authKey: string | null;
  email: string | null;
  name: string | null;
  avatarColor: string | null;
  avatarImage: string | null;
  createdAt: Date;
}) => ({
  id: user.id,
  authKey: user.authKey,
  email: user.email,
  name: user.name,
  avatarColor: user.avatarColor,
  avatarImage: user.avatarImage,
  createdAt: user.createdAt
});

const ensureMembershipFromPoll = async (userId: string, pollId: string | null) => {
  if (!pollId) {
    return null;
  }

  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: { groupId: true }
  });

  if (!poll?.groupId) {
    return null;
  }

  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: poll.groupId, userId } },
    update: {},
    create: { groupId: poll.groupId, userId }
  });

  return { id: poll.groupId };
};

const verifyMagicLinkToken = async (token: string) => {
  const tokenHash = hashOneTimeToken(token);

  const emailToken = await prisma.emailLoginToken.findUnique({
    where: { tokenHash }
  });

  if (!emailToken || emailToken.usedAt || emailToken.expiresAt < new Date()) {
    throw new Error('MAGIC_LINK_INVALID');
  }

  if (!emailToken.email) {
    throw new Error('MAGIC_LINK_EMAIL_MISSING');
  }

  const nameFromEmail = emailToken.email.split('@')[0] || null;
  const { authSubject, user } = await findOrCreateEmailUser(emailToken.email, {
    name: nameFromEmail
  });

  await prisma.emailLoginToken.update({
    where: { id: emailToken.id },
    data: { usedAt: new Date(), userId: user.id }
  });

  await ensureMembershipFromPoll(user.id, emailToken.pollId);

  return {
    email: emailToken.email,
    pollId: emailToken.pollId,
    sessionToken: createAutologinToken(authSubject, undefined, {
      userId: user.id,
      email: user.email,
      name: user.name
    }),
    user
  };
};

export const autologinHandler = async (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  const pollId = typeof req.query.pollId === 'string' ? req.query.pollId : '';

  if (!token) {
    return res.status(400).json({ message: 'token es obligatorio' });
  }

  try {
    const payload = verifyAutologinToken(token);
    const { user } = await resolveSessionUser(payload);

    if (pollId) {
      await ensureMembershipFromPoll(user.id, pollId);
    }

    const memberships = await prisma.groupMember.findMany({
      where: { userId: user.id },
      include: {
        group: {
          select: { id: true, name: true, inviteCode: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const groups = memberships.map(({ group }) => ({
      id: group.id,
      name: group.name,
      inviteCode: group.inviteCode
    }));

    const nextStep = user.name ? 'groupList' : 'onboarding';
    const sessionToken = createAutologinToken(payload.sub, undefined, {
      userId: user.id,
      email: user.email,
      name: user.name
    });

    return res.json({
      nextStep,
      token: sessionToken,
      user: serializeUser(user),
      groups,
      pollId: pollId || null
    });
  } catch (error) {
    return res.status(401).json({ message: 'No se pudo autenticar el acceso', error });
  }
};

export const standaloneLoginHandler = async (req: Request, res: Response) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (!name) {
    return res.status(400).json({ message: 'El nombre es obligatorio en modo standalone' });
  }

  try {
    const subject = `standalone:${crypto.randomUUID()}`;
    const token = createAutologinToken(subject);
    const payload = verifyAutologinToken(token);
    const { user } = await resolveSessionUser(payload);
    let updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name }
    });
    updatedUser = await ensureUserAvatarColor(updatedUser);
    const sessionToken = createAutologinToken(subject, undefined, {
      userId: updatedUser.id,
      name: updatedUser.name
    });

    return res.json({
      nextStep: 'groupLobby',
      token: sessionToken,
      user: serializeUser(updatedUser)
    });
  } catch (error) {
    return res.status(500).json({ message: 'No se pudo iniciar el acceso standalone', error });
  }
};

export const startEmailLoginHandler = async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : '';
  const pollId = typeof req.body?.pollId === 'string' ? req.body.pollId.trim() : '';

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Email no válido.' });
  }

  try {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashOneTimeToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.emailLoginToken.create({
      data: {
        email,
        tokenHash,
        pollId: pollId || null,
        expiresAt
      }
    });

    const loginUrl = `${backendPublicUrl.replace(/\/$/, '')}/auth/email/verify?token=${encodeURIComponent(rawToken)}`;
    const sentBySmtp = await sendLoginEmail(email, loginUrl);

    return res.json({
      ok: true,
      message: 'Si el correo existe, te hemos enviado un enlace de acceso.',
      ...(sentBySmtp
        ? {}
        : {
            // Fallback de desarrollo si no hay SMTP configurado.
            debugLoginUrl: loginUrl
          })
    });
  } catch (error) {
    console.error('No se pudo iniciar login por email', error);
    return res.status(500).json({ message: 'No se pudo iniciar el acceso por email.' });
  }
};

export const verifyEmailLoginHandler = async (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';

  if (!token) {
    return res.status(400).json({ message: 'Token de email obligatorio.' });
  }

  try {
    const { email, pollId, sessionToken } = await verifyMagicLinkToken(token);
    const redirectUrl = new URL('/auth/email/verified', `${frontendUrl.replace(/\/$/, '')}/`);
    redirectUrl.searchParams.set('token', sessionToken);
    redirectUrl.searchParams.set('email', email);
    if (pollId) {
      redirectUrl.searchParams.set('pollId', pollId);
    }

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    if (error instanceof Error && error.message === 'MAGIC_LINK_INVALID') {
      return res.status(401).json({ message: 'Enlace inválido o expirado.' });
    }

    if (error instanceof Error && error.message === 'MAGIC_LINK_EMAIL_MISSING') {
      return res.status(400).json({ message: 'El enlace no incluye un email válido.' });
    }

    console.error('No se pudo verificar login por email', error);
    return res.status(500).json({ message: 'No se pudo validar el enlace de email.' });
  }
};

export const verifyMagicLinkHandler = async (req: Request, res: Response) => {
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';

  if (!token) {
    return res.status(400).json({ message: 'Token obligatorio.' });
  }

  try {
    const { user, sessionToken, pollId } = await verifyMagicLinkToken(token);

    return res.json({
      token: sessionToken,
      user: serializeUser(user),
      pollId: pollId || null
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'MAGIC_LINK_INVALID') {
      return res.status(401).json({ message: 'Enlace inválido o expirado.' });
    }

    if (error instanceof Error && error.message === 'MAGIC_LINK_EMAIL_MISSING') {
      return res.status(400).json({ message: 'El enlace no incluye un email válido.' });
    }

    console.error('No se pudo verificar magic link', error);
    return res.status(500).json({ message: 'No se pudo validar el magic link.' });
  }
};

const buildSessionForUser = async (user: {
  id: string;
  authKey: string | null;
  email: string | null;
  name: string | null;
  avatarColor: string | null;
  avatarImage: string | null;
  createdAt: Date;
}) => {
  const subject = `email:${user.email}`;
  const sessionToken = createAutologinToken(subject, undefined, {
    userId: user.id,
    email: user.email,
    name: user.name
  });

  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: { group: { select: { id: true, name: true, inviteCode: true } } },
    orderBy: { createdAt: 'desc' }
  });

  const groups = memberships.map(({ group }) => ({
    id: group.id,
    name: group.name,
    inviteCode: group.inviteCode
  }));

  return { sessionToken, groups };
};

export const registerHandler = async (req: Request, res: Response) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const rawAge = req.body?.age;
  const age = typeof rawAge === 'number' ? rawAge : parseInt(String(rawAge), 10);
  const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!name) {
    return res.status(400).json({ field: 'name', message: 'El nombre es obligatorio.' });
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ field: 'email', message: 'El email no es válido.' });
  }

  if (isNaN(age) || age < 1) {
    return res.status(400).json({ field: 'age', message: 'Introduce una edad válida.' });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ field: 'password', message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ field: 'email', message: 'El email ya está registrado.' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const subject = `email:${email}`;
    const authKey = crypto.createHmac('sha256', process.env.JWT_SECRET ?? '').update(subject).digest('hex');

    let user = await prisma.user.create({
      data: {
        email,
        name,
        age,
        passwordHash,
        authKey,
        authProvider: 'LOCAL',
        avatarColor: null
      }
    });

    user = await ensureUserAvatarColor(user);
    const { sessionToken, groups } = await buildSessionForUser(user);

    return res.status(201).json({
      nextStep: 'groupList',
      token: sessionToken,
      user: serializeUser(user),
      groups
    });
  } catch (error) {
    console.error('[register] error', error);
    return res.status(500).json({ message: 'No se pudo completar el registro.' });
  }
};

export const loginHandler = async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  // Generic error to avoid leaking account existence
  const invalidCredentials = () =>
    res.status(401).json({ message: 'Credenciales inválidas.' });

  if (!email || !password) {
    return invalidCredentials();
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      // Constant-time dummy check to prevent timing attacks
      await bcrypt.compare(password, '$2a$12$dummyhashfordummycomparison000000000000000000');
      return invalidCredentials();
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return invalidCredentials();
    }

    const userWithColor = await ensureUserAvatarColor(user);
    const { sessionToken, groups } = await buildSessionForUser(userWithColor);

    return res.json({
      nextStep: 'groupList',
      token: sessionToken,
      user: serializeUser(userWithColor),
      groups
    });
  } catch (error) {
    console.error('[login] error', error);
    return res.status(500).json({ message: 'No se pudo completar el acceso.' });
  }
};

export const forgotPasswordHandler = async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : '';

  if (!email || !email.includes('@')) {
    return res.status(200).json({
      ok: true,
      message: 'Si el correo existe, te enviaremos instrucciones para recuperar la contrasena.'
    });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashOneTimeToken(rawToken);
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt
        }
      });

      const resetUrl = `${frontendUrl.replace(/\/$/, '')}/auth/password/reset?token=${encodeURIComponent(rawToken)}`;
      await sendPasswordResetEmail(email, resetUrl);
    }

    return res.status(200).json({
      ok: true,
      message: 'Si el correo existe, te enviaremos instrucciones para recuperar la contrasena.'
    });
  } catch (error) {
    console.error('[forgot-password] error', error);
    return res.status(500).json({ message: 'No se pudo procesar la recuperacion de contrasena.' });
  }
};

export const resetPasswordHandler = async (req: Request, res: Response) => {
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!token) {
    return res.status(400).json({ message: 'Token obligatorio.' });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      field: 'password',
      message: `La contrasena debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
    });
  }

  try {
    const tokenHash = hashOneTimeToken(token);
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Enlace de recuperacion invalido o expirado.' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          authProvider: 'LOCAL'
        }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() }
      })
    ]);

    return res.status(200).json({ ok: true, message: 'Contrasena actualizada correctamente.' });
  } catch (error) {
    console.error('[reset-password] error', error);
    return res.status(500).json({ message: 'No se pudo actualizar la contrasena.' });
  }
};
