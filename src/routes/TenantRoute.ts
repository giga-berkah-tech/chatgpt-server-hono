//import hono
import { Hono } from 'hono';

//import controller
import { createTenant, deleteAllTenant, deleteTenantWithTenantKey, editTenant, getTenantData, getTenantDetail, getTenants } from '../controllers/TenantController';
import { failedResponse } from '../helpers/response_json';
import { checkIp } from '../controllers/AuthController';
import { checkValidToken } from '../services/AuthService';

//inistialize router
const router = new Hono().basePath('/tenant');

router.get('/', async(c) =>{
    if (!checkValidToken(c)) {
        return failedResponse(c, "Token not valid", 401)
    }
    if (!await checkIp(c)) {
        return failedResponse(c, "You are not allowed", 403)
    }
    return getTenants(c)
});

router.get('/:tenant_id', async(c) =>{
    if (!checkValidToken(c)) {
        return failedResponse(c, "Token not valid", 401)
    }
    if (!await checkIp(c)) {
        return failedResponse(c, "You are not allowed", 403)
    }
    return getTenantDetail(c)
});

router.get('/data/:tenant_id', async(c) =>{
    if (!await checkIp(c)) {
        return failedResponse(c, "You are not allowed", 403)
    }
    return getTenantData(c)
});

router.post('/', async(c) =>{
    if (!checkValidToken(c)) {
        return failedResponse(c, "Token not valid", 401)
    }
    if (!await checkIp(c)) {
        return failedResponse(c, "You are not allowed", 403)
    }
    return createTenant(c)
});
router.delete('/', async(c) =>{
    if (!checkValidToken(c)) {
        return failedResponse(c, "Token not valid", 401)
    }
    if (!await checkIp(c)) {
        return failedResponse(c, "You are not allowed", 403)
    }
    return deleteTenantWithTenantKey(c)
});
router.put('/', async(c) => {
    if (!checkValidToken(c)) {
        return failedResponse(c, "Token not valid", 401)
    }
    if (!await checkIp(c)) {
        return failedResponse(c, "You are not allowed", 403)
    }
    return editTenant(c)
});
router.delete('/all', async(c) => {
    if (!checkValidToken(c)) {
        return failedResponse(c, "Token not valid", 401)
    }
    if (!await checkIp(c)) {
        return failedResponse(c, "You are not allowed", 403)
    }
    return deleteAllTenant(c)
});

export const TenantRoutes = router;