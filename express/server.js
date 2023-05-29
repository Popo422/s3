import express from "express";

import multer from "multer";
import sharp from "sharp";
import crypto from "crypto";

import { PrismaClient } from "@prisma/client";
import { uploadFile, deleteFile, getObjectSignedUrl } from "./s3.js";
import { addPicture,getPosts } from "./dataIntegration/ddb.js";

const app = express();
const prisma = new PrismaClient();
const date = new Date()
const timestamp = date.toISOString()
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

app.get("/api/posts", async (req, res) => {
  const posts = await getPosts();
  for (let post of posts) {
    post.imageUrl = await getObjectSignedUrl(post.id);
  }
  res.send(posts);
});

app.post("/api/posts", upload.single("image"), async (req, res) => {
  const file = req.file;
  const caption = req.body.caption;
  const imageName = generateFileName();

  const fileBuffer = await sharp(file.buffer)
    .resize({ height: 1920, width: 1080, fit: "contain" })
    .toBuffer();

  await uploadFile(fileBuffer, imageName, file.mimetype);
  const post = await addPicture(
    imageName,
    req.file.originalname,
    caption,
    timestamp
  );

  res.status(201).send(post);
});

app.delete("/api/posts/:id", async (req, res) => {
  const id = req.params.id;
  const post = await prisma.posts.findUnique({ where: { id } });

  await deleteFile(post.imageName);

  await prisma.posts.delete({ where: { id: post.id } });
  res.send(post);
});

app.listen(8080, () => console.log("listening on port 8080"));
