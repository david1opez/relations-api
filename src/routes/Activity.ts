import { Router } from "express";

// UTILS
import { SendResponse, Error } from "../utils/ExpressUtils";
import prisma from "../utils/Prisma";

const router = Router();

router.get('/recent', async (req, res) => {
    const { uid } = req.query;

    if (!uid) return Error(res, 400, 'Missing uid');

    try {
        // Get user
        const user = await prisma.user.findUnique({
            where: { uid: String(uid) },
            select: { userID: true, name: true }
        });

        if (!user) return Error(res, 404, 'User not found');

        // Get all projectIDs where user participated in at least one call
        const callParticipants = await prisma.callParticipant.findMany({
            where: { userID: user.userID },
            select: { callID: true }
        });

        const callIDs = callParticipants.map(cp => cp.callID);
        let projectIDs: number[] = [];

        if (callIDs.length > 0) {
            const calls = await prisma.call.findMany({
                where: { callID: { in: callIDs }, projectID: { not: null } },
                select: { projectID: true }
            });
            const projectIDsSet = new Set<number>();
            calls.forEach(c => { if (c.projectID) projectIDsSet.add(c.projectID); });
            projectIDs = Array.from(projectIDsSet);
        }
        
        const activityLogs = await prisma.activityLog.findMany({
            where: {
                OR: [
                    { userID: user.userID },
                    { projectID: { in: projectIDs.length > 0 ? projectIDs : [0] } }
                ]
            },
            orderBy: { timestamp: 'desc' },
            include: {
                user: { select: { name: true } },
                project: { select: { name: true } },
                projectCall: {
                    select: {
                        call: { select: { title: true, callID: true } }
                    }
                },
                supportCall: {
                    select: {
                        call: { select: { title: true, callID: true } }
                    }
                }
            }
        });

        // Format activities
        const activities = activityLogs.map(log => {
            let where = null;
            if (log.project) {
                where = log.project.name;
            } else if (log.projectCall && log.projectCall.call) {
                where = log.projectCall.call.title || `call_${log.projectCall.call.callID}`;
            } else if (log.supportCall && log.supportCall.call) {
                where = log.supportCall.call.title || `call_${log.supportCall.call.callID}`;
            }
            return {
                username: log.user.name,
                date: log.timestamp,
                action: log.action,
                where
            };
        });

        return SendResponse(res, 200, { activities });
    } catch (err) {
        Error(res, 500, err);
    }
});

router.get('/stats', async (req, res) => {
    const { uid } = req.query;

    if (!uid) return Error(res, 400, 'Missing uid');

    try {
        const user = await prisma.user.findUnique({
            where: { uid: String(uid) },
            select: { userID: true, role: true }
        });

        if (!user) return Error(res, 404, 'User not found');

        if(user.role as 'colaborator' | 'admin' | 'support' === 'support') {
            const supportCalls = await prisma.supportCall.findMany({
                where: { userID: user.userID },
                select: { callID: true }
            });
            const callIDs = supportCalls.map(sc => sc.callID);
            const totalSupportCalls = callIDs.length;

            if (totalSupportCalls === 0) {
                return SendResponse(res, 200, {
                    totalSupportCalls: 0,
                    analyzedSupportCalls: 0,
                    solvedPercentage: 0,
                    positiveSentimentPercentage: 0
                });
            }

            // Get all call analyses for these callIDs
            const analyses = await prisma.callAnalysis.findMany({
                where: { callID: { in: callIDs } }
            });

            const analyzedSupportCalls = analyses.length;
            const solvedSupportCalls = analyses.filter((a: any) => a.solved === true).length;
            const positiveSentimentCalls = analyses.filter((a: any) => a.sentiment === 'positive' || a.finalSentiment === 'positive').length;

            const solvedPercentage = totalSupportCalls > 0 ? (solvedSupportCalls / totalSupportCalls) * 100 : 0;
            const positiveSentimentPercentage = totalSupportCalls > 0 ? (positiveSentimentCalls / totalSupportCalls) * 100 : 0;

            return SendResponse(res, 200, {
                totalSupportCalls,
                analyzedSupportCalls,
                solvedPercentage,
                positiveSentimentPercentage
            });
        }
        else {
            // Find all calls where user is a participant
            const callParticipants = await prisma.callParticipant.findMany({
                where: { userID: user.userID },
                select: { callID: true }
            });
            const callIDs = callParticipants.map(cp => cp.callID);

            // Find all projects where user participated in at least one call
            const projectIDsSet = new Set<number>();
            if (callIDs.length > 0) {
                const calls = await prisma.call.findMany({
                    where: { callID: { in: callIDs }, projectID: { not: null } },
                    select: { projectID: true }
                });
                calls.forEach(c => { if (c.projectID) projectIDsSet.add(c.projectID); });
            }
            const projectIDs = Array.from(projectIDsSet);

            // Get total and active projects
            let totalProjects = 0;
            let activeProjects = 0;

            if (projectIDs.length > 0) {
                const projects = await prisma.project.findMany({
                    where: { projectID: { in: projectIDs } },
                    select: { endDate: true }
                });
                totalProjects = projects.length;
                const now = new Date();
                activeProjects = projects.filter(p => !p.endDate || p.endDate > now).length;
            }

            // Get number of project calls analyzed
            let analyzedProjectCalls = 0;

            if (projectIDs.length > 0) {
                const projectCalls = await prisma.projectCall.findMany({
                    where: { projectID: { in: projectIDs } },
                    select: { callID: true }
                });
                const projectCallIDs = projectCalls.map(pc => pc.callID);
                if (projectCallIDs.length > 0) {
                    const analyzedCalls = await prisma.callAnalysis.findMany({
                        where: { callID: { in: projectCallIDs } }
                    });
                    analyzedProjectCalls = analyzedCalls.length;
                }
            }

            return SendResponse(res, 200, {
                totalProjects,
                activeProjects,
                analyzedProjectCalls
            });
        }
    } catch (err) {
        Error(res, 500, err);
    }
});

router.post('/log', async (req, res) => {
    const { uid, action } = req.body;

    const projectID = req.body.projectID || null;
    const projectCallID = req.body.projectCallID || null;
    const supportCallID = req.body.supportCallID || null;

    if (!uid || !action) return Error(res, 400, 'Missing uid or action');

    try {
        const user = await prisma.user.findUnique({
            where: { uid: String(uid) },
            select: { userID: true }
        });

        if (!user) return Error(res, 404, 'User not found');

        const activityLog = await prisma.activityLog.create({
            data: {
                userID: user.userID,
                action,
                projectID: projectID ? Number(projectID) : null,
                projectCallID: projectCallID ? Number(projectCallID) : null,
                supportCallID: supportCallID ? Number(supportCallID) : null,
                timestamp: new Date()
            }
        });

        return SendResponse(res, 201, activityLog);
    } catch (err) {
        Error(res, 500, err);
    }
})

export default router;
