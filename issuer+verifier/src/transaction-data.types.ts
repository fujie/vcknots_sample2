import { z } from 'zod'
import { DeepPartialUnknown } from './type.utils'

const transactionDataSchema = z.object({
  type: z.string(),
  credential_ids: z.array(z.string()),
  transaction_data_hashes_alg: z.array(z.string()).optional(),
})
export type TransactionData = z.infer<typeof transactionDataSchema>
export const TransactionData = (value?: DeepPartialUnknown<TransactionData>) =>
  transactionDataSchema.parse(value)
TransactionData.schema = transactionDataSchema
