.PHONY: draft-preview post-preview

DRAFT_DIR = draft-preview
PUBLISH_DIR = publish

post-preview:
	@browser-sync start --server "$(PUBLISH_DIR)" --files "$(PUBLISH_DIR)/**/*" --directory --https --no-notify --cors
