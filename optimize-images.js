/**
 * prerequies:  brew install jpegoptim optipng webp
 */
import { exec } from "child_process";
import { glob } from 'glob';

async function optimizeImages(directory) {
  console.log(`Searching for images in ${directory}...`);

  const files = await glob(`${directory}/**/*.{jpg,jpeg,png}`);

  if (files.length === 0) {
    console.log("No images found to optimize.");
    return;
  }

  console.log(`Found ${files.length} images. Starting optimization...`);

  for (const file of files) {
    let command;
    if (/\.(jpe?g)$/i.test(file)) {
      command = `jpegoptim --strip-all --all-progressive "${file}"`;
    } else if (/\.png$/i.test(file)) {
      command = `optipng -o7 -strip all "${file}"`;
    }

    if (command) {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error optimizing ${file}: ${stderr}`);
          return;
        }
        console.log(`Optimized: ${file}`);
      });
    }
  }
}

const imageDir = process.argv[2] || 'images';
optimizeImages(imageDir);
