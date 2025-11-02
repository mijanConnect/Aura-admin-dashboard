import type { AnyAction, Dispatch } from "redux";
import { api } from "../baseApi";
import { setCredentials } from "./authSlice";

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    otpVerify: builder.mutation<unknown, Record<string, unknown>>({
      query: (data: Record<string, unknown>) => ({
        method: "POST",
        url: "/auth/verify-email",
        body: data,
      }),
      async onQueryStarted(
        _arg: Record<string, unknown>,
        { queryFulfilled }: { queryFulfilled: Promise<{ data: unknown }> }
      ) {
        try {
          const { data } = await queryFulfilled;
          if (data?.data) {
            localStorage.setItem("resetToken", data.data);
          }
        } catch {
          // OTP verify failed
        }
      },
    }),

    resendOtp: builder.mutation<unknown, Record<string, unknown>>({
      query: (data: Record<string, unknown>) => ({
        method: "POST",
        url: "/auth/resend-otp",
        body: data,
      }),
    }),
    login: builder.mutation<unknown, { email: string; password: string }>({
      query: (data: { email: string; password: string }) => ({
        method: "POST",
        url: "/auth/login",
        body: data,
      }),
      async onQueryStarted(
        _arg: { email: string; password: string },
        {
          queryFulfilled,
          dispatch,
        }: {
          queryFulfilled: Promise<{ data: unknown }>;
          dispatch: Dispatch<AnyAction>;
        }
      ) {
        try {
          const { data } = await queryFulfilled;
          // tokens may live at data.token or data.data.accessToken depending on backend
          const access = data?.data?.accessToken ?? data?.token ?? null;
          const refresh =
            data?.data?.refreshToken ?? data?.refreshToken ?? null;
          const user = data?.data?.user ?? data?.user ?? null;
          if (access) localStorage.setItem("accessToken", access);
          if (refresh) localStorage.setItem("refreshToken", refresh);
          if (user) {
            dispatch(
              setCredentials({
                user,
                accessToken: access,
                refreshToken: refresh,
              })
            );
          }
        } catch {
          // ignore - caller handles errors
        }
      },
    }),

    forgotPassword: builder.mutation({
      query: (data: { email: string }) => ({
        method: "POST",
        url: "/auth/forget-password",
        body: data,
      }),
    }),

    resetPassword: builder.mutation({
      query: (data: { newPassword: string; confirmPassword: string }) => {
        const token = localStorage.getItem("resetToken"); // read dynamically
        return {
          method: "POST",
          url: "/auth/reset-password",
          body: data,
          headers: {
            resettoken: token || "", // backend expects this
          },
        };
      },
    }),
  }),
});

export const {
  useOtpVerifyMutation,
  useResendOtpMutation,
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
