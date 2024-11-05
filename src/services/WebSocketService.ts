import { ServerWebSocket } from "bun";
import { chatsOpenAi, checkTenantVerifyUser } from "../controllers/OpenAiController";

export const websocketOptions = {

    open: (ws: ServerWebSocket) => {
      console.log("Client connected");
    },
    message: async(ws: ServerWebSocket, message: any) => {
    let messageData = JSON.parse(message)
    if (!messageData || !messageData.token || !messageData.tenant || !messageData.messages  || !messageData.uuid) {
      console.log("Message invalid:", message)
      return;
    }

    console.log("Message Received:",messageData)
    // let isvalid = await checkTenantVerifyUser(ws, messageData)
      if (! await checkTenantVerifyUser(ws, messageData)) {
        ws.send(JSON.stringify({ status: 401, message: "user not valid" }))
        ws.close();
        return;
      };
      chatsOpenAi(ws,messageData)
    },
    close: (ws: ServerWebSocket) => {
      console.log("Client disconnected");
    },
  };