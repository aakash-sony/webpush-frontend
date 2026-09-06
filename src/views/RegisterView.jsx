import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/authApi';
import ErrorAlert from '../components/ErrorAlert';

const RegisterView = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field-specific error on edit
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const newFieldErrors = {};

    if (!formData.username.trim()) {
      newFieldErrors.username = 'Username is required';
    }

    if (!formData.password) {
      newFieldErrors.password = 'Password is required';
    } else if (formData.password.length < 4) {
      newFieldErrors.password = 'Password must be at least 4 characters long';
    }

    if (!formData.confirmPassword) {
      newFieldErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError('Please resolve the validation errors below.');
      return;
    }

    setLoading(true);
    try {
      // Fix: Send username, password, AND confirmPassword matching backend DTO UserRegistrationRequestDto contract
      await registerUser({
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      navigate('/login', {
        state: { message: 'Registration successful! Please log in with your credentials.' },
      });
    } catch (err) {
      console.error('Registration failed:', err);

      const responseData = err.response?.data;
      if (responseData?.errors && typeof responseData.errors === 'object') {
        setFieldErrors(responseData.errors);
        setError('Validation failed. Please check the highlighted fields.');
      } else {
        const msg =
          responseData?.message ||
          responseData ||
          err.message ||
          'Failed to register account.';
        setError(typeof msg === 'string' ? msg : 'Failed to register account.');
      }
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
                  <i className="bi bi-person-plus-fill fs-2"></i>
                </div>
                <h3 className="fw-bold text-slate-100 mb-1">Create Account</h3>
                <p className="text-slate-400 small mb-0">Register to sync your push subscriptions</p>
              </div>

              <ErrorAlert message={error} onClose={() => setError(null)} />

              <form onSubmit={handleSubmit} noValidate>
                {/* Username Field */}
                <div className="mb-3">
                  <label className="form-label text-slate-200 small fw-semibold">
                    Username <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary border-opacity-30 text-slate-400">
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      type="text"
                      className={`form-control text-slate-100 ${
                        fieldErrors.username ? 'is-invalid border-danger' : ''
                      }`}
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                  {fieldErrors.username && (
                    <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                      <i className="bi bi-exclamation-circle-fill"></i>
                      <span>{fieldErrors.username}</span>
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div className="mb-3">
                  <label className="form-label text-slate-200 small fw-semibold">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary border-opacity-30 text-slate-400">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      type="password"
                      className={`form-control text-slate-100 ${
                        fieldErrors.password ? 'is-invalid border-danger' : ''
                      }`}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  {fieldErrors.password && (
                    <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                      <i className="bi bi-exclamation-circle-fill"></i>
                      <span>{fieldErrors.password}</span>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="mb-4">
                  <label className="form-label text-slate-200 small fw-semibold">
                    Confirm Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary border-opacity-30 text-slate-400">
                      <i className="bi bi-shield-check"></i>
                    </span>
                    <input
                      type="password"
                      className={`form-control text-slate-100 ${
                        fieldErrors.confirmPassword ? 'is-invalid border-danger' : ''
                      }`}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      required
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                      <i className="bi bi-exclamation-circle-fill"></i>
                      <span>{fieldErrors.confirmPassword}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-100 py-2.5 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3 fw-semibold"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Registering...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle"></i> Register Account
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-3 pt-3 border-top border-secondary border-opacity-20">
                <span className="text-slate-400 small">Already have an account? </span>
                <Link to="/login" className="text-primary text-decoration-none fw-semibold small ms-1">
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
