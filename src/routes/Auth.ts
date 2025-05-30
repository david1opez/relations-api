import { Router } from "express";

// UTILS
import { SendResponse, Error } from "../utils/ExpressUtils";

// TYPES
import { MicrosoftAuthResponse, MicrosoftProfile, MicrosoftErrorResponse } from "../types/MicrosoftTypes";

const router = Router();

router.post('/', async (req, res) => {
    const code = req.query?.code as string;

    if(!code) {
        return Error(res, 400, 'Missing code query parameter');
    };

    try {
        await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: process.env.MSFT_CLIENT_ID || '',
                scope: 'openid profile User.Read',
                code: code,
                redirect_uri: process.env.MSFT_REDIRECT_URI || '',
                grant_type: 'authorization_code',
                client_secret: process.env.MSFT_CLIENT_SECRET || '' 
            })
        })
        .then(response => response.json())
        .then((data: MicrosoftAuthResponse | MicrosoftErrorResponse) => {
            if (!('access_token' in data)) {
                return Error(res, 400, (data as MicrosoftErrorResponse));
            }

            fetch("https://graph.microsoft.com/v1.0/me", {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${data.access_token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then((profile: MicrosoftProfile) => {
                SendResponse(res, 200, { profile, tokens: data });
            })
            .catch(err => Error(res, 400, err));
        })
        .catch(err => Error(res, 400, err));
    } catch (err) {
        Error(res, 500, err);
    }
});

export default router;
