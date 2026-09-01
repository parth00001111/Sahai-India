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
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const signup = async (req, res) => {
  
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error,
    });
  }

  const email = result.data.email.trim().toLowerCase();
  const { password, phone, inviteToken } = result.data;
  let userType = result.data.userType;

  try {
    let invitation = null;
    if (inviteToken) {
      invitation = await prisma.orgInvitation.findUnique({
        where: { token: inviteToken },
      });

      if (!invitation || invitation.status !== "pending" || invitation.expiresAt <= new Date()) {
        return res.status(410).json({
          success: false,
          message: "This organisation invitation is invalid or has expired",
        });
      }

      if (invitation.email.toLowerCase() !== email) {
        return res.status(400).json({
          success: false,
          message: "Use the email address that received this organisation invitation",
        });
      }

      userType = "org_staff";
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
      select: {
        email: true,
        phone: true,
      },
    });

    if (existingUser) {
      const duplicateField = existingUser.email === email ? "email" : "phone";

      return res.status(409).json({
        success: false,
        field: duplicateField,
        message:
          duplicateField === "email"
            ? "An account with this email already exists. Please sign in."
            : "This mobile number is already registered. Please sign in or use another number.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { email, password: hashedPassword, userType, phone },
        select: {
          id: true,
          email: true,
          phone: true,
          userType: true,
          createdAt: true,
        },
      });

      if (invitation) {
        await tx.orgMember.create({
          data: {
            orgId: invitation.orgId,
            userId: createdUser.id,
            role: invitation.role,
          },
        });
        await tx.orgInvitation.update({
          where: { id: invitation.id },
          data: { status: "accepted", acceptedAt: new Date() },
        });
      }

      return createdUser;
    });

    
    const token = generateToken(newUser);

    return res.status(201).cookie("token", token, cookieOptions).json({
      success: true,
      message: invitation ? "Account created and organisation invitation accepted" : "Signup successfully",
      data: newUser,
    });
  } catch (err) {
    // The pre-check above improves the common response, while this also covers
    // two signup requests racing each other before either insert completes.
    if (err?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "An account with this email or mobile number already exists. Please sign in.",
      });
    }

    console.error("Signup failed:", err);
    return res.status(500).json({
      success: false,
      message: "We could not create your account right now. Please try again shortly.",
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

  const email = result.data.email.trim().toLowerCase();
  const { password } = result.data;

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
