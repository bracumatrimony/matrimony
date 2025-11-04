import { Heart, Facebook } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white border-t-2 border-black w-full mt-auto">
      <div className="w-full px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
          {}
          <div className="flex flex-col items-center md:items-start">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-gray-900 tracking-tight leading-tight">
              Campus{" "}
              <span className="font-medium bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                Matrimony
              </span>
            </h2>
          </div>

          {}
          <div className="flex items-center space-x-6">
            <Link
              to="/terms"
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              Privacy
            </Link>
            <a
              href="https://www.facebook.com/profile.php?id=61582222400578"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gragy-200 px-3 py-2 rounded-lg transition-colors"
            >
              <Facebook className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Contact Us
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
