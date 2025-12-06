import os
import pathlib
import subprocess
import sys

def convert_images():
    # 设置目录和模式
    source_dir = "./publish/images/album"
    dest_dir = "./publish/images/album-wall"
    os.makedirs(dest_dir, exist_ok=True)

    patterns = [
        "*_albumwall*.jpg",
        "*_albumwall*.jpeg",
        "*_albumwall*.png",
        "*_albumwall*.webp"
    ]

    print("开始处理图片转换...")

    # 遍历所有模式
    for pattern in patterns:
        source_path = pathlib.Path(source_dir)
        for file in source_path.glob(pattern):
            if not file.is_file():
                continue

            filename = file.name
            baseName = file.stem
            temp_avif = pathlib.Path(dest_dir) / f"{baseName}.temp.avif"
            final_out = pathlib.Path(dest_dir) / f"{baseName}.avif"

            # 检查最终文件是否已存在
            if final_out.exists():
                print(f"跳过已存在文件: {filename}")
                continue

            print(f"正在处理: {filename}")

            # 转换为临时AVIF文件
            try:
                subprocess.run(
                    ["ffmpeg", "-v", "error", "-i", str(file), "-qscale", "5", str(temp_avif), "-y"],
                    check=True,
                    capture_output=True
                )
            except subprocess.CalledProcessError:
                print(f"  -> ffmpeg转换失败: {filename}")
                if temp_avif.exists():
                    temp_avif.unlink()
                continue

            # 应用ImageMagick处理
            try:
                subprocess.run([
                    "magick", str(temp_avif),
                    "-colors", "6",
                    "-monochrome",
                    "-define", "avif:lossless=true",
                    "-alpha", "set",
                    "-channel", "A",
                    "-evaluate", "set", "75%",
                    str(final_out)
                ], check=True, capture_output=True)
            except subprocess.CalledProcessError:
                print(f"  -> ImageMagick处理失败: {filename}")
                if temp_avif.exists():
                    temp_avif.unlink()
                if final_out.exists():
                    final_out.unlink()
                continue

            # 清理临时文件
            if temp_avif.exists():
                temp_avif.unlink()
                print(f"  -> 输出: {final_out}")

    print("所有转换完成!")

if __name__ == "__main__":
    convert_images()
