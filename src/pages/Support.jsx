import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { 
  MessageSquare, HelpCircle, Phone, Mail, Send,
  ChevronRight, Clock, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

const faqs = [
  {
    question: 'How do I cancel my booking?',
    answer: 'You can cancel your booking from the My Moves page. Cancellations made 72 hours or more before the move date are eligible for a full deposit refund. Cancellations within 72 hours may forfeit the deposit.'
  },
  {
    question: 'What items are not allowed to be moved?',
    answer: 'Hazardous materials, flammable substances, firearms, and perishable items are not permitted. Please declare any high-value or fragile items in your inventory.'
  },
  {
    question: 'How do I add items to my inventory after booking?',
    answer: 'You can request inventory changes through your booking details page. Changes must be approved and may affect your quoted price.'
  },
  {
    question: 'What happens if my items are damaged?',
    answer: 'All our movers are insured. Report any damage immediately through the platform by creating a support ticket with photo evidence. We will mediate the claim.'
  },
  {
    question: 'How do payments work?',
    answer: '100% payment upfront secures your booking. All payments are processed securely through PayFast.'
  },
  {
    question: 'What are "extras" and how are they charged?',
    answer: 'Extras include additional materials, services, or trips not included in the original quote. All extras must be authorised by House Movers before you are charged.'
  },
];

export default function Support() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [ticketForm, setTicketForm] = useState({
    ticket_type: '',
    booking_id: '',
    supplier_id: '',
    subject: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const [userData, userBookings, allSuppliers] = await Promise.all([
          base44.auth.me(),
          base44.entities.Booking.filter({}, '-created_date', 10),
          base44.entities.Supplier.list(),
        ]);
        setUser(userData);
        setBookings(userBookings.filter(b => b.customer_id === userData.id));
        setSuppliers(allSuppliers);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      base44.auth.redirectToLogin(createPageUrl('Support'));
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await base44.entities.SupportTicket.create({
        ...ticketForm,
        customer_id: user.id,
        status: 'open',
        priority: ticketForm.ticket_type === 'damage_claim' ? 'high' : 'medium',
      });

      // Notify all admins via backend function (bypasses RLS)
      await base44.functions.invoke('notifyAdmins', {
        title: 'New Support Ticket',
        message: `A customer has raised a new support ticket: "${ticketForm.subject}"`,
        type: 'support',
        link_page: 'AdminSupport',
        link_id: ticket.id,
        emailSubject: `🎫 New Support Ticket – "${ticketForm.subject}"`,
        emailBody: `Hi {adminName},\n\nA new support ticket has been submitted by <strong>${user.full_name || 'a customer'}</strong>.\n\n<strong>Subject:</strong> ${ticketForm.subject}<br/><strong>Description:</strong> ${ticketForm.description}\n\n<a href="https://app.base44.app/AdminSupport">View in dashboard</a>`,
      });

      setSubmitted(true);
      setTicketForm({
        ticket_type: '',
        booking_id: '',
        supplier_id: '',
        subject: '',
        description: '',
      });
    } catch (e) {
      console.error('Error creating ticket:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">How can we help?</h1>
          <p className="text-gray-500">
            Find answers to common questions or get in touch with our team
          </p>
        </div>

        {/* Quick Contact */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <Card>
            <CardContent className="py-6 text-center">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-1">Live Chat</h3>
              <p className="text-sm text-gray-500">Available 8am-8pm</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-6 text-center">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-1">Call Us</h3>
              <p className="text-sm text-gray-500">0800 123 4567</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-6 text-center">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-1">Email</h3>
              <p className="text-sm text-gray-500">support@housemoves.co.za</p>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Submit Ticket */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submit a Support Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Ticket Submitted</h3>
                <p className="text-gray-500 mb-4">
                  We'll get back to you as soon as possible.
                </p>
                <Button onClick={() => setSubmitted(false)} variant="outline">
                  Submit Another Ticket
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ticket_type">Issue Type</Label>
                    <Select
                      value={ticketForm.ticket_type}
                      onValueChange={(v) => setTicketForm({ ...ticketForm, ticket_type: v })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="dispute">Dispute</SelectItem>
                        <SelectItem value="damage_claim">Damage Claim</SelectItem>
                        <SelectItem value="refund_request">Refund Request</SelectItem>
                        <SelectItem value="complaint">Complaint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {bookings.length > 0 && (
                    <div>
                      <Label htmlFor="booking_id">Related Booking (Optional)</Label>
                      <Select
                        value={ticketForm.booking_id}
                        onValueChange={(v) => setTicketForm({ ...ticketForm, booking_id: v })}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select booking" />
                        </SelectTrigger>
                        <SelectContent>
                          {bookings.map(b => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.booking_reference}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  </div>

                  <div>
                    <Label htmlFor="supplier_id">Supplier (Optional)</Label>
                    <Select
                      value={ticketForm.supplier_id || ''}
                      onValueChange={(v) => setTicketForm({ ...ticketForm, supplier_id: v })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                    className="mt-1.5"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    placeholder="Please provide as much detail as possible..."
                    className="mt-1.5"
                    rows={5}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting || !ticketForm.ticket_type || !ticketForm.subject || !ticketForm.description}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {submitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}