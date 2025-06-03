import { Router } from "express";

// UTILS
import { SendResponse, Error } from "../utils/ExpressUtils";
import prisma from "../utils/Prisma";

// TYPES
import { ProjectCreateRequest } from "../types/ProjectTypes";

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { userID, uid } = req.query;
    
    if (!userID && !uid) {
      return Error(res, 400, 'userID or uid is required');
    }

    const user = await prisma.user.findFirst({
      where: userID ? { userID: Number(userID) } : { uid: String(uid) },
      include: {
        userProjects: {
          include: { project: true }
        }
      }
    });

    if (!user) {
      return Error(res, 404, 'User not found');
    }

    const projects = user.userProjects.map(up => up.project);
    
    return SendResponse(res, 200, projects);
  } catch (err) {
    return Error(res, 500, 'Failed to fetch projects for user');
  }
});

router.post('/create', async (req, res) => {
  try {
    const {
      name,
      description,
      status,
      problemDescription,
      reqFuncionales,
      reqNoFuncionales,
      startDate,
      endDate
    } = req.body as ProjectCreateRequest;

    if (!name) {
      return Error(res, 400, 'Project name is required');
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status,
        problemDescription,
        reqFuncionales,
        reqNoFuncionales,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      }
    });

    return SendResponse(res, 201, project);
  } catch (err) {
    return Error(res, 500, 'Failed to create project');
  }
});

router.post('/update', async (req, res) => {
    try {
        const { projectID, name, description, status, problemDescription, reqFuncionales, reqNoFuncionales, startDate, endDate } = req.body;

        if (!projectID) {
            return Error(res, 400, 'projectID is required');
        }

        const project = await prisma.project.findUnique({
            where: { projectID: Number(projectID) }
        });

        if (!project) {
            return Error(res, 404, 'Project not found');
        }

        const updatedProject = await prisma.project.update({
            where: { projectID: Number(projectID) },
            data: {
                name,
                description,
                status,
                problemDescription,
                reqFuncionales,
                reqNoFuncionales,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            }
        });

        return SendResponse(res, 200, updatedProject);
    } catch (err) {
        return Error(res, 500, 'Failed to update project');
    }
})

router.post('/delete', async (req, res) => {
    try {
        const { projectID } = req.body;

        if (!projectID) {
            return Error(res, 400, 'projectID is required');
        }

        const project = await prisma.project.findUnique({
            where: { projectID: Number(projectID) }
        });

        if (!project) {
            return Error(res, 404, 'Project not found');
        }

        await prisma.project.delete({
            where: { projectID: Number(projectID) }
        });

        return SendResponse(res, 200, { message: 'Project deleted successfully' });
    } catch (err) {
        return Error(res, 500, 'Failed to delete project');
    }
})

router.post('/assign', async (req, res) => {
    try {
        const { userID, uid, projectID, role } = req.body;

        if ((!userID && !uid) || !projectID) {
            return Error(res, 400, 'userID or uid and projectID are required');
        }

        const user = await prisma.user.findFirst({
            where: userID ? { userID: Number(userID) } : { uid: String(uid) }
        });

        if (!user) {
            return Error(res, 404, 'User not found');
        }

        const existing = await prisma.userProject.findUnique({
            where: {
                userID_projectID: {
                    userID: user.userID,
                    projectID: Number(projectID)
                }
            }
        });

        if (existing) {
            return Error(res, 409, 'User is already assigned to this project');
        }

        const userProject = await prisma.userProject.create({
            data: {
                userID: user.userID,
                projectID: Number(projectID),
                role: role || undefined,
                joinedAt: new Date()
            }
        });
        return SendResponse(res, 201, userProject);
    } catch (err) {
        return Error(res, 500, 'Failed to assign user to project');
    }
});

router.post('/unassign', async (req, res) => {
    try {
        const { userID, uid, projectID } = req.body;

        if ((!userID && !uid) || !projectID) {
            return Error(res, 400, 'userID or uid and projectID are required');
        }

        const user = await prisma.user.findFirst({
            where: userID ? { userID: Number(userID) } : { uid: String(uid) }
        });

        if (!user) {
            return Error(res, 404, 'User not found');
        }

        const userProject = await prisma.userProject.findUnique({
            where: {
                userID_projectID: {
                    userID: user.userID,
                    projectID: Number(projectID)
                }
            }
        });

        if (!userProject) {
            return Error(res, 404, 'User is not assigned to this project');
        }

        await prisma.userProject.delete({
            where: {
                userID_projectID: {
                    userID: user.userID,
                    projectID: Number(projectID)
                }
            }
        });

        return SendResponse(res, 200, { message: 'User unassigned from project successfully' });
    } catch (err) {
        return Error(res, 500, 'Failed to unassign user from project');
    }
});

router.post('/updateRole', async (req, res) => {
    try {
        const { userID, uid, projectID, role } = req.body;

        if ((!userID && !uid) || !projectID || !role) {
            return Error(res, 400, 'userID or uid, projectID and role are required');
        }

        const user = await prisma.user.findFirst({
            where: userID ? { userID: Number(userID) } : { uid: String(uid) }
        });

        if (!user) {
            return Error(res, 404, 'User not found');
        }

        const userProject = await prisma.userProject.findUnique({
            where: {
                userID_projectID: {
                    userID: user.userID,
                    projectID: Number(projectID)
                }
            }
        });

        if (!userProject) {
            return Error(res, 404, 'User is not assigned to this project');
        }

        const updatedUserProject = await prisma.userProject.update({
            where: {
                userID_projectID: {
                    userID: user.userID,
                    projectID: Number(projectID)
                }
            },
            data: { role }
        });

        return SendResponse(res, 200, updatedUserProject);
    } catch (err) {
        return Error(res, 500, 'Failed to update user role in project');
    }
});

export default router;
