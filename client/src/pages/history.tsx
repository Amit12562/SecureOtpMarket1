import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OtpRequest } from "@shared/schema";

export default function History() {
  const { data: otpRequests } = useQuery<OtpRequest[]>({
    queryKey: ["/api/otp-requests/history"],
  });

  return (
    <Layout>
      <Card>
        <CardHeader>
          <CardTitle>OTP History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {otpRequests?.map((request) => (
              <div key={request.id} className="p-4 border rounded">
                <p className="font-medium">App: {request.appName}</p>
                <p className="text-sm text-muted-foreground">
                  Date: {new Date(request.createdAt).toLocaleString()}
                </p>
                {request.mobileNumber && (
                  <p className="text-sm mt-2">Mobile: {request.mobileNumber}</p>
                )}
                {request.adminOtp && request.createdAt && 
                  Date.now() - new Date(request.createdAt).getTime() > 25 * 60 * 1000 && (
                  <p className="text-sm mt-2">OTP: {request.adminOtp}</p>
                )}
                <p className="text-xl font-mono mt-2">{request.otp}</p>
              </div>
            ))}
            {(!otpRequests || otpRequests.length === 0) && (
              <p className="text-center text-muted-foreground py-8">No OTP history found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
