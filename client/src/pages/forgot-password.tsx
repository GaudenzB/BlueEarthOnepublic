import { Link } from "wouter";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import blueLogo from "@assets/BlueEarth Capital_blue.png";

export default function ForgotPassword() {
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
          Forgot Your Password?
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address below and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-6 py-8 shadow sm:rounded-lg sm:px-8">
          <ForgotPasswordForm />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  Or
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col space-y-2">
              <Link
                href="/login"
                className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}