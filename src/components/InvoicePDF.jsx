import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generateInvoicePDF = async (booking, moveRequest, supplier, quote) => {
  const element = document.createElement('div');
  element.innerHTML = `
    <div style="font-family: Arial, sans-serif; padding: 40px; width: 800px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <h1 style="margin: 0; font-size: 24px;">INVOICE</h1>
          <p style="margin: 5px 0; color: #666;">Reference: ${booking.booking_reference}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 14px;"><strong>Date:</strong> ${new Date(booking.created_date).toLocaleDateString()}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Move Date:</strong> ${new Date(booking.move_date).toLocaleDateString()}</p>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px;">FROM:</h3>
        <p style="margin: 0; font-weight: bold;">${moveRequest?.pickup_address}</p>
        <p style="margin: 0; font-size: 12px; color: #666;">${moveRequest?.pickup_city}, ${moveRequest?.pickup_postal_code}</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px;">TO:</h3>
        <p style="margin: 0; font-weight: bold;">${moveRequest?.dropoff_address}</p>
        <p style="margin: 0; font-size: 12px; color: #666;">${moveRequest?.dropoff_city}, ${moveRequest?.dropoff_postal_code}</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px;">MOVING COMPANY:</h3>
        <p style="margin: 0; font-weight: bold;">${supplier?.company_name || 'House Movers'}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #f5f5f5; border-bottom: 2px solid #333;">
            <th style="padding: 10px; text-align: left;">Description</th>
            <th style="padding: 10px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px;">Moving Service</td>
            <td style="padding: 10px; text-align: right;">R${(booking.total_amount - (booking.extras_amount || 0)).toLocaleString()}</td>
          </tr>
          ${booking.extras_amount > 0 ? `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px;">Extras</td>
            <td style="padding: 10px; text-align: right;">R${booking.extras_amount.toLocaleString()}</td>
          </tr>
          ` : ''}
          <tr style="background-color: #f5f5f5; font-weight: bold;">
            <td style="padding: 10px;">TOTAL</td>
            <td style="padding: 10px; text-align: right;">R${booking.total_amount?.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div style="border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666;">
        <p style="margin: 0;">Payment Status: <strong>${booking.payment_status === 'paid' ? 'Paid' : 'Pending'}</strong></p>
        ${booking.paid_at ? `<p style="margin: 5px 0;">Paid on: ${new Date(booking.paid_at).toLocaleDateString()}</p>` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(element);

  try {
    const canvas = await html2canvas(element, { backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Invoice_${booking.booking_reference}.pdf`);
  } finally {
    document.body.removeChild(element);
  }
};