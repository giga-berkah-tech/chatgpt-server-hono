//import hono
import { Hono } from 'hono';

//import controller
import { createTenant, deleteTenantWithTenantKey, editTenant, getTenant } from '../controllers/TenantController';
import { failedResponse } from '../helpers/response_json';
import { checkIp } from '../controllers/AuthController';

//inistialize router
const router = new Hono()

router.get('/tenant', async(c) =>{
    if (await checkIp(c)) {
        return getTenant(c)
    }else{
        return failedResponse(c,"You are not allowed",403)
    }
});

router.post('/tenant', async(c) =>{
    if (await checkIp(c)) {
        return createTenant(c)
    }else{
        return failedResponse(c,"You are not allowed",403)
    }
});
router.delete('/tenant', async(c) =>{
    if (await checkIp(c)) {
        return deleteTenantWithTenantKey(c)
    }else{
        return failedResponse(c,"You are not allowed",403)
    }
});
router.put('/tenant', async(c) => {
    if (await checkIp(c)) {
        return  editTenant(c)
    }else{
        return failedResponse(c,"You are not allowed",403)
    }
});

export const OpenAiRoutes = router;