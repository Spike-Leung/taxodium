.PHONY: post-preview optimize-images

DRAFT_DIR = draft-preview
PUBLISH_DIR = publish
IMAGE_DIR = publish/images

optimize-images:
	@echo "Optimizing images in $(IMAGE_DIR)..."
	@node optimize-images.js $(IMAGE_DIR)
	@echo "Image optimization complete."

post-preview:
	@browser-sync start --server "$(PUBLISH_DIR)" --files "$(PUBLISH_DIR)/**/*" --directory --https --no-notify --cors
