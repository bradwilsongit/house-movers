import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link to={createPageUrl('Home')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-500 mb-6">Last updated: February 2026</p>

          <h2>1. Information We Collect</h2>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li>Account information (name, email, phone number)</li>
            <li>Address and location data for moves</li>
            <li>Inventory and move details</li>
            <li>Payment information (processed securely by PayFast)</li>
            <li>Communications and support tickets</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Facilitate move bookings and payments</li>
            <li>Connect you with verified moving companies</li>
            <li>Send booking confirmations and updates</li>
            <li>Provide customer support</li>
            <li>Improve our services</li>
          </ul>

          <h2>3. Information Sharing</h2>
          <p>We share your information with:</p>
          <ul>
            <li>Moving companies to fulfill your bookings</li>
            <li>Payment processors for transaction processing</li>
            <li>Service providers who assist our operations</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>

          <h2>4. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information. 
            However, no method of transmission over the internet is 100% secure.
          </p>

          <h2>5. Your Rights (POPIA Compliance)</h2>
          <p>Under the Protection of Personal Information Act, you have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Withdraw consent</li>
          </ul>

          <h2>6. Data Retention</h2>
          <p>
            We retain your information for as long as your account is active or as needed to 
            provide services. We may retain certain information for legal or business purposes.
          </p>

          <h2>7. Cookies</h2>
          <p>
            We use cookies and similar technologies to improve your experience on our platform. 
            You can control cookie settings through your browser.
          </p>

          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any 
            material changes.
          </p>

          <h2>9. Contact Us</h2>
          <p>
            For privacy-related inquiries, please contact our support team through the platform 
            or email us at privacy@housemoves.co.za
          </p>
        </div>
      </div>
    </div>
  );
}