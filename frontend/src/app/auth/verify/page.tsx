"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import UsernameSetupModal from "@/components/UsernameSetupModal";

function VerifyContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "username-setup" | "error">("loading");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setError("Missing token");
      return;
    }

    api.get(`/auth/verify?token=${token}`)
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        setEmail(res.data.user.email);

        if (res.data.needsUsername) {
          setStatus("username-setup");
        } else {
          setStatus("success");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1500);
        }
      })
      .catch((err) => {
        setStatus("error");
        setError(err.response?.data?.error || "Verification failed");
      });
  }, [searchParams]);

  const handleUsernameComplete = () => {
    setStatus("success");
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1000);
  };

  return (
    <div className="text-center">
      {status === "loading" && <div className="text-white/50 text-lg">Verifying...</div>}
      {status === "username-setup" && (
        <div>
          <div className="text-primary text-2xl font-bold mb-2">Signed in!</div>
          <p className="text-white/50">Setting up your profile...</p>
          <UsernameSetupModal email={email} onComplete={handleUsernameComplete} />
        </div>
      )}
      {status === "success" && (
        <div>
          <div className="text-primary text-2xl font-bold mb-2">Signed in!</div>
          <p className="text-white/50">Redirecting to dashboard...</p>
        </div>
      )}
      {status === "error" && (
        <div>
          <div className="text-red-400 text-2xl font-bold mb-2">Error</div>
          <p className="text-white/50">{error}</p>
        </div>
      )}
    </div>
  );
}

export default function Verify() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <Suspense fallback={<div className="text-white/50 text-lg">Loading...</div>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
