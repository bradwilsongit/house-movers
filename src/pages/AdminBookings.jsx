import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Truck, Search, Calendar, MapPin, ChevronRight,
  Clock, CheckCircle2, AlertCircle, Filter, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending_deposit: { label: 'Pending Payment', color: 'bg-gray-100 text-gray-700' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  driver_assigned: { label: 'Driver Assigned', color: 'bg-blue-100 text-blue-700' },
  on_route: { label: 'On Route', color: 'bg-blue-100 text-blue-700' },
  arrived: { label: 'Arrived', color: 'bg-amber-100 text-amber-700' },
  loading: { label: 'Loading', color: 'bg-amber-100 text-amber-700' },
  in_transit: { label: 'In Transit', color: 'bg-blue-100 text-blue-700' },
  unloading: { label: 'Unloading', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [suppliers, setSuppliers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsData, suppliersData] = await Promise.all([
        base44.entities.Booking.list('-created_date', 200),
        base44.entities.Supplier.list(),
      ]);

      setBookings(bookingsData);
      
      const supplierMap = {};
      suppliersData.forEach(s => {
        supplierMap[s.id] = s;
      });
      setSuppliers(supplierMap);
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = !searchQuery || 
      b.booking_reference?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">All Bookings</h1>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_deposit">Pending Payment</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="driver_assigned">Driver Assigned</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-500">
                {filteredBookings.length} booking{filteredBookings.length !== 1 && 's'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Reference</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Supplier</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Amount</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Payment</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map(booking => {
                    const supplier = suppliers[booking.supplier_id];
                    const status = statusConfig[booking.status] || statusConfig.confirmed;

                    return (
                      <tr key={booking.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-medium">{booking.booking_reference}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {booking.move_date 
                              ? format(new Date(booking.move_date), 'MMM d, yyyy')
                              : 'No date'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm">
                            {supplier?.company_name || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium">
                            R{booking.total_amount?.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {booking.deposit_paid ? (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Deposit
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                            {booking.balance_paid && (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Balance
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={createPageUrl('BookingDetails') + `?id=${booking.id}`}>
                              View
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredBookings.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No bookings found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}