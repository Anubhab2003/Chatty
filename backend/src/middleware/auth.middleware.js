import jwt from "jsonwebtoken"
import User from "../models/user.model.js"

export const protectRoute=async(req,res,next)=>{
    try{
        const token=req.cookies.jwt
        if(!token){
            return res.status(401).json({message:"Unauthorized No token provided"});
        }

        const decorded=jwt.verify(token,process.env.JWT_SECRET)
        if(!decorded){
            return res.status(401).json({message:"Token is  Invalid"});
        }

        const user=await User.findById(decorded.userId).select("-password")
        if(!user){
            return res.status(404).json({message:"No user found"})
        }
        req.user=user

        next()
    }catch(error){
        return res.status(500).json({message:"Its on our end"});
    }

}