import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Terms &amp; Conditions</h1>
            <p className="text-gray-500 text-sm">Last updated: February 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing or using our platform, you agree to be bound by these Terms &amp; Conditions. If you do not agree, please do not use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Services</h2>
            <p className="text-gray-600 leading-relaxed">
              We operate as a marketplace connecting customers with independent moving companies (suppliers). We do not directly provide moving services. All moving services are carried out by independent suppliers who have agreed to our supplier terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Bookings &amp; Payments</h2>
            <p className="text-gray-600 leading-relaxed">
              All bookings are subject to availability. Payment is required in full at the time of booking. Prices quoted include a platform service fee. We reserve the right to adjust pricing in the event of errors or changes in supplier rates.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Your selected move date may not always be available. If the date cannot be accommodated, a full refund will be initiated within 24 hours of confirmation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Cancellation Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              Cancellations made more than 72 hours before the scheduled move date are eligible for a full refund. Cancellations made within 72 hours of the move date may be subject to a cancellation fee of up to 50% of the total booking value. No refunds will be issued for cancellations made on the day of the move.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Inventory &amp; Items</h2>
            <p className="text-gray-600 leading-relaxed">
              Only items listed in the agreed inventory will be moved. Customers are responsible for ensuring the inventory is accurate and complete. Additional items not listed may incur extra charges, which must be authorised before the move takes place.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              Our platform acts solely as an intermediary. We are not liable for any loss, damage, or injury arising from the provision of moving services by suppliers. Customers are encouraged to ensure adequate insurance coverage for their belongings.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Any damage claims must be reported within 24 hours of the move being completed. Claims submitted after this period may not be considered.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Time Windows</h2>
            <p className="text-gray-600 leading-relaxed">
              Time windows selected during booking are preferences only and are not guaranteed. Suppliers will make every effort to arrive within the selected window, but delays may occur due to factors outside their control.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Extra Charges</h2>
            <p className="text-gray-600 leading-relaxed">
              Any additional charges incurred during the move (e.g., additional materials, extra trips) must be authorised by our platform before payment is processed. Unauthorised charges will not be accepted.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Disputes</h2>
            <p className="text-gray-600 leading-relaxed">
              In the event of a dispute, customers should contact our support team within 48 hours of the move completion. We will investigate and mediate between the customer and supplier to reach a fair resolution.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              Your use of our platform is also governed by our{' '}
              <Link to={createPageUrl('Privacy')} className="underline text-black hover:text-gray-700">Privacy Policy</Link>.
              By using our services, you consent to the collection and use of your data as described therein.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">11. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to update these Terms &amp; Conditions at any time. Continued use of our platform after changes are published constitutes acceptance of the updated terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">12. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For any questions regarding these terms, please contact our support team through the platform's support page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}