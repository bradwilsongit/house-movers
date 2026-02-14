import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Truck, Building2, DollarSign, Users, TrendingUp, 
  AlertCircle, Clock, CheckCircle2, ChevronRight, Package, Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    pendingSuppliers: 0,
    pendingExtras: 0,
    revenue: 0,
    suppliers: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [pendingSuppliers, setPendingSuppliers] = useState([]);
  const [pendingExtras, setPendingExtras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [bookings, suppliers, extras] = await Promise.all([
        base44.entities.Booking.list('-created_date', 100),
        base44.entities.Supplier.list('-created_date', 50),
        base44.entities.ExtraRequest.filter({ status: 'pending' }, '-created_date', 20),
      ]);

      setRecentBookings(bookings.slice(0, 10));
      setPendingSuppliers(suppliers.filter(s => s.status === 'pending'));
      setPendingExtras(extras);

      const activeBookings = bookings.filter(b => 
        !['completed', 'cancelled'].includes(b.status)
      );
      const revenue = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);

      setStats({
        totalBookings: bookings.length,
        activeBookings: activeBookings.length,
        pendingSuppliers: suppliers.filter(s => s.status === 'pending').length,
        pendingExtras: extras.length,
        revenue,
        suppliers: suppliers.filter(s => s.status === 'approved').length,
      });
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to={createPageUrl('AdminCommission')}>
                <Percent className="w-4 h-4 mr-2" />
                Commission Settings
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              Last updated: {format(new Date(), 'HH:mm')}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(stats.pendingSuppliers > 0 || stats.pendingExtras > 0) && (
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {stats.pendingSuppliers > 0 && (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-amber-900">
                          {stats.pendingSuppliers} Supplier{stats.pendingSuppliers > 1 ? 's' : ''} Pending
                        </p>
                        <p className="text-sm text-amber-700">Requires review</p>
                      </div>
                    </div>
                    <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700">
                      <Link to={createPageUrl('AdminSuppliers')}>Review</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {stats.pendingExtras > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">
                          {stats.pendingExtras} Extra Request{stats.pendingExtras > 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-blue-700">Awaiting authorisation</p>
                      </div>
                    </div>
                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Link to={createPageUrl('AdminExtras')}>Review</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-3xl font-bold">R{stats.revenue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Bookings</p>
                  <p className="text-3xl font-bold">{stats.totalBookings}</p>
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
                  <p className="text-sm text-gray-500">Active Moves</p>
                  <p className="text-3xl font-bold">{stats.activeBookings}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Suppliers</p>
                  <p className="text-3xl font-bold">{stats.suppliers}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Bookings</CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link to={createPageUrl('AdminBookings')}>
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentBookings.slice(0, 5).map(booking => (
                  <div 
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{booking.booking_reference}</p>
                      <p className="text-sm text-gray-500">
                        {booking.move_date 
                          ? format(new Date(booking.move_date), 'MMM d, yyyy')
                          : 'No date'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R{booking.total_amount?.toLocaleString()}</p>
                      <Badge variant="outline" className="capitalize">
                        {booking.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Suppliers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pending Suppliers</CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link to={createPageUrl('AdminSuppliers')}>
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pendingSuppliers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending applications
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingSuppliers.slice(0, 5).map(supplier => (
                    <div 
                      key={supplier.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{supplier.company_name}</p>
                        <p className="text-sm text-gray-500">
                          {supplier.contact_email}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}