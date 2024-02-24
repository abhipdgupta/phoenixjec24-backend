import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import { TUPLOADFILE, getPresignedUrls } from "./src/aws";
import connectDB from "./src/connect";
import { UploadFileModel } from "./src/models";
const app: Express = express();
const port = process.env.PORT || 3000;

connectDB();

app.use(express.json());

app.post("/upload-image", async (req: Request, res: Response) => {
  try {
    const { files }: { files: TUPLOADFILE[] } = req.body;

    const folder = "memories";
    const data = await getPresignedUrls(files, folder);
    res.status(200).json({
      data,
      status_code: 200,
      message: "Successfully generated presigned urls",
    });
  } catch (error: ErrorEvent | any) {
    console.log("ERROR IN /upload-image");
    res.status(500).json({
      data: null,
      status_code: 500,
      message: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
