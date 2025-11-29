-- AlterTable: Rename Table.number to Table.name and add unique constraint
ALTER TABLE "Table" RENAME COLUMN "number" TO "name";

-- CreateIndex
CREATE UNIQUE INDEX "Table_outletId_name_key" ON "Table"("outletId", "name");
