/*
  Warnings:

  - A unique constraint covering the columns `[primaryDomain]` on the table `server_nodes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "server_nodes" ADD COLUMN "primaryDomain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "server_nodes_primaryDomain_key" ON "server_nodes"("primaryDomain");
