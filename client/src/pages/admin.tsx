import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Transaction, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    enabled: user?.isAdmin === true,
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("POST", `/api/admin/transactions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({
        title: "Transaction updated successfully",
      });
    },
  });

  if (!user?.isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-xl text-muted-foreground">Access Denied</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Card>
        <CardHeader>
          <CardTitle>Pending Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions?.filter(t => t.status === "pending").map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">Amount: ₹{transaction.amount}</p>
                  <p className="text-sm text-muted-foreground">UTR: {transaction.utrNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    Date: {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="space-x-2">
                  <Button
                    variant="default"
                    onClick={() => updateTransactionMutation.mutate({ id: transaction.id, status: "approved" })}
                    disabled={updateTransactionMutation.isPending}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => updateTransactionMutation.mutate({ id: transaction.id, status: "rejected" })}
                    disabled={updateTransactionMutation.isPending}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
            {(!transactions || transactions.filter(t => t.status === "pending").length === 0) && (
              <p className="text-center text-muted-foreground py-8">No pending transactions</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
