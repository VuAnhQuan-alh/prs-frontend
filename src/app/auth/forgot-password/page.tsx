"use client";
import { useState } from "react";
import { authService } from "@/lib/api/services/auth-service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Quên mật khẩu</h2>
      {success ? (
        <div className="text-green-600">
          Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              className="w-full border px-3 py-2 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Đang gửi..." : "Gửi hướng dẫn"}
          </button>
        </form>
      )}
    </div>
  );
}
