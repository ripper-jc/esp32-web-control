import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-6xl font-bold text-gray-700 mb-4">404</p>
      <p className="text-gray-500 mb-6">Page not found</p>
      <Link to="/" className="btn-primary">Go to Dashboard</Link>
    </div>
  );
}
