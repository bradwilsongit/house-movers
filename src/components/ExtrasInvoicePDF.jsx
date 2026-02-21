import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generateExtrasInvoicePDF = async (extraRequest, booking) => {
  const items = extraRequest?.description
    ? extraRequest.description.split(', ').map(s => {
        const match = s.match(/^(\d+)x (.+)$/);
        return match ? { qty: parseInt(match[1]), name: match[2] } : { qty: 1, name: s };
      })
    : [];

  const ref = `EXT-${booking?.booking_reference || extraRequest.id.slice(0, 8).toUpperCase()}`;
  const dateStr = extraRequest.created_date
    ? new Date(extraRequest.created_date).toLocaleDateString()
    : new Date().toLocaleDateString();
  const paidAt = extraRequest.approved_at || extraRequest.created_date;

  const element = document.createElement('div');
  element.innerHTML = `
    <div style="font-family: Arial, sans-serif; padding: 40px; width: 800px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <h1 style="margin: 0; font-size: 24px;">RECEIPT</h1>
          <p style="margin: 5px 0; color: #666;">Extra Materials Order</p>
          <p style="margin: 5px 0; color: #666;">Ref: ${ref}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 14px;"><strong>Date:</strong> ${dateStr}</p>
          ${booking ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Booking:</strong> #${booking.booking_reference}</p>` : ''}
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #f5f5f5; border-bottom: 2px solid #333;">
            <th style="padding: 10px; text-align: left;">Item</th>
            <th style="padding: 10px; text-align: right;">Qty</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px;">${item.name}</td>
            <td style="padding: 10px; text-align: right;">${item.qty}</td>
          </tr>`).join('')}
          <tr style="background-color: #f5f5f5; font-weight: bold;">
            <td style="padding: 10px;">TOTAL PAID</td>
            <td style="padding: 10px; text-align: right;">R${extraRequest.amount?.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div style="border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666;">
        <p style="margin: 0;">Payment Status: <strong>Paid</strong></p>
        ${paidAt ? `<p style="margin: 5px 0;">Paid on: ${new Date(paidAt).toLocaleDateString()}</p>` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(element);
  try {
    const canvas = await html2canvas(element, { backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`Receipt_${ref}.pdf`);
  } finally {
    document.body.removeChild(element);
  }
};