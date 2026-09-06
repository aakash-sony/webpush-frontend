import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserUnreadCount, getGuestUnreadCount } from '../api/notificationApi';
import StatusBadge from './StatusBadge';

const Navbar = () => {
  const { user, isAdmin, guestId, assocError, retryGuestAssociation, clearAssocError, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      if (user) {
        const rawId = user.id ?? user.userId;
        const numericId = rawId !== undefined && rawId !== null && !isNaN(Number(rawId)) ? Number(rawId) : null;
        if (numericId !== null) {
          const data = await getUserUnreadCount(numericId);
          if (data && typeof data.count === 'number') {
            setUnreadCount(data.count);
          }
        }
      } else if (guestId) {
        const data = await getGuestUnreadCount(guestId);
        if (data && typeof data.count === 'number') {
          setUnreadCount(data.count);
        }
      }
    } catch (err) {
      console.debug('Failed to fetch unread count for navbar badge:', err);
    }
  }, [user, guestId]);

  useEffect(() => {
    fetchUnreadCount();

    const handleRefresh = () => fetchUnreadCount();
    window.addEventListener('webpush-notification-refresh', handleRefresh);

    return () => {
      window.removeEventListener('webpush-notification-refresh', handleRefresh);
    };
  }, [fetchUnreadCount, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark border-bottom border-secondary border-opacity-25 py-2.5 sticky-top glass-navbar shadow-sm">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold text-gradient fs-4 py-1" to="/">
            <i className="bi bi-bell-fill text-primary fs-4"></i>
            <span>WebPush Hub</span>
          </Link>
          
          <button
            className="navbar-toggler border-0 shadow-none p-2"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarMain"
            aria-controls="navbarMain"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarMain">
            <ul className="navbar-nav me-auto mb-3 mb-lg-0 align-items-lg-center gap-lg-1 mt-2 mt-lg-0">
              <li className="nav-item">
                <Link className={`nav-link px-3 py-2 rounded-3 transition-all ${isActive('/') ? 'active fw-bold text-white bg-primary bg-opacity-25' : 'text-slate-300'}`} to="/">
                  <i className="bi bi-house-door me-1.5"></i> Home
                </Link>
              </li>

              <li className="nav-item">
                <Link className={`nav-link px-3 py-2 rounded-3 transition-all d-inline-flex align-items-center gap-1.5 ${isActive('/notifications') ? 'active fw-bold text-white bg-primary bg-opacity-25' : 'text-slate-300'}`} to="/notifications">
                  <i className="bi bi-bell me-1"></i> Notifications
                  {unreadCount > 0 && (
                    <span className="badge bg-danger rounded-pill px-2 py-0.5 small shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </li>

              {isAdmin && (
                <>
                  <li className="nav-item">
                    <Link className={`nav-link px-3 py-2 rounded-3 transition-all ${isActive('/admin') ? 'active fw-bold text-info bg-info bg-opacity-10' : 'text-slate-300'}`} to="/admin">
                      <i className="bi bi-speedometer2 me-1.5"></i> Admin Dashboard
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link px-3 py-2 rounded-3 transition-all ${isActive('/admin/notification-schedules') || location.pathname.startsWith('/admin/notification-schedules') ? 'active fw-bold text-info bg-info bg-opacity-10' : 'text-slate-300'}`} to="/admin/notification-schedules">
                      <i className="bi bi-clock-history me-1.5"></i> Schedules
                    </Link>
                  </li>
                </>
              )}
            </ul>

            <div className="d-flex align-items-center pt-2 pt-lg-0 border-top border-secondary border-opacity-25 border-lg-0">
              {user ? (
                <div className="d-flex align-items-center gap-3 w-100 justify-content-between justify-content-lg-end">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold text-slate-100 me-1">{user.username || 'User'}</span>
                    <StatusBadge type={isAdmin ? 'admin' : 'primary'} text={isAdmin ? 'Admin' : 'User'} icon={isAdmin ? 'shield-check' : 'person'} />
                  </div>
                  <button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1.5 fw-medium d-inline-flex align-items-center">
                    <i className="bi bi-box-arrow-right me-1.5"></i> Logout
                  </button>
                </div>
              ) : (
                <div className="d-flex w-100 w-lg-auto">
                  <Link to="/login" className="btn btn-primary btn-sm rounded-pill px-4 py-1.5 fw-semibold shadow-sm d-inline-flex align-items-center gap-1.5">
                    <i className="bi bi-box-arrow-in-right"></i>
                    <span>Login</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {assocError && (
        <div className="bg-warning text-dark py-2 px-3 text-center small fw-semibold d-flex align-items-center justify-content-center gap-2 border-bottom border-warning">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <span>{assocError}</span>
          <button
            onClick={retryGuestAssociation}
            className="btn btn-sm btn-dark rounded-pill px-2.5 py-0.5 text-white ms-2"
          >
            Retry Sync
          </button>
          <button
            onClick={clearAssocError}
            className="btn-close btn-close-dark ms-2"
            aria-label="Close"
          ></button>
        </div>
      )}
    </>
  );
};

export default Navbar;


