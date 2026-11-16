-- CreateTable
CREATE TABLE "SecurityQuestionAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionKey" VARCHAR(64) NOT NULL,
    "answerHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityQuestionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityQuestionAnswer_userId_idx" ON "SecurityQuestionAnswer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityQuestionAnswer_userId_questionKey_key" ON "SecurityQuestionAnswer"("userId", "questionKey");

-- AddForeignKey
ALTER TABLE "SecurityQuestionAnswer" ADD CONSTRAINT "SecurityQuestionAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
