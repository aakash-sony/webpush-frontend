import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorAlert from '../components/ErrorAlert';

const LoginView = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const successNotice = location.state?.message;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userObj = await login(formData);
      
      const isAdminUser = userObj?.role === 'ADMIN' || userObj?.role === 'ROLE_ADMIN' || formData.username === 'admin';
      if (isAdminUser) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login failed:', err);
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Login failed. Invalid username or password.';
      setError(typeof msg === 'string' ? msg : 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center my-4">
        <div className="col-md-6 col-lg-5">
          <div className="card glass-card shadow-lg border-0 rounded-4 overflow-hidden position-relative">
            <div className="glow-effect"></div>
            <div className="card-body p-4 p-sm-5">
              <div className="text-center mb-4">
                <div className="bg-primary bg-opacity-15 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" style={{ width: '64px', height: '64px' }}>
                  <i className="bi bi-box-arrow-in-right fs-2"></i>
                </div>
                <h3 className="fw-bold text-slate-100 mb-1">Welcome Back</h3>
                <p className="text-slate-400 small mb-0">Sign in to manage WebPush subscriptions</p>
              </div>

              {successNotice && (
                <div className="alert alert-success border-0 shadow-sm small mb-3 text-slate-100 bg-success bg-opacity-20 border-start border-success border-4">
                  <i className="bi bi-check-circle-fill me-2 text-success"></i> {successNotice}
                </div>
              )}

              <ErrorAlert message={error} onClose={() => setError(null)} />

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label text-slate-200 small fw-semibold">Username</label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary border-opacity-30 text-slate-400">
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control text-slate-100"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter username"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-slate-200 small fw-semibold">Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary border-opacity-30 text-slate-400">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control text-slate-100"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-100 py-2.5 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3 fw-semibold"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right"></i> Log In
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-3 pt-3 border-top border-secondary border-opacity-20">
                <span className="text-slate-400 small">Don't have an account? </span>
                <Link to="/register" className="text-primary text-decoration-none fw-semibold small ms-1">
                  Register here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;

