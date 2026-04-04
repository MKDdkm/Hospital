import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { doctors, patients, roomServiceRates } from "@/data/mockData";
import { CalendarDays, Phone, Stethoscope, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RoomOccupancyRow {
  roomType: string;
  totalBeds: number;
  occupiedBeds: number;
  reservedBeds: number;
}

interface BedSlot {
  bedNo: number;
  bedCode: string;
  status: "Occupied" | "Reserved" | "Available";
  patientId?: string;
  patientName?: string;
  phone?: string;
  symptoms?: string;
  doctorAssigned?: string;
  admittedOn?: string;
}

const ROOM_OCCUPANCY_STORAGE_KEY = "medcore-room-occupancy";

const roomPrefixMap: Record<string, string> = {
  "General Ward": "GW",
  "Semi-Private Room": "SPR",
  "Private Room": "PR",
  ICU: "ICU",
};

const formatBedCode = (roomType: string, bedNo: number) => {
  const prefix = roomPrefixMap[roomType] ?? "BD";
  return `${prefix}-${String(bedNo).padStart(2, "0")}`;
};

const getDateOffset = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
};

const buildBedSlots = (row: RoomOccupancyRow): BedSlot[] => {
  return Array.from({ length: row.totalBeds }, (_, index) => {
    const bedNo = index + 1;
    const occupiedLimit = row.occupiedBeds;
    const reservedLimit = row.occupiedBeds + row.reservedBeds;
    const status: BedSlot["status"] = bedNo <= occupiedLimit
      ? "Occupied"
      : bedNo <= reservedLimit
        ? "Reserved"
        : "Available";

    if (status === "Available") {
      return { bedNo, bedCode: formatBedCode(row.roomType, bedNo), status };
    }

    const profile = patients[(index + row.roomType.length) % patients.length];
    const doctor = doctors[(index + row.roomType.length) % doctors.length];

    return {
      bedNo,
      bedCode: formatBedCode(row.roomType, bedNo),
      status,
      patientId: profile.id,
      patientName: profile.name,
      phone: profile.phone,
      symptoms: profile.symptoms,
      doctorAssigned: doctor,
      admittedOn: getDateOffset(index % 4),
    };
  });
};

const buildDefaultOccupancy = (): RoomOccupancyRow[] => {
  return roomServiceRates.map((room) => {
    const defaultTotal = room.roomType === "ICU" ? 8 : room.roomType === "Private Room" ? 20 : room.roomType === "Semi-Private Room" ? 28 : 45;
    return {
      roomType: room.roomType,
      totalBeds: defaultTotal,
      occupiedBeds: Math.max(0, Math.floor(defaultTotal * 0.55)),
      reservedBeds: room.roomType === "ICU" ? 1 : 2,
    };
  });
};

const RoomOccupancy = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<RoomOccupancyRow[]>(() => {
    if (typeof window === "undefined") return buildDefaultOccupancy();

    try {
      const raw = window.localStorage.getItem(ROOM_OCCUPANCY_STORAGE_KEY);
      if (!raw) return buildDefaultOccupancy();
      const parsed = JSON.parse(raw) as RoomOccupancyRow[];
      return Array.isArray(parsed) ? parsed : buildDefaultOccupancy();
    } catch {
      return buildDefaultOccupancy();
    }
  });

  useEffect(() => {
    window.localStorage.setItem(ROOM_OCCUPANCY_STORAGE_KEY, JSON.stringify(rows));
  }, [rows]);

  const updateRow = (roomType: string, updater: (prev: RoomOccupancyRow) => RoomOccupancyRow) => {
    setRows((prev) => prev.map((row) => (row.roomType === roomType ? updater(row) : row)));
  };

  const [selectedBed, setSelectedBed] = useState<{ roomType: string; bed: BedSlot } | null>(null);

  const openDoctorProfile = (doctorName: string) => {
    navigate(`/receptionist/doctor/${encodeURIComponent(doctorName)}`);
  };

  const summary = useMemo(() => {
    const totalBeds = rows.reduce((sum, row) => sum + row.totalBeds, 0);
    const occupiedBeds = rows.reduce((sum, row) => sum + row.occupiedBeds, 0);
    const reservedBeds = rows.reduce((sum, row) => sum + row.reservedBeds, 0);
    const availableBeds = Math.max(0, totalBeds - occupiedBeds - reservedBeds);
    const occupancyRate = totalBeds === 0 ? 0 : Math.round((occupiedBeds / totalBeds) * 100);
    return { totalBeds, occupiedBeds, reservedBeds, availableBeds, occupancyRate };
  }, [rows]);

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1200px] space-y-6 animate-fade-in-up">
        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-sky-50 p-5 text-slate-900 shadow-[0_18px_45px_-34px_rgba(37,99,235,0.35)] sm:p-7">
          <h1 className="dashboard-title text-slate-900">Room Occupancy Board</h1>
          <p className="mt-1 text-sm text-slate-600">Track available, occupied, and reserved bed capacity by room category.</p>
        </section>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-blue-100 bg-white p-4"><p className="text-xs text-slate-500">Total Beds</p><p className="text-xl font-bold text-slate-900">{summary.totalBeds}</p></div>
          <div className="rounded-2xl border border-blue-100 bg-white p-4"><p className="text-xs text-slate-500">Occupied</p><p className="text-xl font-bold text-slate-900">{summary.occupiedBeds}</p></div>
          <div className="rounded-2xl border border-blue-100 bg-white p-4"><p className="text-xs text-slate-500">Reserved</p><p className="text-xl font-bold text-slate-900">{summary.reservedBeds}</p></div>
          <div className="rounded-2xl border border-blue-100 bg-white p-4"><p className="text-xs text-slate-500">Available</p><p className="text-xl font-bold text-emerald-700">{summary.availableBeds}</p></div>
          <div className="rounded-2xl border border-blue-100 bg-white p-4"><p className="text-xs text-slate-500">Occupancy</p><p className="text-xl font-bold text-blue-700">{summary.occupancyRate}%</p></div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)] sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-700">Occupied Beds</span>
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">Reserved / Booked Beds</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">Available Beds</span>
          </div>

          <div className="space-y-3">
            {rows.map((row) => {
              const available = Math.max(0, row.totalBeds - row.occupiedBeds - row.reservedBeds);
              const full = available === 0;
              const bedSlots = buildBedSlots(row);
              return (
                <div key={row.roomType} className="relative z-0 rounded-xl border border-blue-100 bg-blue-50/40 p-3 sm:p-4 overflow-visible">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{row.roomType}</p>
                      <p className={`text-xs font-semibold ${full ? "text-rose-600" : "text-emerald-700"}`}>
                        {full ? "No beds available" : `${available} beds available`}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
                      <label className="space-y-1">
                        <span className="text-slate-600">Total</span>
                        <input
                          type="number"
                          min={1}
                          value={row.totalBeds}
                          onChange={(e) => {
                            const totalBeds = Math.max(1, Number(e.target.value) || 1);
                            updateRow(row.roomType, (prev) => ({
                              ...prev,
                              totalBeds,
                              occupiedBeds: Math.min(prev.occupiedBeds, totalBeds),
                              reservedBeds: Math.min(prev.reservedBeds, totalBeds),
                            }));
                          }}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-slate-600">Occupied</span>
                        <input
                          type="number"
                          min={0}
                          max={row.totalBeds}
                          value={row.occupiedBeds}
                          onChange={(e) => {
                            const occupiedBeds = Math.max(0, Math.min(row.totalBeds, Number(e.target.value) || 0));
                            updateRow(row.roomType, (prev) => ({ ...prev, occupiedBeds }));
                          }}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-slate-600">Reserved</span>
                        <input
                          type="number"
                          min={0}
                          max={row.totalBeds}
                          value={row.reservedBeds}
                          onChange={(e) => {
                            const reservedBeds = Math.max(0, Math.min(row.totalBeds, Number(e.target.value) || 0));
                            updateRow(row.roomType, (prev) => ({ ...prev, reservedBeds }));
                          }}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="relative z-10 mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8 overflow-visible">
                    {bedSlots.map((bed) => {
                      const bedStatusClass = bed.status === "Occupied"
                        ? "border-rose-300 bg-rose-100 text-rose-700"
                        : bed.status === "Reserved"
                          ? "border-blue-300 bg-blue-100 text-blue-700"
                          : "border-emerald-300 bg-emerald-100 text-emerald-700";
                      return (
                        <button
                          key={bed.bedCode}
                          type="button"
                          onClick={() => setSelectedBed({ roomType: row.roomType, bed })}
                          className={`group relative z-10 rounded-lg border px-2 py-2 text-left text-[11px] font-semibold transition-all hover:scale-[1.02] hover:z-40 focus:z-40 ${bedStatusClass}`}
                        >
                          <p>{bed.bedCode}</p>
                          <p className="text-[10px] opacity-80">{bed.status}</p>

                          <div className="pointer-events-none absolute left-1/2 bottom-full z-[100] mb-2 hidden w-56 -translate-x-1/2 rounded-xl border border-white/60 bg-white/95 p-2.5 text-[11px] text-slate-700 shadow-[0_22px_48px_-20px_rgba(15,23,42,0.45)] backdrop-blur-md group-hover:block">
                            <p className="font-bold text-slate-800">{bed.bedCode} • {bed.status}</p>
                            {bed.status === "Available" ? (
                              <p className="mt-1 font-semibold text-emerald-700">Available for booking</p>
                            ) : (
                              <>
                                <p className="mt-1 truncate"><span className="font-semibold">Patient:</span> {bed.patientName}</p>
                                <div className="truncate">
                                  <span className="font-semibold">Doctor:</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (bed.doctorAssigned) openDoctorProfile(bed.doctorAssigned);
                                    }}
                                    className="pointer-events-auto ml-1 font-semibold text-[#2872a1] hover:underline"
                                  >
                                    {bed.doctorAssigned}
                                  </button>
                                </div>
                                <p className="truncate"><span className="font-semibold">Admitted:</span> {bed.admittedOn}</p>
                              </>
                            )}
                            <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-r border-b border-white/60 bg-white/95" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-blue-100 bg-white p-4">
            <h2 className="text-sm font-bold text-slate-800">Bed Details</h2>
            {!selectedBed ? (
              <p className="mt-2 text-sm text-slate-500">Click any bed to view patient and doctor assignment.</p>
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                <p className="font-semibold text-slate-800">{selectedBed.roomType} - {selectedBed.bed.bedCode} ({selectedBed.bed.status})</p>
                {selectedBed.bed.status === "Available" ? (
                  <p className="text-emerald-700 font-semibold">This bed is currently available for booking.</p>
                ) : (
                  <>
                    <p className="inline-flex items-center gap-1 text-slate-700"><UserRound className="h-4 w-4 text-blue-700" /> {selectedBed.bed.patientName} ({selectedBed.bed.patientId})</p>
                    <p className="inline-flex items-center gap-1 text-slate-700"><Phone className="h-4 w-4 text-blue-700" /> {selectedBed.bed.phone}</p>
                    <p className="inline-flex items-center gap-1 text-slate-700">
                      <Stethoscope className="h-4 w-4 text-blue-700" />
                      <button
                        type="button"
                        onClick={() => selectedBed.bed.doctorAssigned && openDoctorProfile(selectedBed.bed.doctorAssigned)}
                        className="font-semibold text-[#2872a1] hover:underline"
                      >
                        {selectedBed.bed.doctorAssigned}
                      </button>
                    </p>
                    <p className="inline-flex items-center gap-1 text-slate-700"><CalendarDays className="h-4 w-4 text-blue-700" /> Admitted: {selectedBed.bed.admittedOn}</p>
                    <p className="text-slate-600">Condition: {selectedBed.bed.symptoms}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RoomOccupancy;
