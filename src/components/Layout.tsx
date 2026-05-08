import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDevices } from "../context/DeviceContext";

const sidebarItems = [
  { to: "/", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { to: "/devices", label: "Devices", icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" },
  { to: "/floor-plan", label: "Floor Plan", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
  { to: "/scenes", label: "Scenes", icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { to: "/pin-groups", label: "Groups", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { to: "/automations", label: "Automations", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { to: "/schedule", label: "Schedule", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { to: "/statistics", label: "Statistics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { to: "/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

const mobileNavItems = [sidebarItems[0], sidebarItems[1], sidebarItems[3], sidebarItems[5], sidebarItems[8]];

function NavIcon({ path }: { path: string }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export default function Layout() {
  const { userEmail, logout } = useAuth();
  const { wsConnected, devices, onlineDeviceIds, weather } = useDevices();
  const onlineCount = devices.filter((d) => onlineDeviceIds.has(d.deviceId)).length;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0a0a0a]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-surface border-r border-white/5 min-h-screen">
        <div className="px-5 py-6">
          <h1 className="text-xl font-bold text-white tracking-tight">Smart House</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-green-400 shadow-lg shadow-green-400/50" : "bg-red-400"}`} />
            <span className="text-xs text-gray-500">{onlineCount}/{devices.length} online</span>
          </div>
          {weather && (
            <div className="mt-3 text-xs text-gray-500">
              <span className="text-white font-medium">{weather.temperature}°C</span> · {weather.humidity}% · {weather.windSpeed} km/h
            </div>
          )}
        </div>
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive ? "bg-brand-600/15 text-brand-400" : "text-gray-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <NavIcon path={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-5 border-t border-white/5">
          <p className="text-xs text-gray-500 truncate mb-1">{userEmail}</p>
          <button onClick={logout} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Sign out</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-white/5 flex z-50">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2.5 text-[10px] font-medium transition-colors ${isActive ? "text-brand-400" : "text-gray-500"}`
            }
          >
            <NavIcon path={item.icon} />
            <span className="mt-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
