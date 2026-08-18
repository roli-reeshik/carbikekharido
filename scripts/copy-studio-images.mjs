import fs from "fs";
import path from "path";

const artifactDir = "C:\\Users\\user\\.gemini\\antigravity\\brain\\9102bbe6-0fa7-485e-ae98-cfa9d978b6d2";
const targetDir = path.resolve("public/assets/vehicles");

const files = fs.readdirSync(artifactDir);
const ferrariImg = files.find(f => f.startsWith("ferrari_sf90_studio") && f.endsWith(".jpg"));
const ducatiImg = files.find(f => f.startsWith("ducati_v4r_studio") && f.endsWith(".jpg"));

if (ferrariImg) {
  fs.copyFileSync(path.join(artifactDir, ferrariImg), path.join(targetDir, "ferrari-sf90.jpg"));
  fs.copyFileSync(path.join(artifactDir, ferrariImg), path.join(targetDir, "ferrari-sf90.png"));
  console.log("Copied Ferrari studio image to public/assets/vehicles/ferrari-sf90.jpg & .png");
}

if (ducatiImg) {
  fs.copyFileSync(path.join(artifactDir, ducatiImg), path.join(targetDir, "ducati-v4r.jpg"));
  fs.copyFileSync(path.join(artifactDir, ducatiImg), path.join(targetDir, "ducati-v4r.png"));
  console.log("Copied Ducati studio image to public/assets/vehicles/ducati-v4r.jpg & .png");
}
