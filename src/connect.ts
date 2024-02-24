import mongoose from "mongoose";

const mongoURI = process.env.MONGODB_URI;

const connectDB = async () => {
  mongoose
    .connect(mongoURI!)
    .then(() => {
      console.log("MONGODB DATABASE CONNECTED");
    })
    .catch((err) => {
      console.log(`err: ${err}`);
      process.exit(1)
    });
};

export default connectDB;
