ALTER TABLE "invites" ALTER COLUMN "created_by_user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN "email" varchar(255);