CREATE TYPE "public"."expense_status" AS ENUM('draft', 'submitted', 'received');
--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('work_card', 'personal_card');
--> statement-breakpoint
CREATE TABLE "department" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "department_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(32) NOT NULL,
	"member_id" text NOT NULL,
	"department_id" uuid,
	"project_id" uuid,
	"amount_minor" integer NOT NULL,
	"currency_code" varchar(3) DEFAULT 'EUR' NOT NULL,
	"expense_date" date NOT NULL,
	"category" varchar(50) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"comment" varchar(500),
	"status" "expense_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone,
	"received_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expense_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "expense_attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_id" uuid NOT NULL,
	"storage_bucket" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" varchar(128) NOT NULL,
	"size_bytes" integer NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expense_attachment_expense_id_unique" UNIQUE("expense_id")
);
--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_member_id_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expense_attachment" ADD CONSTRAINT "expense_attachment_expense_id_expense_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expense"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "project_department_id_idx" ON "project" USING btree ("department_id");
--> statement-breakpoint
CREATE INDEX "expense_status_submitted_at_idx" ON "expense" USING btree ("status","submitted_at");
--> statement-breakpoint
CREATE INDEX "expense_member_created_at_idx" ON "expense" USING btree ("member_id","created_at");
--> statement-breakpoint
CREATE INDEX "expense_project_created_at_idx" ON "expense" USING btree ("project_id","created_at");
