import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";


export const authClient = createAuthClient({
    baseURL:process.env.NODE_ENV === "production" ? "https://api.pslmp.foldex.space" : "http://localhost:3000",
    plugins:[
        emailOTPClient()
    ]
})

//not needed you can access this using the authclient. this is for convience
export const {useSession,signOut}=authClient;