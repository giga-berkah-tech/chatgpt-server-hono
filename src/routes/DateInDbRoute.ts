//import hono
import { Hono } from 'hono';
import { checkIp } from '../controllers/AuthController';
import { failedResponse } from '../helpers/response_json';
import { getDateInDb, updateDateNow } from '../controllers/DateInDbController';

//inistialize router
const router = new Hono().basePath('/date');

router.get('/', async(c) =>{
    // if (!await checkIp(c)) {
    //     return failedResponse(c, "You are not allowed", 403)
    // }
    return getDateInDb(c)
});

router.put('/update', async(c) =>{
    return updateDateNow(c)
});

export const DateInDbRoutes = router;