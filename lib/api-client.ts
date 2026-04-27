import axios from "axios";
import { redirect } from "next/navigation";

const apiClient = axios.create({
    baseURL:process.env.NODE_ENV === "production" ? "https://api.pslmp.foldex.space" : "http://localhost:3000",
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
            redirect("/sign-in")
        }
        return Promise.reject(error)
    }
)

export default apiClient