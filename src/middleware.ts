import { NextFunction, Request, Response } from "express";
import { SECRET } from "./jwt";
import { TUserModel, UserModel } from "./models";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongoose";

export interface IAuthRequest extends Request {
  user?: TUserModel;
}

export const checkAuth = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        data: null,
        message: "Authorization token is missing",
        status_code: 401,
      });
    }

    const decoded = jwt.verify(token, SECRET) as { id: ObjectId };
    const userId = decoded.id;

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        data: null,
        message: "User not found",
        status_code: 404,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    return res
      .status(401)
      .json({ data: null, message: "Authentication failed", status_code: 401 });
  }
};
