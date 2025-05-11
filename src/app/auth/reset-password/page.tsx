"use client";
import { useState } from "react";
import { authService } from "@/lib/api/services/auth-service";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow text-red-600">
        Thiếu token reset mật khẩu.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Đặt lại mật khẩu</h2>
      {success ? (
        <div className="text-green-600">
          Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập lại.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Mật khẩu mới</label>
            <input
              type="password"
              className="w-full border px-3 py-2 rounded"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
          </button>
        </form>
      )}
    </div>
  );
}
