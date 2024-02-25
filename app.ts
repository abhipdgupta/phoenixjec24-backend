import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import { TUPLOADFILE, getPresignedUrls } from "./src/aws";
import connectDB from "./src/connect";
import { UploadFileModel } from "./src/models";
import cors from "cors";
const app: Express = express();
const port = process.env.PORT || 5000;

connectDB();

app.use(express.json());
app.use(cors());

app.post("/upload-image-presigned", async (req: Request, res: Response) => {
  try {
    const { files }: { files: TUPLOADFILE[] } = req.body;

    const folder = "memories";
    const data = await getPresignedUrls(files, folder);
    return res.status(200).json({
      data,
      status_code: 200,
      message: "Successfully generated presigned urls",
    });
  } catch (error: ErrorEvent | any) {
    console.log("ERROR IN /upload-image");
    return res.status(500).json({
      data: null,
      status_code: 500,
      message: error.message,
    });
  }
});
app.post("/save-image-detail", async (req: Request, res: Response) => {
  try {
    const filesInfo: { file_name: string; key: string; image_url: string }[] =
      req.body;
    const uploadedBy = "abhi"; // change

    const savedImageInfo = filesInfo.map((fileInfo) => {
      const info = {
        uploadedBy,
        file_name: fileInfo.file_name,
        key: fileInfo.key,
        url: fileInfo.image_url,
      };

      return info;
    });

    // Wait for all promises to resolve
    // const savedImageInfo = await Promise.all(savedImageInfo);
    console.log(savedImageInfo);

    await UploadFileModel.insertMany(savedImageInfo);

    return res.status(200).json({
      data: null,
      status_code: 200,
      message: "Successfully saved to database",
    });
  } catch (error: ErrorEvent | any) {
    console.log("ERROR IN /save-image-detail");
    return res.status(500).json({
      data: null,
      status_code: 500,
      message: error.message,
    });
  }
});
app.get("/image-details", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const skip = (page - 1) * limit;

    const images = await UploadFileModel.find({})
      .skip(skip)
      .limit(limit);

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

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
