//import hono
import { Hono } from 'hono';

//import controller
import { failedResponse } from '../helpers/response_json';
import { addIpAllowed, checkIp, removeIpAllowed } from '../controllers/AuthController';

//inistialize router
const router = new Hono().basePath('/auth');

router.post('/add', async(c) =>{
    if (await checkIp(c)) {
        return addIpAllowed(c)
    }else{
        return failedResponse(c,"You are not allowed",403)
    }
});

router.delete('/remove', async(c) =>{
    if (await checkIp(c)) {
        return removeIpAllowed(c)
    }else{
        return failedResponse(c,"You are not allowed",403)
    }
});


export const AuthRoutes = router;