import { TransactionType } from '@/types'

/**
 * Recalculates the Average Buy Price for an item based on all 'IN' stock transactions.
 * Should be called within a Prisma transaction.
 */
export async function updateItemAvgBuyPrice(
    tx: any,
    itemId: number
) {
    const allInTransactions = await tx.itemStockTransaction.findMany({
        where: {
            itemId: itemId,
            type: TransactionType.IN,
        }
    })

    const totalCost = allInTransactions.reduce((acc: number, t: any) => acc + (Number(t.quantity) * Number(t.price)), 0)
    const totalQty = allInTransactions.reduce((acc: number, t: any) => acc + Number(t.quantity), 0)

    const newAvgPrice = totalQty > 0 ? Math.ceil(totalCost / totalQty) : 0

    return await tx.item.update({
        where: { id: itemId },
        data: { buyPrice: newAvgPrice }
    })
}
