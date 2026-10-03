import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Sparkles,
  Users,
  ChevronRight,
  Shield,
  ArrowRight,
  X,
  PlusCircle,
  Laptop,
} from 'lucide-react';
import { useDailySlots, useTheme, useAuth } from '../../hooks';
import { DailySlot, SlotStatus } from '../../types';
import { Button, useToast } from '../common';

interface RealTimeDailyLabSlotsProps {
  initialLabId?: string;
  compact?: boolean;
}

export const RealTimeDailyLabSlots: React.FC<RealTimeDailyLabSlotsProps> = ({
  initialLabId,
  compact = false,
}) => {
  const {
    slots,
    metrics,
    isLoading,
    isRefreshing,
    lastUpdated,
    selectedDate,
    setSelectedDate,
    selectedLabId,
    setSelectedLabId,
    selectedStatus,
    setSelectedStatus,
    refresh,
    bookSlot,
    releaseSlot,
  } = useDailySlots(undefined, initialLabId);

  const { isGoldPink } = useTheme();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<DailySlot | null>(null);
  const [selectedSlotForDetails, setSelectedSlotForDetails] = useState<DailySlot | null>(null);
  const [bookingPurpose, setBookingPurpose] = useState('Academic Practical Session');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group slots by Lab
  const labsMap = new Map<string, { labCode: string; labName: string; building: string; capacity: number; slots: DailySlot[] }>();

  const filteredSlots = slots.filter((slot) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      slot.labName.toLowerCase().includes(q) ||
      slot.labCode.toLowerCase().includes(q) ||
      slot.timeRange.toLowerCase().includes(q) ||
      (slot.purpose && slot.purpose.toLowerCase().includes(q)) ||
      (slot.bookedBy?.name && slot.bookedBy.name.toLowerCase().includes(q))
    );
  });

  filteredSlots.forEach((slot) => {
    if (!labsMap.has(slot.labId)) {
      labsMap.set(slot.labId, {
        labCode: slot.labCode,
        labName: slot.labName,
        building: slot.building,
        capacity: slot.capacity,
        slots: [],
      });
    }
    labsMap.get(slot.labId)?.slots.push(slot);
  });

  // Sort slots inside each lab by slotIndex
  labsMap.forEach((val) => {
    val.slots.sort((a, b) => a.slotIndex - b.slotIndex);
  });

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotForBooking) return;

    setIsSubmitting(true);
    try {
      await bookSlot(selectedSlotForBooking.slotId, bookingPurpose, [
        `Workstation Allocation (${selectedSlotForBooking.labCode})`,
      ]);
      addToast({
        type: 'success',
        title: 'Timing Slot Booked in Real-Time!',
        message: `${selectedSlotForBooking.labName} (${selectedSlotForBooking.timeRange}) is now reserved.`,
      });
      setSelectedSlotForBooking(null);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Booking Conflict',
        message: err.message || 'Could not complete booking',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRelease = async (slot: DailySlot) => {
    setIsSubmitting(true);
    try {
      await releaseSlot(slot.slotId);
      addToast({
        type: 'success',
        title: 'Timing Slot Released',
        message: `${slot.labName} (${slot.timeRange}) is once again available in the inventory.`,
      });
      setSelectedSlotForDetails(null);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Could not release slot',
        message: err.message || 'Failed to release slot',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick dates
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Top Banner & Telemetry Bar */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all ${
          isGoldPink
            ? 'bg-rose-50/90 border-pink-200/90 shadow-lg shadow-pink-500/5'
            : 'bg-slate-900/90 border-slate-800 shadow-xl'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Real-Time Slots
              </span>

              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated: {lastUpdated}
              </span>
            </div>

            <h2
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                isGoldPink ? 'text-slate-900' : 'text-white'
              }`}
            >
              Daily Lab Availability & Timing Slots
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Track live lab occupancy, inspect booked academic sessions, and instantly claim free time slots in real time.
            </p>
          </div>

          {/* Quick Date Buttons & Refresh */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div
              className={`flex items-center p-1 rounded-xl border ${
                isGoldPink ? 'bg-white border-pink-200' : 'bg-slate-800/80 border-slate-700'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDate === todayStr
                    ? isGoldPink
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                      : 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(tomorrowStr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDate === tomorrowStr
                    ? isGoldPink
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                      : 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tomorrow
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`ml-2 px-2.5 py-1 text-xs rounded-lg border font-mono ${
                  isGoldPink
                    ? 'bg-rose-50 border-pink-200 text-slate-800'
                    : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Sync
            </Button>
          </div>
        </div>

        {/* Real-Time Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              isGoldPink ? 'bg-white/80 border-pink-100' : 'bg-slate-800/60 border-slate-700/60'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Total Slots ({selectedDate})
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-400">
                {metrics?.totalSlots || slots.length}
              </span>
              <span className="text-[10px] text-slate-400">8 slots/lab</span>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border transition-all ${
              isGoldPink ? 'bg-white/80 border-pink-100' : 'bg-slate-800/60 border-slate-700/60'
            }`}
          >
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
              Available Slots
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">
                {metrics?.availableSlots ?? slots.filter((s) => s.status === 'available').length}
              </span>
              <span className="text-[10px] text-emerald-500 font-medium">Ready to reserve</span>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border transition-all ${
              isGoldPink ? 'bg-white/80 border-pink-100' : 'bg-slate-800/60 border-slate-700/60'
            }`}
          >
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block mb-1">
              Booked / Occupied
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-400">
                {metrics?.bookedSlots ?? slots.filter((s) => s.status === 'booked').length}
              </span>
              <span className="text-[10px] text-rose-300 font-medium">Active sessions</span>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border transition-all ${
              isGoldPink ? 'bg-white/80 border-pink-100' : 'bg-slate-800/60 border-slate-700/60'
            }`}
          >
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block mb-1">
              Occupancy Rate
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">
                {metrics?.occupancyRate ?? 0}%
              </span>
              <span className="text-[10px] text-slate-400">Real-time load</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search lab, timing, booker or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border transition-colors ${
              isGoldPink
                ? 'bg-white border-pink-200 text-slate-800 focus:border-pink-500'
                : 'bg-slate-800/80 border-slate-700 text-slate-200 focus:border-indigo-500'
            }`}
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Slots' },
            { id: 'available', label: 'Available Only' },
            { id: 'booked', label: 'Booked Only' },
            { id: 'maintenance', label: 'Maintenance' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStatus === st.id
                  ? isGoldPink
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'bg-indigo-600 text-white shadow-sm'
                  : isGoldPink
                  ? 'bg-white/80 text-slate-600 hover:bg-pink-100/60 border border-pink-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timetable Matrix */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
          <p className="text-xs">Loading real-time lab timing slots...</p>
        </div>
      ) : labsMap.size === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-700 text-slate-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
          <p className="text-sm font-semibold">No lab slots match the current filter or date.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedStatus('all');
              setSelectedLabId('all');
              setSearchQuery('');
            }}
            className="mt-3"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(labsMap.entries()).map(([labId, labData]) => {
            const availableCount = labData.slots.filter((s) => s.status === 'available').length;
            const bookedCount = labData.slots.filter((s) => s.status === 'booked').length;

            return (
              <div
                key={labId}
                className={`rounded-2xl border overflow-hidden transition-all ${
                  isGoldPink
                    ? 'bg-white/90 border-pink-200 shadow-md shadow-pink-500/5'
                    : 'bg-slate-900/90 border-slate-800 shadow-lg'
                }`}
              >
                {/* Lab Header */}
                <div
                  className={`px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isGoldPink ? 'bg-pink-50/70 border-pink-200' : 'bg-slate-800/50 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wider ${
                        isGoldPink ? 'bg-pink-600 text-white' : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {labData.labCode}
                    </span>
                    <div>
                      <h3
                        className={`text-sm sm:text-base font-bold ${
                          isGoldPink ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {labData.labName}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {labData.building} · Capacity: {labData.capacity} Workstations
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
                    <span className="px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      {availableCount} Available
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-400">
                      {bookedCount} Booked
                    </span>
                  </div>
                </div>

                {/* Timing Slots Grid */}
                <div className="p-4 sm:p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {labData.slots.map((slot) => {
                      const isAvailable = slot.status === 'available';
                      const isBooked = slot.status === 'booked';
                      const isMaintenance = slot.status === 'maintenance';

                      return (
                        <div
                          key={slot.slotId}
                          onClick={() => {
                            if (isAvailable) {
                              setSelectedSlotForBooking(slot);
                            } else {
                              setSelectedSlotForDetails(slot);
                            }
                          }}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${
                            isAvailable
                              ? isGoldPink
                                ? 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/10'
                                : 'bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-500/60 hover:bg-emerald-950/30'
                              : isBooked
                              ? isGoldPink
                                ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
                                : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                              : isGoldPink
                              ? 'bg-amber-50/60 border-amber-200 text-amber-800'
                              : 'bg-amber-950/20 border-amber-800/40'
                          }`}
                        >
                          {/* Top row: Timing & Status Badge */}
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="font-mono text-xs font-bold text-slate-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {slot.startTime} - {slot.endTime}
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isAvailable
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : isBooked
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {isAvailable ? 'Free' : isBooked ? 'Booked' : 'Offline'}
                            </span>
                          </div>

                          {/* Middle: Content details */}
                          <div className="min-h-[44px] flex flex-col justify-center">
                            {isAvailable ? (
                              <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Click to Reserve Slot</span>
                              </div>
                            ) : isBooked ? (
                              <div className="space-y-0.5">
                                <p className="text-xs font-semibold text-slate-200 line-clamp-1">
                                  {slot.bookedBy?.name || 'Academic Batch'}
                                </p>
                                <p className="text-[10px] text-slate-400 line-clamp-1">
                                  {slot.purpose || 'Course Session'}
                                </p>
                              </div>
                            ) : (
                              <p className="text-[11px] text-amber-400 font-medium line-clamp-1">
                                {slot.purpose || 'Hardware Maintenance'}
                              </p>
                            )}
                          </div>

                          {/* Bottom metadata */}
                          <div className="mt-2 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Slot #{slot.slotIndex}</span>
                            <span className="capitalize">{slot.bookedBy?.role || 'Available'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {selectedSlotForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
              isGoldPink
                ? 'bg-rose-50/95 border-pink-200 text-slate-800'
                : 'bg-slate-900 border-slate-700 text-slate-100'
            }`}
          >
            <div
              className={`px-6 py-4 border-b flex items-center justify-between ${
                isGoldPink ? 'bg-pink-100/60 border-pink-200' : 'bg-slate-800/60 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-bold text-base">Reserve Timing Slot</h3>
              </div>
              <button
                onClick={() => setSelectedSlotForBooking(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Laboratory:</span>
                  <span className="font-bold text-white">{selectedSlotForBooking.labName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timing Slot:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {selectedSlotForBooking.timeRange}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-mono text-slate-300">{selectedSlotForBooking.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Workstation Capacity:</span>
                  <span className="text-slate-300">{selectedSlotForBooking.capacity} Units</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Academic Purpose / Session Details
                </label>
                <select
                  value={bookingPurpose}
                  onChange={(e) => setBookingPurpose(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${
                    isGoldPink
                      ? 'bg-white border-pink-200 text-slate-800'
                      : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                >
                  <option value="Operating Systems Kernel Compilation Practical">
                    Operating Systems Kernel Compilation Practical
                  </option>
                  <option value="Distributed Database & SQL Optimization Lab">
                    Distributed Database & SQL Optimization Lab
                  </option>
                  <option value="AI Deep Learning & Model Training Run">
                    AI Deep Learning & Model Training Run
                  </option>
                  <option value="Final Year Capstone Project Development">
                    Final Year Capstone Project Development
                  </option>
                  <option value="Independent Research & Simulation">
                    Independent Research & Simulation
                  </option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
                <span className="font-semibold block mb-0.5">Instant Reservation:</span>
                Your reservation will be confirmed with atomic slot locking and will immediately show as booked across all campus members.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSlotForBooking(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Confirm & Reserve
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slot Details & Release Modal */}
      {selectedSlotForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
              isGoldPink
                ? 'bg-rose-50/95 border-pink-200 text-slate-800'
                : 'bg-slate-900 border-slate-700 text-slate-100'
            }`}
          >
            <div
              className={`px-6 py-4 border-b flex items-center justify-between ${
                isGoldPink ? 'bg-pink-100/60 border-pink-200' : 'bg-slate-800/60 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Slot Reservation Details</h3>
              </div>
              <button
                onClick={() => setSelectedSlotForDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                  <span className="font-bold text-white text-sm">
                    {selectedSlotForDetails.labName} ({selectedSlotForDetails.labCode})
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {selectedSlotForDetails.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Timing Slot:</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {selectedSlotForDetails.timeRange}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-mono text-slate-300">{selectedSlotForDetails.date}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Booked By:</span>
                  <span className="font-semibold text-white">
                    {selectedSlotForDetails.bookedBy?.name || 'Campus Member'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-mono text-slate-300">
                    {selectedSlotForDetails.bookedBy?.email || 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Role:</span>
                  <span className="capitalize font-semibold text-amber-400">
                    {selectedSlotForDetails.bookedBy?.role || 'User'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-700">
                  <span className="text-slate-400 block mb-1">Purpose / Session Notes:</span>
                  <p className="text-slate-200 font-medium bg-slate-900/60 p-2 rounded-lg">
                    {selectedSlotForDetails.purpose || 'No description provided'}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSlotForDetails(null)}
                >
                  Close
                </Button>

                {selectedSlotForDetails.status === 'booked' && (
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={isSubmitting}
                    onClick={() => handleConfirmRelease(selectedSlotForDetails)}
                  >
                    Release / Free Slot
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
