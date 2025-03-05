import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Transaction, User, OtpRequest } from "@shared/schema";
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

  const { data: otpRequests } = useQuery<OtpRequest[]>({
    queryKey: ["/api/admin/otp-requests"],
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

  const updateOtpRequestMutation = useMutation({
    mutationFn: async ({ id, adminOtp }: { id: number; adminOtp: string }) => {
      await apiRequest("POST", `/api/admin/otp-requests/${id}`, { adminOtp });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/otp-requests"] });
      toast({
        title: "OTP request updated successfully",
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>OTP Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {otpRequests?.filter(r => r.status === "pending").map((request) => (
              <div key={request.id} className="p-4 border rounded">
                <div className="mb-4">
                  <p className="font-medium">App: {request.appName}</p>
                  <p className="text-sm text-muted-foreground">
                    Date: {new Date(request.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Mobile: {request.mobileNumber}
                  </p>
                </div>
                <div className="space-y-2">
                  <Input 
                    placeholder="Enter OTP"
                    onChange={(e) => updateOtpRequestMutation.mutate({ 
                      id: request.id,
                      adminOtp: e.target.value
                    })}
                  />
                </div>
              </div>
            ))}
            {(!otpRequests || otpRequests.filter(r => r.status === "pending").length === 0) && (
              <p className="text-center text-muted-foreground py-8">No pending OTP requests</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}