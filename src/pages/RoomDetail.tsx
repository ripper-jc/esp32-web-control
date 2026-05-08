import { useParams, Link } from "react-router-dom";
import DeviceCard from "../components/DeviceCard";
import { useDevices } from "../context/DeviceContext";

export default function RoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const { devices, rooms, onlineDeviceIds, loading } = useDevices();

  if (loading) return <p className="text-gray-500">Loading...</p>;

  const room = rooms.find((r) => r.roomId === roomId);
  if (!room) {
    return (
      <div>
        <Link to="/" className="text-sm text-gray-500 hover:text-brand-400 transition-colors">&larr; Back to dashboard</Link>
        <p className="text-gray-500 mt-6">Room not found.</p>
      </div>
    );
  }

  const roomDevices = devices.filter((d) => d.roomId === roomId);
  const onlineCount = roomDevices.filter((d) => onlineDeviceIds.has(d.deviceId)).length;

  return (
    <div className="animate-fade-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
        <Link to="/" className="hover:text-brand-400 transition-colors">Dashboard</Link>
        <span className="text-gray-700">/</span>
        <span className="text-gray-400">{room.name}</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">{room.name}</h1>
      <p className="text-sm text-gray-500 mb-8">
        {roomDevices.length} device{roomDevices.length !== 1 ? "s" : ""} &middot; {onlineCount} online
      </p>

      {roomDevices.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-gray-500">No devices in this room yet.</p>
          <p className="text-sm text-gray-600 mt-1">Assign devices from the Devices page.</p>
        </div>
      ) : (
        roomDevices.map((d) => <DeviceCard key={d.deviceId} device={d} isOnline={onlineDeviceIds.has(d.deviceId)} rooms={rooms} />)
      )}
    </div>
  );
}
