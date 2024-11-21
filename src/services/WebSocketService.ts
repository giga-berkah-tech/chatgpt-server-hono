import { ServerWebSocket } from "bun";
import { chatsOpenAi, checkTenantVerifyUser } from "../controllers/OpenAiController";

export const websocketOptions = {

    open: (ws: ServerWebSocket) => {
      console.log("WS => Client connected");
    },
    message: async(ws: ServerWebSocket, message: any) => {

      try {
        let messageData = JSON.parse(message)
        if (!messageData || !messageData.token || !messageData.tenant || !messageData.messages  || !messageData.uuid) {
          ws.send(JSON.stringify({ status: 422, message: "input invalid" }))
          console.log("WS error => input invalid")
          return;
        }
    
        // console.log("Message Received:",messageData)
        // let isvalid = await checkTenantVerifyUser(ws, messageData)
          if (! await checkTenantVerifyUser(ws, messageData)) {
            console.log("WS error =>", message)
            ws.send(JSON.stringify({ status: 401, message: "user not valid" }))
            ws.close();
            return;
          };
          chatsOpenAi(ws,messageData)
      } catch (error) {
        ws.send(JSON.stringify({ status: 500, message: "Connection Error" }))
        // ws.close();
        return;
      }
   
    },
    close: (ws: ServerWebSocket) => {
      console.log("WS => Client close/disconnected");
    },
  };