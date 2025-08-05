-- CreateTable
CREATE TABLE "Subsidiary" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "icaoCode" TEXT NOT NULL,
    "description" TEXT,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subsidiary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subsidiary_name_key" ON "Subsidiary"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subsidiary_code_key" ON "Subsidiary"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subsidiary_icaoCode_key" ON "Subsidiary"("icaoCode");
