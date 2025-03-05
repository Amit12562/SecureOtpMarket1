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

  const { data: otpRequests } = useQuery<OtpRequest[]>({
    queryKey: ["/api/otp-requests"],
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
      form.reset();
      toast({
        title: "OTP generated successfully",
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
                <p className="text-3xl font-bold">${user?.balance || 0}</p>
              </div>
              <Button onClick={() => setLocation("/add-cash")}>Add Cash</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate OTP</CardTitle>
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
                <Button type="submit" disabled={otpMutation.isPending}>
                  Generate OTP
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {otpRequests && otpRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent OTPs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {otpRequests.map((request) => (
                  <div key={request.id} className="flex justify-between items-center p-4 border rounded">
                    <div>
                      <p className="font-medium">{request.appName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xl font-mono">{request.otp}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
