import os
import pathlib
import subprocess
from concurrent.futures import ProcessPoolExecutor

def process_single_file(file_info):
    file, dest_dir = file_info
    filename = file.name
    baseName = file.stem
    temp_avif = pathlib.Path(dest_dir) / f"{baseName}.temp.avif"
    final_out = pathlib.Path(dest_dir) / f"{baseName}.avif"

    if final_out.exists():
        return f"跳过已存在: {filename}"

    try:
        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(file), "-qscale", "5", str(temp_avif), "-y"],
            check=True, capture_output=True
        )

        subprocess.run([
            "magick", str(temp_avif),
            "-resize", "25%", "-paint", "1.25", "-resize", "250%",
            "-define", "avif:lossless=true",
            str(final_out)
        ], check=True, capture_output=True)

        if temp_avif.exists():
            temp_avif.unlink()
        return f"完成: {filename}"

    except subprocess.CalledProcessError as e:
        if temp_avif.exists():
            temp_avif.unlink()
        return f"失败: {filename}, 错误: {e}"

def convert_images():
    source_dir = "./publish/images/album"
    dest_dir = "./publish/images/album-wall"
    os.makedirs(dest_dir, exist_ok=True)

    patterns = ["*_albumwall*.jpg", "*_albumwall*.jpeg", "*_albumwall*.png", "*_albumwall*.webp"]

    # 收集任务
    tasks = []
    source_path = pathlib.Path(source_dir)
    for pattern in patterns:
        for file in source_path.glob(pattern):
            if file.is_file():
                tasks.append((file, dest_dir))

    print(f"开始并行处理 {len(tasks)} 张图片...")

    # 使用进程池并行执行 (默认进程数为 CPU 核心数)
    with ProcessPoolExecutor(5) as executor:
        results = list(executor.map(process_single_file, tasks))

    for res in results:
        print(res)

    print("所有转换完成!")

if __name__ == "__main__":
    convert_images()
