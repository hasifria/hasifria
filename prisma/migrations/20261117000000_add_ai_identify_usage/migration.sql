-- CreateTable
CREATE TABLE "ai_identify_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_identify_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_identify_usage_user_id_created_at_idx" ON "ai_identify_usage"("user_id", "created_at");

