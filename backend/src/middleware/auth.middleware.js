import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import {ENV} from "../lib//env.js"

export const protectRoute=async (req,res,next) => {
    try {
        const token =req.cookie.jwt
        if(!token) return res.status(401).json({message:'Unauth - No tokens provided'})

            const decoded =jwt.verify(token,ENV.JWT_SECRET)
            if(!decoded) return res.status(401).json({message:'Unauth - Invalid tokens provided'})

                const user =await User.findById(decoded.userId).select('-password')
                if(!user) res.status(401).json({message:'User not found'})

                    req.user=user
                    next()




    } catch (error) {
        console.error('Error in protectRoute middleware');
        res.status(500).json({message:'Internal server error'})

    }
}