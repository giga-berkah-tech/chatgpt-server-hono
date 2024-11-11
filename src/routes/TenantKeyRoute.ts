//import hono
import { Hono } from 'hono';

//import controller
import { failedResponse } from '../helpers/response_json';
import { checkIp } from '../controllers/AuthController';
import { getTenantKey } from '../controllers/TenantKeyController';

//inistialize router
const router = new Hono().basePath('/tenant-key');

router.get('/', async(c) =>{
    if (await checkIp(c)) {
        return getTenantKey(c)
    }else{
        return failedResponse(c,"You are not allowed",403)
    }
});

export const TenantKeyRoutes = router;