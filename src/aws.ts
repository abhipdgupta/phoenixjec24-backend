import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import mime from "mime-types";
const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

export type TUPLOADFILE = {
  file_name: string;
};
export const getPresignedUrls = async (files: TUPLOADFILE[], folder: string) => {
  const promises = files.map(async (file) => {
    const mimeType = mime.lookup(file.file_name);
    if (mimeType === false || !mimeType.startsWith("image/")) return null;

    const location = `${folder}/${Date.now()}-${file.file_name}`;
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET!,
      Key: location,
      ContentType: "image/*",
      ACL: "public-read",
    });

    const put_pre_signed_url = await getSignedUrl(s3Client, command, {
      expiresIn: 60 * 5,
    });
    const data = {
      pre_signed_url: put_pre_signed_url,
      image_url: `${process.env.AWS_FILE_LOCATION_BASE_URL!}/${location}`,
      file_name: file.file_name,
    };
    console.log(data);
    
    return data;
  });

  return await Promise.all(promises);
};
