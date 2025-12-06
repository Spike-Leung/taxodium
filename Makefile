.PHONY: post-preview convert-album

DRAFT_DIR = draft-preview
PUBLISH_DIR = publish
IMAGE_DIR = publish/images

post-preview:
	@browser-sync start --server "$(PUBLISH_DIR)" --files "$(PUBLISH_DIR)/**/*" --directory --https --no-notify --cors

convert-album:
	@python3 ./scripts/generate-album-wall.py
