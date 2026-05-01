import axios from "axios";
import { redirect } from "next/navigation";
import { isDesktopApp } from "./isdesktop";

const apiClient = axios.create({
    baseURL:process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    withCredentials:true,
    headers:{
        "Content-Type":"application/json"
    }
})



//global error handler when unauthenticated
apiClient.interceptors.response.use(
    (response)=>response,
    (error)=>{
        if(error.response?.status === 401){
            // On desktop, don't redirect — cloud API calls may fail
            // because session cookies aren't available cross-origin.
            // The app works fine with just the local SQLite DB.
            if (!isDesktopApp()) {
                redirect("/sign-in")
            }
        }
        return Promise.reject(error)
    }
)

export default apiClient