-- DropForeignKey
ALTER TABLE `item_stock_transactions` DROP FOREIGN KEY `item_stock_transactions_invoice_id_fkey`;

-- DropIndex
DROP INDEX `item_stock_transactions_invoice_id_fkey` ON `item_stock_transactions`;

-- AddForeignKey
ALTER TABLE `item_stock_transactions` ADD CONSTRAINT `item_stock_transactions_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
