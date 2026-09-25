-- ApparelProduct.photos: galeria de fotos (schema Prisma); tabela inicial não tinha esta coluna.
ALTER TABLE "ApparelProduct" ADD COLUMN IF NOT EXISTS "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
