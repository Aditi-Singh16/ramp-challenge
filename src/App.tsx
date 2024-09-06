import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"
import { useCustomFetch } from "./hooks/useCustomFetch"
import { SetTransactionApprovalFunction } from "./components/Transactions/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [isFiltered, setIsFiltered] = useState(false)
  const { fetchWithoutCache, loading } = useCustomFetch()


  const [localTransactionUpdates, setLocalTransactionUpdates] = useState<Record<string, boolean>>({});
  
  const transactions = useMemo(() => {
    const allTransactions = paginatedTransactions?.data ?? transactionsByEmployee ?? [];
    return allTransactions.map((transaction) => ({
      ...transaction,
      approved: localTransactionUpdates[transaction.id] ?? transaction.approved,
    }));
  }, [paginatedTransactions, transactionsByEmployee, localTransactionUpdates])

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    setIsLoading(false)
    await paginatedTransactionsUtils.fetchAll()

  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      if(!employeeId){
        loadAllTransactions()
        setIsFiltered(false)
      }else{
        await transactionsByEmployeeUtils.fetchById(employeeId)
        setIsFiltered(true)
      }
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  const handleTransactionApproval = useCallback<SetTransactionApprovalFunction>(
    async ({ transactionId, newValue }) => {
      await fetchWithoutCache<void>("setTransactionApproval", {
        transactionId,
        value: newValue,
      });

      setLocalTransactionUpdates((prev) => ({
        ...prev,
        [transactionId]: newValue,
      }));
    },
    [paginatedTransactionsUtils]
  );

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }

            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} 
            onTransactionApprovalChange={handleTransactionApproval}
          />

          {transactions !== null && isFiltered==false && paginatedTransactions?.nextPage !== null && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
