CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ADMIN');
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'BANNED');
CREATE TYPE "UniversityType" AS ENUM ('FEDERAL', 'STATE', 'PRIVATE');
CREATE TYPE "ProductCategory" AS ENUM ('TEXTBOOKS', 'ELECTRONICS', 'FURNITURE', 'FASHION');
CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'GENTLY_USED', 'SCRATCHED');
CREATE TYPE "ProductStatus" AS ENUM ('AVAILABLE', 'SOLD');

CREATE TABLE "universities" (
  "id" UUID NOT NULL,
  "full_name" VARCHAR(160) NOT NULL,
  "short_code" VARCHAR(24) NOT NULL,
  "institution_type" "UniversityType" NOT NULL,
  "state" VARCHAR(80) NOT NULL,
  "campus_locations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "first_name" VARCHAR(50) NOT NULL,
  "last_name" VARCHAR(50) NOT NULL,
  "email" VARCHAR(254) NOT NULL,
  "password_hash" VARCHAR(100) NOT NULL,
  "phone_number" VARCHAR(16) NOT NULL,
  "matric_number" VARCHAR(40) NOT NULL,
  "level" INTEGER NOT NULL,
  "id_card_photo_path" TEXT NOT NULL,
  "university_id" UUID NOT NULL,
  "is_verified" BOOLEAN NOT NULL DEFAULT false,
  "agreed_to_terms" BOOLEAN NOT NULL DEFAULT false,
  "account_status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
  "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
  "is_banned" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_level_check" CHECK ("level" IN (100, 200, 300, 400, 500)),
  CONSTRAINT "users_terms_check" CHECK ("agreed_to_terms" = true),
  CONSTRAINT "users_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "products" (
  "id" UUID NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "description" VARCHAR(2000) NOT NULL,
  "price" DECIMAL(12,2) NOT NULL,
  "category" "ProductCategory" NOT NULL,
  "condition" "ProductCondition" NOT NULL,
  "image_urls" TEXT[] NOT NULL,
  "seller_id" UUID NOT NULL,
  "target_university_id" UUID NOT NULL,
  "campus_location" VARCHAR(160) NOT NULL,
  "status" "ProductStatus" NOT NULL DEFAULT 'AVAILABLE',
  "is_sold" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "products_price_check" CHECK ("price" > 0),
  CONSTRAINT "products_image_count_check" CHECK (cardinality("image_urls") BETWEEN 2 AND 3),
  CONSTRAINT "products_status_check" CHECK ("is_sold" = ("status" = 'SOLD')),
  CONSTRAINT "products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "products_target_university_id_fkey" FOREIGN KEY ("target_university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "sessions" (
  "id" UUID NOT NULL,
  "token_hash" CHAR(64) NOT NULL,
  "user_id" UUID NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "identity_blacklist" (
  "id" UUID NOT NULL,
  "matric_hash" CHAR(64) NOT NULL,
  "user_id" UUID,
  "reason" VARCHAR(240) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "identity_blacklist_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "identity_blacklist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "admin_audit_events" (
  "id" UUID NOT NULL,
  "admin_id" UUID NOT NULL,
  "action" VARCHAR(80) NOT NULL,
  "target_id" UUID,
  "details" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admin_audit_events_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "universities_full_name_key" ON "universities"("full_name");
CREATE UNIQUE INDEX "universities_short_code_key" ON "universities"("short_code");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_matric_number_key" ON "users"("matric_number");
CREATE INDEX "users_university_id_account_status_idx" ON "users"("university_id", "account_status");
CREATE INDEX "products_target_university_id_status_created_at_idx" ON "products"("target_university_id", "status", "created_at" DESC);
CREATE INDEX "products_seller_id_status_idx" ON "products"("seller_id", "status");
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");
CREATE UNIQUE INDEX "identity_blacklist_matric_hash_key" ON "identity_blacklist"("matric_hash");
CREATE INDEX "admin_audit_events_created_at_idx" ON "admin_audit_events"("created_at");
