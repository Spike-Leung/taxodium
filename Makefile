.PHONY: draft-preview post-preview

DRAFT_DIR = draft-preview
PUBLISH_DIR = publish
ASSETS = styles js images fonts

draft-preview:
	@mkdir -p $(DRAFT_DIR)
	@for asset in $(ASSETS); do \
		ln -sf ../$(PUBLISH_DIR)/$$asset $(DRAFT_DIR)/$$asset; \
	done
	@browser-sync start --server "$(DRAFT_DIR)" --files "$(DRAFT_DIR)/**/*" --directory
post-preview:
	@browser-sync start --server "$(PUBLISH_DIR)" --files "$(PUBLISH_DIR)/**/*" --directory
