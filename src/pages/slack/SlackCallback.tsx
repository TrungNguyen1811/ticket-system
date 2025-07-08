
import { authService } from "@/services/auth.service";
import { Loader2 } from "lucide-react";
import { Slack } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function SlackCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  //   const code = params.get("code");
  // const state = params.get("state");

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");

    if (code) {
      authService.slackCallback(code, state || "");
    } else {
      navigate("/settings?slack=missing-code");
    }
  }, [params, navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4 text-center px-4">
      <Slack className="h-10 w-10 text-indigo-600 animate-pulse" />
      <div className="flex items-center space-x-2 text-gray-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">Connecting to Slack...</span>
      </div>
      <p className="text-xs text-muted-foreground max-w-sm">
        Please do not close this page. You will be redirected after successful
        connection.
      </p>
    </div>
  );
}
