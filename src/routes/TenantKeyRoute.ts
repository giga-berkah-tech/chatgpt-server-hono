//import hono
import { Hono } from 'hono';

//import controller
import { failedResponse } from '../helpers/response_json';
import { checkIp } from '../controllers/AuthController';
import { getTenantKey } from '../controllers/TenantKeyController';
import { checkValidToken } from '../services/AuthService';

//inistialize router
const router = new Hono().basePath('/tenant-key');

router.get('/', async(c) =>{
    if (!checkValidToken(c)) {
        return failedResponse(c, "Token not valid", 401)
    }
    if (!await checkIp(c)) {
        return failedResponse(c, "You are not allowed", 403)
    }
    return getTenantKey(c)
});

export const TenantKeyRoutes = router;