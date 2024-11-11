//import hono
import { Hono } from 'hono';

//import controller
import { createTenant, deleteTenantWithTenantKey, editTenant, getTenantDetail, getTenants } from '../controllers/TenantController';
import { failedResponse } from '../helpers/response_json';
import { checkIp } from '../controllers/AuthController';

//inistialize router
const router = new Hono().basePath('/tenant');

router.get('/', async(c) =>{
    if (await checkIp(c)) {
        return getTenants(c)
    }else{
        return failedResponse(c,"You are not allowed",403)
    }
});

router.get('/:tenant_id', async(c) =>{
    if (await checkIp(c)) {
        return getTenantDetail(c)
    }else{
        return failedResponse(c,"You are not allowed",403)
    }
});

router.post('/', async(c) =>{
    if (await checkIp(c)) {
        return createTenant(c)
    }else{
        return failedResponse(c,"You are not allowed",403)
    }
});
router.delete('/', async(c) =>{
    if (await checkIp(c)) {
        return deleteTenantWithTenantKey(c)
    }else{
        return failedResponse(c,"You are not allowed",403)
    }
});
router.put('/', async(c) => {
    if (await checkIp(c)) {
        return  editTenant(c)
    }else{
        return failedResponse(c,"You are not allowed",403)
    }
});

export const TenantRoutes = router;