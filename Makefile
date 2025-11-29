.PHONY: post-preview optimize-images convert-album

DRAFT_DIR = draft-preview
PUBLISH_DIR = publish
IMAGE_DIR = publish/images

optimize-images:
	@echo "Optimizing images in $(IMAGE_DIR)..."
	@node optimize-images.js $(IMAGE_DIR)
	@echo "Image optimization complete."

post-preview:
	@browser-sync start --server "$(PUBLISH_DIR)" --files "$(PUBLISH_DIR)/**/*" --directory --https --no-notify --cors

convert-album:
	@mkdir -p ./publish/images/album-wall
	@for file in ./publish/images/album/*_albumwall*.{jpg,jpeg,png,webp}; do \
		if [ -f "$$file" ]; then \
			filename=$$(basename "$$file"); \
			baseName=$${filename%.*}; \
			temp_avif="./publish/images/album-wall/$${baseName}.temp.avif"; \
			final_out="./publish/images/album-wall/$${baseName}.avif"; \
			\
			echo "Processing: $$filename"; \
			\
			ffmpeg -v error -i "$$file" -qscale 5 "$$temp_avif" -y; \
			\
			magick "$$temp_avif" \
				-dither FloydSteinberg \
				-monochrome \
				-define avif:lossless=true \
				-alpha set \
				-channel A \
				-evaluate set 80% \
				"$$final_out"; \
			\
			rm "$$temp_avif"; \
			\
			echo "  -> Output: $$final_out"; \
		fi; \
	done
	@echo "All conversions completed!"
