export type MicrosoftAuthResponse = {
    access_token: string;
    expires_in: number;
    ext_expires_in: number;
    id_token: string;
    scope: string;
    token_type: string;
}

export type MicrosoftProfile = {
    "@odata.context": string;
    userPrincipalName: string;
    id: string;
    displayName: string;
    surname: string;
    givenName: string;
    preferredLanguage: string;
    mail: string | null;
    mobilePhone: string | null;
    jobTitle: string | null;
    officeLocation: string | null;
    businessPhones: string[];
}

export type MicrosoftErrorResponse = {
    error: string;
    error_description: string;
    error_codes: number[];
    timestamp: string;
    trace_id: string;
    correlation_id: string;
}