import { Router } from "express";

// UTILS
import { SendResponse, Error } from "../utils/ExpressUtils";
import prisma from "../utils/Prisma";

const router = Router();

// GET ?id=xxx
router.get('/', async (req, res) => {
    const { uid } = req.query;

    if (!uid) return Error(res, 400, 'Missing user id');

    try {
        const user = await prisma.user.findUnique({ where: { uid: String(uid) } });
        if (!user) return Error(res, 404, 'User not found');
        SendResponse(res, 200, user);
    } catch (err) {
        Error(res, 500, err);
    }
});

router.post('/update', async (req, res) => {
    const { uid } = req.query;

    if (!uid) return Error(res, 400, 'Missing user id');

    try {
        const updated = await prisma.user.update({
            where: { uid: String(uid) },
            data: req.body,
        });
        SendResponse(res, 200, updated);
    } catch (err) {
        if ((err as any)?.meta?.cause === 'No record was found for an update') {
            return Error(res, 404, 'User not found');
        } else {
            Error(res, 500, err);
        }
    }
});

// DELETE ?id=xxx
router.delete('/delete', async (req, res) => {
    const { uid } = req.query;
    if (!uid) return Error(res, 400, 'Missing user id');
    try {
        await prisma.user.delete({ where: { uid: String(uid) } });
        SendResponse(res, 200, { success: true });
    } catch (err) {
        Error(res, 500, err);
    }
});

// POST /create
router.post('/create', async (req, res) => {
    try {
        const user = await prisma.user.create({ data: req.body });
        SendResponse(res, 201, user);
    } catch (err) {
        Error(res, 500, err);
    }
});

// Assign a UID to an existing user by email
router.post('/assignUID', async (req, res) => {
    const { uid, email } = req.body;

    if (!uid || !email) return Error(res, 400, 'Missing uid or email');

    try {
        const user = await prisma.user.update({
            where: { email: String(email) },
            data: { uid: String(uid) },
        });

        SendResponse(res, 200, user);
    } catch (err) {
        if ((err as any)?.meta?.cause === 'No record was found for an update.') {
            return Error(res, 404, 'User not found');
        } else {
            Error(res, 500, err);
        }
    }
});

export default router;
