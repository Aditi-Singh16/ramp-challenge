import { FunctionComponent } from "react"
import { Transaction } from "../../utils/types"

export type SetTransactionApprovalFunction = (params: {
  transactionId: string
  newValue: boolean
}) => Promise<void>

type TransactionsProps = { 
  transactions: Transaction[] | null;
  onTransactionApprovalChange: SetTransactionApprovalFunction;
};

type TransactionPaneProps = {
  transaction: Transaction;
  loading: boolean;
  approved?: boolean;
  setTransactionApproval: SetTransactionApprovalFunction;
  onTransactionApprovalChange: SetTransactionApprovalFunction;
};

export type TransactionsComponent = FunctionComponent<TransactionsProps>
export type TransactionPaneComponent = FunctionComponent<TransactionPaneProps>
