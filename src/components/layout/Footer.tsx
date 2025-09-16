'use client';

import packageJson from '../../../package.json';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 mt-8 flex-shrink-0">
      <div className="container mx-auto px-4 flex justify-between items-center text-gray-600 text-sm">
        <p>&copy; 2025 FinTrack. All rights reserved.</p>
        <p>v{packageJson.version}</p>
      </div>
    </footer>
  );
}
