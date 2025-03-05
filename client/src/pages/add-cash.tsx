import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const addCashSchema = z.object({
  amount: z.string().min(1),
  utrNumber: z.string().min(1),
});

type AddCashForm = z.infer<typeof addCashSchema>;

export default function AddCash() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddCashForm>({
    resolver: zodResolver(addCashSchema),
    defaultValues: {
      amount: "",
      utrNumber: "",
    },
  });

  const transactionMutation = useMutation({
    mutationFn: async (data: AddCashForm) => {
      await apiRequest("POST", "/api/transactions", {
        amount: parseInt(data.amount),
        utrNumber: data.utrNumber,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/dashboard");
      toast({
        title: "Transaction submitted successfully",
        description: "Your balance will be updated once verified",
      });
    },
  });

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Add Cash</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="aspect-square max-w-sm mx-auto border-2 border-dashed rounded-lg flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1556740714-a8395b3bf30f"
                alt="QR Code"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => transactionMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="utrNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UTR Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter transaction UTR number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={transactionMutation.isPending}
                >
                  Submit
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
