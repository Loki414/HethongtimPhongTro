import { api } from './client';

export async function listDepositInvoices(params = {}) {
  const res = await api.get('/deposit-invoices', { params });
  return res.data;
}

export async function getDepositInvoice(depositInvoiceId) {
  const res = await api.get(`/deposit-invoices/${depositInvoiceId}`);
  return res.data.data;
}

/** Admin: tạo hóa đơn (nếu chưa có) và/hoặc gửi thông báo */
export async function issueDepositInvoice(bookingId, { resendNotification = false } = {}) {
  const res = await api.post(`/deposit-invoices/issue/${bookingId}`, { resendNotification });
  return res.data;
}

export async function resendDepositNotification(depositInvoiceId) {
  const res = await api.post(`/deposit-invoices/${depositInvoiceId}/resend-notification`);
  return res.data;
}

/** Admin: cập nhật trạng thái hóa đơn cọc (pending | paid | cancelled) */
export async function updateDepositInvoiceStatus(depositInvoiceId, status) {
  const res = await api.patch(`/deposit-invoices/${depositInvoiceId}`, { status });
  return res.data.data;
}
