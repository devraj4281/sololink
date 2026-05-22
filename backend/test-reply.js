import mongoose from "mongoose";

const id = "123";
try {
  const objId = new mongoose.Types.ObjectId(id);
  console.log("Success", objId);
} catch (err) {
  console.log("Error", err.message);
}
