import express, { Response } from "express";
import {
  IAuthRequest,
  adminRequired,
  checkAuth,
  validUserRequired,
} from "./middleware";
import { TUPLOADFILE, getPresignedUrls } from "./aws";
import {
  EventsModel,
  OrganizerModel,
  UploadImageModel,
  UserModel,
} from "./models";
const MemoriesRouter = express.Router();
const EventsRouter = express.Router();
const OrganizerRouter = express.Router();

MemoriesRouter.post(
  "/upload-image-presigned",
  validUserRequired,
  async (req: IAuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (
        user?.restricted &&
        (user?.presigned_url_requested! > 10 ||
          user?.total_size_uploaded! > 10500000)
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
)
  .post(
    "/save-image-detail",
    validUserRequired,
    async (req: IAuthRequest, res: Response) => {
      try {
        console.log(req.body);

        const filesInfo: {
          file_name: string;
          key: string;
          image_url: string;
          width: number;
          height: number;
        }[] = req.body;
        const uploadedEmail = req.user?.email;

        const upladedUserInfo = await UserModel.findOne({
          email: uploadedEmail,
        });

        const savedImageInfo = filesInfo.map((fileInfo) => {
          const info = {
            uploadedBy: upladedUserInfo?._id,
            file_name: fileInfo.file_name,
            key: fileInfo.key,
            url: fileInfo.image_url,
            width: fileInfo.width,
            height: fileInfo.height,
          };

          return info;
        });

        await UploadImageModel.insertMany(savedImageInfo);

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
  )
  .get(
    "/image-details",
    checkAuth,
    async (req: IAuthRequest, res: Response) => {
      try {
        const user = req.user;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 15;
        const skip = (page - 1) * limit;

        let query: any = {};
        if (user && (user.role === "ADMIN" || user.role === "MODERATOR")) {
          query = {};
        } else if (user && user.role === "USER") {
          query = { isApproved: true };
        }
        const images = await UploadImageModel.find(query)
          .sort({ _id: -1 })
          .skip(skip)
          .limit(limit)
          .populate("uploadedBy");

        const totalCount = await UploadImageModel.countDocuments();

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
    }
  );

OrganizerRouter.post(
  "/organizer",
  adminRequired,
  async (req: IAuthRequest, res: Response) => {
    try {
      const { name, description } = req.body;
      const organizer = await OrganizerModel.create({ name, description });
      return res.status(201).json(organizer);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
)
  .get("/organizer", async (_req: IAuthRequest, res: Response) => {
    try {
      const organizers = await OrganizerModel.find();
      return res.status(200).json(organizers);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  })
  .get("/organizer/:id", async (req: IAuthRequest, res: Response) => {
    try {
      const organizer = await OrganizerModel.findById(req.params.id);
      if (!organizer) {
        return res.status(404).json({ error: "Organizer not found" });
      }
      return res.status(200).json(organizer);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  })
  .put(
    "/organizer/:id",
    adminRequired,
    async (req: IAuthRequest, res: Response) => {
      try {
        const { name, description } = req.body;
        const updatedOrganizer = await OrganizerModel.findByIdAndUpdate(
          req.params.id,
          { name, description },
          { new: true }
        );
        if (!updatedOrganizer) {
          return res.status(404).json({ error: "Organizer not found" });
        }
        return res.status(200).json(updatedOrganizer);
      } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
      }
    }
  )
  .delete(
    "/organizer/:id",
    adminRequired,
    async (req: IAuthRequest, res: Response) => {
      try {
        const deletedOrganizer = await OrganizerModel.findByIdAndDelete(
          req.params.id
        );
        if (!deletedOrganizer) {
          return res.status(404).json({ error: "Organizer not found" });
        }
        return res.status(204).send();
      } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );

EventsRouter.post(
  "/events",
  adminRequired,
  async (req: IAuthRequest, res: Response) => {
    try {
      const { name, date, organizedBy, description, image } = req.body;
      const event = await EventsModel.create({
        name,
        date,
        organizedBy,
        description,
        image,
      });
      return res.status(201).json(event);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
)
  .get("/events", async (_req: IAuthRequest, res: Response) => {
    try {
      const events = await EventsModel.find();
      return res.status(200).json(events);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  })
  .get("/events/:id", async (req: IAuthRequest, res: Response) => {
    try {
      const event = await EventsModel.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      return res.status(200).json(event);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  })
  .put(
    "/events/:id",
    adminRequired,
    async (req: IAuthRequest, res: Response) => {
      try {
        const { name, date, organizedBy, description, image } = req.body;
        const updatedEvent = await EventsModel.findByIdAndUpdate(
          req.params.id,
          { name, date, organizedBy, description, image },
          { new: true }
        );
        if (!updatedEvent) {
          return res.status(404).json({ error: "Event not found" });
        }
        return res.status(200).json(updatedEvent);
      } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
      }
    }
  )
  .delete(
    "/events/:id",
    adminRequired,
    async (req: IAuthRequest, res: Response) => {
      try {
        const deletedEvent = await EventsModel.findByIdAndDelete(req.params.id);
        if (!deletedEvent) {
          return res.status(404).json({ error: "Event not found" });
        }
        return res.status(204).send();
      } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );

export { MemoriesRouter, EventsRouter, OrganizerRouter };
