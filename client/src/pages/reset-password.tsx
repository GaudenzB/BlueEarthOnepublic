import { Link, useParams } from "wouter";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import blueLogo from "@assets/BlueEarth Capital_blue.png";

export default function ResetPassword() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-neutral-50">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <img
              className="h-12 w-auto"
              src={blueLogo}
              alt="BlueEarth Capital"
            />
          </div>
          <h2 className="mt-6 text-center text-2xl font-semibold leading-9 text-gray-900">
            Invalid Reset Link
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            The password reset link is invalid or has expired.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Request a new password reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-neutral-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img
            className="h-12 w-auto"
            src={blueLogo}
            alt="BlueEarth Capital"
          />
        </div>
        <h2 className="mt-6 text-center text-2xl font-semibold leading-9 text-gray-900">
          Reset Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your new password below to reset your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-6 py-8 shadow sm:rounded-lg sm:px-8">
          <ResetPasswordForm token={token} />
          
          <div className="mt-6 flex justify-center">
            <Link
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}