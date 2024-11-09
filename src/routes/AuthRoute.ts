//import hono
import { Hono } from 'hono';

//import controller
import { failedResponse } from '../helpers/response_json';
import { addIpAllowed, checkIp, getListIp, getMyIp, removeIpAllowed } from '../controllers/AuthController';

//inistialize router
const router = new Hono().basePath('/auth');

router.post('/add', async(c) =>{
    return addIpAllowed(c)
});

router.delete('/remove', async(c) =>{
    return removeIpAllowed(c)
});

router.get('/list', async(c) =>{
    return getListIp(c)
});

router.get('/my-ip', async(c) =>{
    return getMyIp(c)
});


export const AuthRoutes = router;