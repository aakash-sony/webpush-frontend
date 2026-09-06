
const Footer = () => {
  return (
    <footer className="footer bg-dark border-top border-secondary border-opacity-25 py-4 text-muted mt-auto">
      <div className="container text-center">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
          <span className="small">&copy; {new Date().getFullYear()} WebPush Notification System. Live API Integration.</span>
          <div className="d-flex gap-3 small">
            <span className="text-secondary"><i className="bi bi-shield-check text-info fs-6 me-1"></i> Session Persistence</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
