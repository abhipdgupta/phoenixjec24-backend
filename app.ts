import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./src/connect";
import { UserModel } from "./src/models";
import cors from "cors";
import morgan from "morgan";
import { setjwt } from "./src/jwt";
import { EventsRouter, MemoriesRouter, OrganizerRouter } from "./src/routes";
const app: Express = express();
const port = process.env.PORT || 5000;

connectDB();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use("/",MemoriesRouter)
app.use("/",OrganizerRouter)
app.use("/",EventsRouter)


app.post("/login", async (req: Request, res: Response) => {
  const info: { displayName: string; email: string; photoURL: string } =
    req.body;

  const existUser = await UserModel.findOne({ email: info.email });
  let user;
  if (!existUser) {
    const newUser = new UserModel({
      email: info.email,
      display_name: info.displayName,
      profile_image: info.photoURL,
    });
    const savedUser = await newUser.save();
    user = savedUser;
  } else user = existUser;

  const token = await setjwt(user._id.toString());

  return res.status(200).json({
    data: {
      token: token,
      email: user.email,
      profile_image: user.profile_image,
      display_name: user.display_name,
      role:user.role
    },
    status_code: 200,
    message: `Login successfully`,
  });
});


app.all("/*", async (req: Request, res: Response) => {
  return res.status(400).json({
    data: null,
    message: `Request path ${req.path} with ${req.method} method doesn't exist`,
    status_code: 500,
  });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);

  return res.status(500).json({
    data: null,
    message: err.message || "Server side/Unhandled error",
    status_code: 500,
  });
});
