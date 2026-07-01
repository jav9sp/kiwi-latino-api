-- Índice compuesto en posts para el feed (status + createdAt DESC)
CREATE INDEX "posts_status_createdAt_idx" ON "posts"("status", "createdAt" DESC);

-- Restricción única en reports para deduplicación de reportes a nivel BD
CREATE UNIQUE INDEX "reports_postId_reporterId_key" ON "reports"("postId", "reporterId");

-- Índice en refresh_tokens por userId (usado en logout de todos los dispositivos)
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
