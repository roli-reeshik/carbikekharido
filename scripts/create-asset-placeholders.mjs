import fs from "fs";
import path from "path";

// A minimal valid 1-frame MP4 / dummy binary to satisfy video element loader
// without 404s until user provides their Google Veo 4k renders
const dummyMp4Buffer = Buffer.from([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
  0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
  0x6d, 0x70, 0x34, 0x31, 0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65
]);

const targetDir = path.resolve("public/assets");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(path.join(targetDir, "hero-car.mp4"), dummyMp4Buffer);
fs.writeFileSync(path.join(targetDir, "hero-bike.mp4"), dummyMp4Buffer);

console.log("Placeholder video files generated at public/assets/");
