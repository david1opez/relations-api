export type ProjectCreateRequest = {
    name: string;
    description?: string;
    status?: string;
    problemDescription?: string;
    reqFuncionales?: string;
    reqNoFuncionales?: string;
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
}