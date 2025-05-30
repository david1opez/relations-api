import { Router } from "express";

// UTILS
import { SendResponse, Error } from "../utils/ExpressUtils";
import prisma from "../utils/Prisma";

const router = Router();

// GET ?id=xxx
router.get('/', async (req, res) => {
    const { id } = req.query;
    if (!id) return Error(res, 400, 'Missing user id');
    try {
        const user = await prisma.user.findUnique({ where: { uid: String(id) } });
        if (!user) return Error(res, 404, 'User not found');
        SendResponse(res, 200, user);
    } catch (err) {
        Error(res, 500, err);
    }
});

// PUT ?id=xxx
router.put('/', async (req, res) => {
    const { id } = req.query;
    if (!id) return Error(res, 400, 'Missing user id');
    try {
        const updated = await prisma.user.update({
            where: { uid: String(id) },
            data: req.body,
        });
        SendResponse(res, 200, updated);
    } catch (err) {
        Error(res, 500, err);
    }
});

// DELETE ?id=xxx
router.delete('/', async (req, res) => {
    const { id } = req.query;
    if (!id) return Error(res, 400, 'Missing user id');
    try {
        await prisma.user.delete({ where: { uid: String(id) } });
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

// PUT /create
router.put('/create', async (req, res) => {
    const { uid, email } = req.body;
    if (!uid || !email) return Error(res, 400, 'Missing uid or email');
    try {
        const user = await prisma.user.update({
            where: { email: String(email) },
            data: { uid: String(uid) },
        });
        SendResponse(res, 200, user);
    } catch (err) {
        Error(res, 500, err);
    }
});

export default router;
