-- CreateTable
CREATE TABLE "action_receipts" (
    "receipt_id" TEXT NOT NULL,
    "signer_account_id" TEXT NOT NULL,

    CONSTRAINT "action_receipts_pkey" PRIMARY KEY ("receipt_id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "receipt_id" TEXT NOT NULL,
    "included_in_block_timestamp" DECIMAL(20,0) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("receipt_id")
);

-- CreateIndex
CREATE INDEX "action_receipt_signer_account_id_idx" ON "action_receipts"("signer_account_id");

-- CreateIndex
CREATE INDEX "receipts_timestamp_idx" ON "receipts"("included_in_block_timestamp");

-- AddForeignKey
ALTER TABLE "action_receipts" ADD CONSTRAINT "receipt_fk" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("receipt_id") ON DELETE CASCADE ON UPDATE NO ACTION;
