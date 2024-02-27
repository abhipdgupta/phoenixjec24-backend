import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import { TUPLOADFILE, getPresignedUrls } from "./src/aws";
import connectDB from "./src/connect";
import { UploadFileModel, UserModel } from "./src/models";
import cors from "cors";
import morgan from "morgan";
import { IAuthRequest, checkAuth } from "./src/middleware";
import { formatTime } from "./src/utils";
import { setjwt } from "./src/jwt";
const app: Express = express();
const port = process.env.PORT || 5000;

connectDB();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

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
    },
    status_code: 200,
    message: `Login successfully`,
  });
});

app.post(
  "/upload-image-presigned",
  checkAuth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as IAuthRequest).user;
      console.log(user);
      console.log(user?.restricted);

      if (
        (user?.restricted && user?.presigned_url_requested! > 10) ||
        user?.total_size_uploaded! > 10500000
      ) {
        return res.status(400).json({
          data: null,
          status_code: 400,
          message: `Exceeded maximum request.Contact Admin`,
        });
      }

      const { files }: { files: TUPLOADFILE[] } = req.body;

      if (files.length > 1 && files[0].file_size > 2097152) {
        return res.status(400).json({
          data: null,
          status_code: 400,
          message: "One file can be uploaded at a time and max size is 2MB",
        });
      }

      const folder = "memories";
      const data = await getPresignedUrls(files, folder);

      const USER = await UserModel.findOne({ email: user?.email });
      if (USER) {
        USER.presigned_url_requested += 1;
        USER.total_size_uploaded += files.reduce(
          (accumulator, currentValue) => accumulator + currentValue.file_size,
          0
        );

        await USER.save();
      }

      return res.status(200).json({
        data,
        status_code: 200,
        message: "Successfully generated presigned urls",
      });
    } catch (error: ErrorEvent | any) {
      console.log("ERROR IN /upload-image", error);
      return res.status(500).json({
        data: null,
        status_code: 500,
        message: error.message,
      });
    }
  }
);
app.post(
  "/save-image-detail",
  checkAuth,
  async (req: IAuthRequest, res: Response) => {
    try {
      const filesInfo: { file_name: string; key: string; image_url: string }[] =
        req.body;
      const uploadedEmail = req.user?.email;

      const upladedUserInfo = await UserModel.findOne({ email: uploadedEmail });

      const savedImageInfo = filesInfo.map((fileInfo) => {
        const info = {
          uploadedBy: upladedUserInfo?._id,
          file_name: fileInfo.file_name,
          key: fileInfo.key,
          url: fileInfo.image_url,
        };

        return info;
      });

      await UploadFileModel.insertMany(savedImageInfo);

      return res.status(200).json({
        data: null,
        status_code: 200,
        message: "Successfully saved to database",
      });
    } catch (error: ErrorEvent | any) {
      console.log("ERROR IN /save-image-detail", error);
      return res.status(500).json({
        data: null,
        status_code: 500,
        message: error.message,
      });
    }
  }
);
app.get("/image-details", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const skip = (page - 1) * limit;

    const images = await UploadFileModel.find({})
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("uploadedBy");

    const totalCount = await UploadFileModel.countDocuments();

    return res.status(200).json({
      data: images,
      status_code: 200,
      total_count: totalCount,
      current_page: page,
      total_pages: Math.ceil(totalCount / limit),
      message: "Images retrieved successfully",
    });
  } catch (error: ErrorEvent | any) {
    console.log("ERROR IN /images", error);
    return res.status(500).json({
      data: null,
      status_code: 500,
      message: error.message,
    });
  }
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
