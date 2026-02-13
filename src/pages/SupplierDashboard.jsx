import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Truck, Calendar, MapPin, Clock, DollarSign, Star,
  CheckCircle2, AlertCircle, ChevronRight, TrendingUp, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function SupplierDashboard() {
  const [user, setUser] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    completed: 0,
    earnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(createPageUrl('SupplierDashboard'));
        return;
      }

      const userData = await base44.auth.me();
      setUser(userData);

      if (userData.supplier_id) {
        const suppliers = await base44.entities.Supplier.filter({ id: userData.supplier_id });
        if (suppliers.length > 0) {
          setSupplier(suppliers[0]);

          // Load bookings for this supplier
          const supplierBookings = await base44.entities.Booking.filter(
            { supplier_id: suppliers[0].id },
            '-created_date'
          );
          setBookings(supplierBookings);

          // Calculate stats
          const pending = supplierBookings.filter(b => 
            ['pending_deposit', 'confirmed'].includes(b.status)
          ).length;
          const active = supplierBookings.filter(b => 
            ['driver_assigned', 'on_route', 'arrived', 'loading', 'in_transit', 'unloading'].includes(b.status)
          ).length;
          const completed = supplierBookings.filter(b => b.status === 'completed').length;
          const earnings = supplierBookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + (b.total_amount || 0), 0);

          setStats({ pending, active, completed, earnings });
        }
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid sm:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Supplier Profile</h2>
          <p className="text-gray-500 mb-6">
            You haven't set up your supplier profile yet.
          </p>
          <Button asChild className="bg-black text-white hover:bg-gray-800">
            <Link to={createPageUrl('SupplierOnboarding')}>
              Complete Onboarding
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const pendingApproval = supplier.status === 'pending';
  const upcomingBookings = bookings.filter(b => 
    ['pending_deposit', 'confirmed', 'driver_assigned', 'on_route'].includes(b.status)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{supplier.company_name}</h1>
            <div className="flex items-center gap-3 mt-1">
              {supplier.status === 'approved' ? (
                <Badge className="bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Approved
                </Badge>
              ) : supplier.status === 'pending' ? (
                <Badge className="bg-amber-100 text-amber-700">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending Approval
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Suspended
                </Badge>
              )}
              {supplier.rating_average > 0 && (
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {supplier.rating_average.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <Button asChild variant="outline">
            <Link to={createPageUrl('SupplierProfile')}>
              Edit Profile
            </Link>
          </Button>
        </div>

        {/* Pending Approval Alert */}
        {pendingApproval && (
          <Card className="bg-amber-50 border-amber-200 mb-8">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">Application Under Review</p>
                  <p className="text-sm text-amber-700">
                    Your application is being reviewed by our team. This usually takes 1-2 business days.
                    You'll receive an email once approved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Jobs</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Jobs</p>
                  <p className="text-3xl font-bold">{stats.active}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Earnings</p>
                  <p className="text-3xl font-bold">R{stats.earnings.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Jobs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Upcoming Jobs</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link to={createPageUrl('SupplierJobs')}>
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No upcoming jobs</p>
                {pendingApproval && (
                  <p className="text-sm text-gray-400 mt-1">
                    Jobs will appear here once you're approved
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.slice(0, 5).map(booking => (
                  <Link 
                    key={booking.id}
                    to={createPageUrl('SupplierJobDetails') + `?id=${booking.id}`}
                  >
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {booking.move_date 
                              ? format(new Date(booking.move_date), 'EEE, MMM d')
                              : 'Date TBD'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Ref: {booking.booking_reference}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">R{booking.total_amount?.toLocaleString()}</p>
                        <Badge variant="outline" className="capitalize">
                          {booking.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        {supplier.status === 'approved' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">On-Time Rate</span>
                    <span className="font-medium">{supplier.on_time_rate || 100}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${supplier.on_time_rate || 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Completion Rate</span>
                    <span className="font-medium">{supplier.completion_rate || 100}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${supplier.completion_rate || 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Dispute Rate</span>
                    <span className="font-medium">{supplier.dispute_rate || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${supplier.dispute_rate || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}