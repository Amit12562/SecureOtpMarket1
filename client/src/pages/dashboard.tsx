import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOtpRequestSchema } from "@shared/schema";
import type { InsertOtpRequest, User, OtpRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: otpRequests } = useQuery<OtpRequest>({
    queryKey: ["/api/otp-requests"],
    refetchInterval: 1000, // Poll every second to check for updates
  });

  const form = useForm<InsertOtpRequest>({
    resolver: zodResolver(insertOtpRequestSchema),
    defaultValues: {
      appName: "",
    },
  });

  const otpMutation = useMutation({
    mutationFn: async (data: InsertOtpRequest) => {
      await apiRequest("POST", "/api/otp-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/otp-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      form.reset();
      toast({
        title: "OTP generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: error.message || "Failed to generate OTP",
        variant: "destructive",
      });
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.username}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <p className="text-3xl font-bold">₹{user?.balance || 0}</p>
              </div>
              <Button onClick={() => setLocation("/add-cash")}>Add Cash</Button>
              {user?.isAdmin && (
                <Button onClick={() => setLocation("/admin")} variant="outline">
                  Admin Dashboard
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate OTP</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Cost: ₹7 per OTP</p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => otpMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="appName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>App Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter app name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={otpMutation.isPending || (user?.balance || 0) < 7}>
                  {(user?.balance || 0) < 7 ? "Insufficient Balance" : "Generate OTP"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {otpRequests && (
          <Card>
            <CardHeader>
              <CardTitle>Recent OTPs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-medium">{otpRequests.appName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(otpRequests.createdAt).toLocaleString()}
                    </p>
                    {otpRequests.mobileNumber && (
                      <p className="text-sm mt-2">Mobile: {otpRequests.mobileNumber}</p>
                    )}
                    {otpRequests.adminOtp && otpRequests.createdAt && 
                      Date.now() - new Date(otpRequests.createdAt).getTime() > 25 * 60 * 1000 && (
                      <p className="text-sm mt-2">OTP: {otpRequests.adminOtp}</p>
                    )}
                  </div>
                  <p className="text-xl font-mono">{otpRequests.otp}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}