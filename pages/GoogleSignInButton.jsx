import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const GoogleSignInButton = () => {
  const navigate = useNavigate();
  const { googleLogin } = useAuth();

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          const credential = credentialResponse?.credential;
          if (!credential) return;

          await googleLogin(credential);

          // After login -> always redirect to Onboarding (your requirement)
          navigate("/onboarding", { replace: true });
        }}
        onError={() => alert("Google sign-in failed")}
      />
    </div>
  );
};

export default GoogleSignInButton;
