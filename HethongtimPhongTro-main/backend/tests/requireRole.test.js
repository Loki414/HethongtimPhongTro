const { requireRole } = require('../src/middlewares/auth');

describe('requireRole middleware', () => {
  it('calls next() when role matches', () => {
    const req = { user: { role: 'admin' } };
    const next = jest.fn();
    requireRole('admin')(req, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0].length).toBe(0);
  });

  it('returns 403 when role does not match', () => {
    const req = { user: { role: 'user' } };
    const next = jest.fn();
    requireRole('admin')(req, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
  });

  it('returns 401 when user is missing', () => {
    const req = {};
    const next = jest.fn();
    requireRole('admin')(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});
