import { NavLink, Outlet } from 'react-router-dom';
import { Building2, FileText, LayoutDashboard, Settings } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vendor/new', label: 'Vendor Baru', icon: Building2 },
  { to: '/form-builder', label: 'Form Builder', icon: Settings },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" size={22} />
            <span className="font-semibold text-gray-800 text-sm">Vendor Manager</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Legal Document System</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
