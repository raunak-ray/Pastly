CREATE TABLE "tbl_pastes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"title" varchar(255),
	"language" varchar(100) NOT NULL,
	"content_url" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_paste_code" ON "tbl_pastes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_paste_expires_at" ON "tbl_pastes" USING btree ("expires_at");