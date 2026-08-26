import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { signupSchema, signinSchema } from "../validation/authValidation.js";
import prisma from "../../PrismaClient.js";

dotenv.config();

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const signup = async (req, res) => {
  const result = signupSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error,
    });
  }

  const { email, password, phone, userType } = result.data;

  try {
    const userExist = await prisma.user.findUnique({
      where: { email },
    });

    if (userExist) {
      return res.status(409).json({
        success: false,
        message: "User already exists, please signin",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        userType,
        phone,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        userType: true,
        createdAt: true,
      },
    });

    
    const token = generateToken(newUser);

    return res.cookie("token", token, cookieOptions).json({
      success: true,
      message: "Signup successfully",
      data: newUser,
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const signin = async (req, res) => {
  const result = signinSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error,
    });
  }

  const { email, password } = result.data;

  try {
    const userExist = await prisma.user.findUnique({
      where: { email },
    });

   
    if (!userExist) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please signup",
      });
    }

    const matchPassword = await bcrypt.compare(password, userExist.password);

    if (!matchPassword) {
      return res.status(401).json({
        success: false,
        message: "Wrong password",
      });
    }

    const token = generateToken(userExist);


    return res.cookie("token", token, cookieOptions).json({
      success: true,
      message: "Signin successfully",
      data: {
        token,
        id: userExist.id,
        email: userExist.email,
        userType: userExist.userType,
      },
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};