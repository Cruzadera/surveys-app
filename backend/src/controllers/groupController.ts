import { Request, Response } from 'express';
import prisma from '../services/db';

export const createGroupHandler = async (req: Request, res: Response) => {
  const { name } = req.body;
  try {
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const group = await prisma.group.create({ data: { name, inviteCode } });
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear grupo', error });
  }
};

export const joinGroupHandler = async (req: Request, res: Response) => {
  const { inviteCode } = req.body;
  try {
    const group = await prisma.group.findUnique({ where: { inviteCode } });
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Error al unirse al grupo', error });
  }
};

export const groupResultsHandler = async (req: Request, res: Response) => {
  const { groupId } = req.params;
  try {
    const numericGroupId = Number(groupId);
    const today = new Date().toISOString().slice(0, 10);

    const group = await prisma.group.findUnique({
      where: { id: numericGroupId }
    });

    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    const daily = await prisma.dailyQuestion.findFirst({
      where: {
        groupId: numericGroupId,
        date: {
          gte: new Date(`${today}T00:00:00.000Z`),
          lt: new Date(`${today}T23:59:59.999Z`)
        }
      },
      include: { question: true },
      orderBy: { date: 'desc' }
    });

    if (!daily) {
      return res.json({ groupId: numericGroupId, ranking: [], group, daily: null });
    }

    const answers = await prisma.answer.findMany({
      where: {
        groupId: numericGroupId,
        questionId: daily.questionId
      },
      include: {
        userFrom: true
      },
      orderBy: { date: 'desc' }
    });

    const targetIds = Array.from(
      new Set(
        answers
          .map((answer) => answer.userTargetId)
          .filter((value): value is number => typeof value === 'number')
      )
    );

    const targetUsers = targetIds.length
      ? await prisma.user.findMany({
          where: { id: { in: targetIds } }
        })
      : [];

    const targetUsersMap = new Map(targetUsers.map((user) => [user.id, user]));
    const rankingMap = new Map<
      string,
      {
        id: string;
        name: string;
        avatar: string | null;
        color: string | null;
        score: number;
        voters: Array<{ id: string; name: string; avatar: string | null }>;
      }
    >();

    for (const answer of answers) {
      const targetUser = typeof answer.userTargetId === 'number' ? targetUsersMap.get(answer.userTargetId) : null;
      const fallbackName = answer.answerText?.trim() || 'Respuesta';
      const itemKey = targetUser ? `user-${targetUser.id}` : `text-${fallbackName.toLowerCase()}`;

      if (!rankingMap.has(itemKey)) {
        rankingMap.set(itemKey, {
          id: itemKey,
          name: targetUser?.name || fallbackName,
          avatar: targetUser?.avatar || null,
          color: null,
          score: 0,
          voters: []
        });
      }

      const rankingItem = rankingMap.get(itemKey);
      if (!rankingItem) {
        continue;
      }

      rankingItem.score += 1;
      rankingItem.voters.push({
        id: String(answer.userFrom.id),
        name: answer.userFrom.name,
        avatar: answer.userFrom.avatar || null
      });
    }

    const ranking = Array.from(rankingMap.values()).sort((a, b) => b.score - a.score);

    return res.json({
      groupId: numericGroupId,
      ranking,
      group,
      daily
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener resultados del grupo', error });
  }
};
