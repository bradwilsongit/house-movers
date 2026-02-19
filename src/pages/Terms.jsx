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

        <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
        <p className="text-gray-500 mb-8">Last updated: February 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <p>
            House Movers and their partners are the leaders in service relocation and are committed to prompt, efficient and friendly service. The following terms and conditions will aid us in facilitating a successful furniture removal.
          </p>
          <p className="font-medium">Please ensure that the terms and conditions are strongly adhered to at all times.</p>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-3">1. Inventory Listed Items</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>It is important to be meticulous in compiling your inventory list. All items that require transportation must be indicated on your inventory list.</li>
              <li>Please inform us of any changes to your inventory list in advance as it will ensure that the appropriate vehicle and crew is reserved to facilitate your move efficiently.</li>
              <li>All changes must be made in writing and sent to us via email.</li>
              <li>Only items indicated on your inventory list will be transported / moved.</li>
              <li>No negotiations regarding work not quoted for with crew / staff / workforce will be tolerated and if caught, the crew will be dismissed.</li>
              <li>Changes on your inventory will have cost implications.</li>
              <li>All items must be of a nature that 4 men are able to carry and load.</li>
              <li>Owner packed cartons with fragile items must be clearly marked.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-3">2. Special Wrapping of Your Valuables</h2>
            <p>This service comes highly recommended for the protection of your belongings. Please ask your consultant for more information.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-3">3. Accessibility</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>The accessibility of your premises is of utmost importance.</li>
              <li>Please assess the accessibility of your premises and indicate it clearly on the inventory list documents. This includes height (trees and branches), width and tonnage restrictions.</li>
              <li>Should you be a resident in an estate or complex, please consult your body corporate for help on accessibility.</li>
              <li>If any uncertainty arises about access to your premises, please notify us prior to your move.</li>
              <li>Should the distance from our truck to your front door exceed 65 meters there will be cost implications, calculated on the size of the load and the distance your goods should be carried / shuttled.</li>
              <li>Please arrange for suitable parking for the removal truck.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-3">4. Arrival Time</h2>
            <p>Times for arrival of the vehicle are given as an estimate only. We will do our best to keep to the schedule given, but please note we are driving trucks so there are many variables that influence our arrival times — for example, accidents on the roads, traffic, "Stop and Goes", truck restrictions, clients having more items than indicated, weighbridges, or trucks getting stuck in bad weather conditions.</p>
            <p className="mt-2">Your patience in this regard is highly appreciated.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-3">5. Transportation of Your Goods</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>All electrical and plumbing must be disconnected prior to your move.</li>
              <li>All items must be properly packed by the time of the move as no unpacked goods will be moved / handled / transported.</li>
              <li>All owner packed cartons must be properly sealed with adhesive tape.</li>
              <li>Please ensure that all items listed on your inventory list are loaded by our team prior to departure of the vehicle as House Movers or their partners will not return for "forgotten items".</li>
              <li>Please inspect the vehicle subsequent to the offloading for goods which might have stayed behind.</li>
              <li>Please complete our removal quality control forms — this will assist us in keeping our staff up to standard.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-3">6. Pot Plants</h2>
            <p>All leaves and branches must be bound by the client.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-3">7. Storage</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Our partnering storage facilities are clean and have guards on duty 24 hours a day.</li>
              <li>We offer no insurance on goods in storage whatsoever. Should you require insurance for goods in storage, please make arrangements with your own insurance company.</li>
              <li>Goods in storage will be sold to defray costs on all storage accounts in excess of 120 days.</li>
              <li>A general price increase of storage fees may occur on 1 March each year.</li>
              <li>No alcoholic beverages are to be served / handed to our staff.</li>
              <li>Neither House Movers, their partners, nor staff members will in any way be held responsible for damages of any kind not covered by relevant insurance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-3">8. Payment & Company Policy</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>100% payment is required on acceptance of quote.</li>
              <li>Additional loads thereafter will incur additional charges, to be determined based on the nature and size of the additional items being transported.</li>
              <li>72 hours notice of cancellation is required.</li>
              <li>Times are fixed but may vary due to the nature of business.</li>
              <li>Items not specified on the inventory will be charged for accordingly.</li>
              <li>On acceptance of the quotation you agree that you have read and understood our terms and conditions.</li>
              <li>Goods remain the property of House Movers until full payment is received.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-3">9. Service Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Our trucks are insulated to protect your personal belongings.</li>
              <li>We have trained staff, most importantly our packers.</li>
              <li>Our packers use packing blankets to protect your personal belongings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-3">10. Subcontracting</h2>
            <p>House Movers reserves the right to subcontract any or all of the services outlined in this agreement to third-party service providers, as deemed necessary for the completion of the relocation process.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-3">11. Insurance</h2>
            <p>It is the customer's responsibility to ensure adequate insurance coverage for their belongings during the moving process. House Movers and their partners shall provide information about insurance options available but shall not be responsible for any uninsured losses.</p>
            <p className="mt-2">Contents of boxes packed by the client are not covered by insurance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-3">12. Liability Limitation</h2>
            <p>In the event of rain, the move will continue as planned and all precautions will be taken to protect your items.</p>
            <p className="mt-2">House Movers and their partners shall not be liable for any damages caused by acts of nature, including but not limited to earthquakes, floods, or storms, nor for damages resulting from the inherent nature of the items being moved, such as fragile or perishable goods.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-3">13. Additional Charges</h2>
            <p>The following services will incur additional charges:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>All dismantling of furniture</li>
              <li>Hoisting of furniture</li>
              <li>Shuttle services</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}