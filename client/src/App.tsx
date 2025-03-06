import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthGuard } from "@/components/auth-guard";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import Dashboard from "@/pages/dashboard";
import AddCash from "@/pages/add-cash";
import Admin from "@/pages/admin";
import History from "@/pages/history";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/dashboard">
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      </Route>
      <Route path="/add-cash">
        <AuthGuard>
          <AddCash />
        </AuthGuard>
      </Route>
      <Route path="/admin">
        <AuthGuard>
          <Admin />
        </AuthGuard>
      </Route>
      <Route path="/history">
        <AuthGuard>
          <History />
        </AuthGuard>
      </Route>
      <Route path="/">
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // ✅ Catch Global Errors & Show Alert
    window.onerror = function (message, source, lineno, colno, error) {
      alert(`Error: ${message} at ${source}:${lineno}:${colno}`);
    };

    // ✅ Debugging Token Status
    const token = localStorage.getItem("token");
    console.log("🔹 App Load - Token Found:", token);

    // ✅ Debugging AuthGuard Check
    window.addEventListener("storage", () => {
      console.log("🔹 AuthGuard - Token Updated:", localStorage.getItem("token"));
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
