import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Compass, Sparkles } from 'lucide-react';
import { useCampusRoute, useBooking, useAuth, useTheme } from '../../../hooks';
import { RouteTopology, RouteSummary } from '../../../components/route';
import { Button, Breadcrumbs, Skeleton, ErrorMessage } from '../../../components/common';
import { recordAuditLog } from '../../../services/supabase/auditLog.service';

export const CampusRoutePage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { isGoldPink, isEmeraldMint } = useTheme();
  const basePrefix = role === 'admin' ? '/admin' : role === 'faculty' ? '/faculty' : '/student';

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const { data: booking } = useBooking(bookingId);
  const { data: route, isLoading, error, refetch, isRefetching } = useCampusRoute(bookingId);

  // Broadcast route navigation start event with user email
  React.useEffect(() => {
    if (route && user?.email) {
      recordAuditLog({
        action: 'CAMPUS_WAYFINDING_ROUTE_ACCESSED',
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        actorEmail: user.email,
        correlationId: `corr-route-${bookingId || 'direct'}-${Date.now()}`,
        after: {
          bookingId,
          source: route.source,
          destination: route.destination,
          email: user.email,
          userEmail: user.email,
          actorEmail: user.email,
          timestamp: new Date().toISOString(),
        },
      }).catch((e) => console.warn('Supabase route audit notice:', e));
    }
  }, [route?.destination, user?.email, bookingId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="space-y-4">
        <Breadcrumbs
          items={[
            { label: 'Bookings', href: `${basePrefix}/bookings` },
            { label: 'Campus Route' },
          ]}
        />
        <ErrorMessage
          title="Wayfinding Graph Unavailable"
          message="Could not compute topology path for this booking."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Header card styled strictly as per theme
  const headerCardClasses = isGoldPink
    ? 'bg-white/85 border border-pink-200/80 shadow-md backdrop-blur-md'
    : isEmeraldMint
    ? 'bg-slate-900/75 border border-emerald-500/25 shadow-xl backdrop-blur-xl'
    : 'glass-panel border border-slate-800 shadow-xl backdrop-blur-xl';

  const titleColor = isGoldPink ? 'text-slate-900' : 'text-white';
  const subtitleColor = isGoldPink ? 'text-slate-600' : 'text-slate-400';
  const destHighlightColor = isGoldPink ? 'text-pink-600 font-bold' : isEmeraldMint ? 'text-emerald-300' : 'text-indigo-300';
  const compassColor = isGoldPink ? 'text-pink-500' : isEmeraldMint ? 'text-emerald-400' : 'text-indigo-400';

  const liveBadgeClasses = isGoldPink
    ? 'bg-pink-100 text-pink-700 border-pink-200'
    : isEmeraldMint
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header - Styled as per selected theme */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl ${headerCardClasses}`}
      >
        <div>
          <Breadcrumbs
            items={[
              {
                label: booking ? 'Bookings' : 'Laboratories',
                href: `${basePrefix}/${booking ? 'bookings' : 'labs'}`,
              },
              ...(booking
                ? [{ label: booking.bookingId, href: `${basePrefix}/bookings/${bookingId}` }]
                : []),
              { label: 'Campus Map & Route' },
            ]}
          />
          <h1 className={`text-2xl font-bold tracking-tight mt-1 flex items-center gap-2 ${titleColor}`}>
            <Compass className={`w-6 h-6 animate-spin-slow ${compassColor}`} />
            <span>Campus Wayfinding Navigation</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border font-mono flex items-center gap-1 ${liveBadgeClasses}`}
            >
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
              <span>NES Panda Live Track</span>
            </span>
          </h1>
          <p className={`text-xs mt-0.5 ${subtitleColor}`}>
            Real-time interactive shortest path guidance from{' '}
            <strong className={isGoldPink ? 'text-slate-800' : 'text-white'}>{route.source}</strong> to{' '}
            <strong className={destHighlightColor}>{route.destination}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStepIndex(0);
              refetch();
            }}
            isLoading={isRefetching}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Recalculate Route
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (booking) navigate(`${basePrefix}/bookings/${bookingId}`);
              else navigate(`${basePrefix}/labs`);
            }}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            {booking ? 'Back to Booking' : 'Back to Labs'}
          </Button>
        </div>
      </div>

      {/* Campus Wayfinding Graph - Attractive Gold-Pink Canvas Kept As Is */}
      <RouteTopology
        nodes={route.nodes}
        edges={route.edges}
        activePath={route.path}
        sourceNodeId={route.path[0]}
        destinationNodeId={route.path[route.path.length - 1]}
        currentStepIndex={currentStepIndex}
        onStepChange={setCurrentStepIndex}
      />

      {/* Turn-by-Turn Waypoints - Styled as per selected theme */}
      <RouteSummary
        route={route}
        currentStepIndex={currentStepIndex}
        onStepChange={setCurrentStepIndex}
      />
    </div>
  );
};
