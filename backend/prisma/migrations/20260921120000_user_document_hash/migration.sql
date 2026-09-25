-- Passo para criptografia de PII: document deixa de ser único em claro,
-- passa a existir documentHash (HMAC determinístico) para unicidade/lookup.
ALTER TABLE "User" ADD COLUMN "documentHash" TEXT;
CREATE UNIQUE INDEX "User_documentHash_key" ON "User"("documentHash");
DROP INDEX "User_document_key";
