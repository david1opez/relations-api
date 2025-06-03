import { Router } from "express";

// UTILS
import { SendResponse, Error } from "../utils/ExpressUtils";
import prisma from "../utils/Prisma";

const router = Router();

router.get('/', async (req, res) => {
    const { email } = req.query;

    if (!email) return Error(res, 400, 'Missing user email');

    try {
        const user = await prisma.user.findFirst({
            where: {
                email: String(email),
                uid: {
                    not: null,
                    notIn: [""]
                }
            }
        });

        if (!user) return Error(res, 404, 'User not found');

        SendResponse(res, 200, user);
    } catch (err) {
        Error(res, 500, err);
    }
});

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
