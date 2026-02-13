import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Terms() {
  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link to={createPageUrl('Home')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-8">Terms & Conditions</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-500 mb-6">Last updated: February 2026</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using the House Moves platform, you agree to be bound by these 
            Terms and Conditions. If you do not agree to these terms, please do not use our services.
          </p>

          <h2>2. Platform Services</h2>
          <p>
            House Moves provides a marketplace platform that connects customers with verified 
            moving companies. We facilitate bookings, payments, and communication between parties.
          </p>
          <ul>
            <li>Customers can request quotes, book moves, and pay through the platform</li>
            <li>Moving companies (Suppliers) can receive job requests and fulfill moves</li>
            <li>House Moves manages quality control and dispute resolution</li>
          </ul>

          <h2>3. User Accounts</h2>
          <p>
            Users must provide accurate information when creating an account. You are responsible 
            for maintaining the security of your account credentials.
          </p>

          <h2>4. Booking Process</h2>
          <h3>4.1 Inventory Requirements</h3>
          <p>
            Only items listed in your inventory will be moved. Any changes to your inventory 
            must be submitted through the platform and approved before the move date.
          </p>
          
          <h3>4.2 Payment Terms</h3>
          <ul>
            <li>A 50% deposit is required to confirm a booking</li>
            <li>The remaining 50% balance is due when the mover arrives</li>
            <li>Additional charges (extras) require House Moves authorisation</li>
          </ul>

          <h3>4.3 Cancellation Policy</h3>
          <p>
            Cancellations made 72 hours or more before the move date are eligible for a full 
            deposit refund. Cancellations within 72 hours may forfeit the deposit.
          </p>

          <h2>5. Supplier Obligations</h2>
          <p>Suppliers agree to:</p>
          <ul>
            <li>Maintain valid insurance and comply with all regulations</li>
            <li>Provide driver details before each move</li>
            <li>Only move inventoried items</li>
            <li>Request authorisation for any additional charges</li>
          </ul>

          <h2>6. Limitation of Liability</h2>
          <p>
            House Moves acts as a marketplace platform. While we vet all suppliers, we are not 
            directly liable for damages during moves. Disputes should be raised through the platform.
          </p>

          <h2>7. Dispute Resolution</h2>
          <p>
            Any disputes between customers and suppliers should be reported through the platform. 
            House Moves will mediate disputes and may take action including refunds or supplier penalties.
          </p>

          <h2>8. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the platform after 
            changes constitutes acceptance of the new terms.
          </p>

          <h2>9. Contact</h2>
          <p>
            For questions about these terms, please contact our support team through the platform.
          </p>
        </div>
      </div>
    </div>
  );
}