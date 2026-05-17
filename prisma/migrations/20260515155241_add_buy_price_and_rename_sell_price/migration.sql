/*
  Warnings:

  - You are about to drop the column `price` on the `items` table. All the data in the column will be lost.
  - Added the required column `sell_price` to the `items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `items` 
    CHANGE COLUMN `price` `sell_price` DECIMAL(15, 2) NOT NULL,
    ADD COLUMN `buy_price` DECIMAL(15, 2) NOT NULL DEFAULT 0;
