from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from django.conf import settings
import qrcode


class ReceiptGenerator:
    """Generate printable receipts for sales"""
    
    def __init__(self, sale):
        self.sale = sale
        self.width = 80 * mm  # 80mm thermal printer
        self.height = 297 * mm  # A4 height
    
    def generate_pdf(self):
        """Generate PDF receipt"""
        buffer = BytesIO()
        
        # Create canvas
        c = canvas.Canvas(buffer, pagesize=(self.width, self.height))
        
        # Starting position
        y = self.height - 10 * mm
        
        # Shop header
        y = self._draw_header(c, y)
        
        # Sale info
        y = self._draw_sale_info(c, y)
        
        # Items
        y = self._draw_items(c, y)
        
        # Totals
        y = self._draw_totals(c, y)
        
        # Payment info
        y = self._draw_payment_info(c, y)
        
        # QR code
        y = self._draw_qr_code(c, y)
        
        # Footer
        self._draw_footer(c, y)
        
        # Save PDF
        c.save()
        
        buffer.seek(0)
        return buffer
    
    def _draw_header(self, c, y):
        """Draw shop header"""
        shop = self.sale.shop
        
        # Shop name (bold, larger)
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(self.width / 2, y, shop.name)
        y -= 5 * mm
        
        # Shop address
        c.setFont("Helvetica", 8)
        c.drawCentredString(self.width / 2, y, shop.address)
        y -= 4 * mm
        
        c.drawCentredString(self.width / 2, y, f"Tel: {shop.phone}")
        y -= 4 * mm
        
        if shop.email:
            c.drawCentredString(self.width / 2, y, shop.email)
            y -= 4 * mm
        
        # Separator
        y -= 2 * mm
        c.line(5 * mm, y, self.width - 5 * mm, y)
        y -= 4 * mm
        
        return y
    
    def _draw_sale_info(self, c, y):
        """Draw sale information"""
        c.setFont("Helvetica", 8)
        
        # Receipt number
        c.drawString(5 * mm, y, "Receipt #:")
        c.drawRightString(self.width - 5 * mm, y, str(self.sale.id)[:8])
        y -= 4 * mm
        
        # Date and time
        c.drawString(5 * mm, y, "Date:")
        c.drawRightString(
            self.width - 5 * mm,
            y,
            self.sale.created_at.strftime("%Y-%m-%d %H:%M")
        )
        y -= 4 * mm
        
        # Cashier
        c.drawString(5 * mm, y, "Cashier:")
        c.drawRightString(
            self.width - 5 * mm,
            y,
            self.sale.cashier.username if self.sale.cashier else "N/A"
        )
        y -= 4 * mm
        
        # Customer info (if available)
        if self.sale.customer_name:
            c.drawString(5 * mm, y, "Customer:")
            c.drawRightString(self.width - 5 * mm, y, self.sale.customer_name)
            y -= 4 * mm
        
        # Separator
        y -= 2 * mm
        c.line(5 * mm, y, self.width - 5 * mm, y)
        y -= 4 * mm
        
        return y
    
    def _draw_items(self, c, y):
        """Draw sale items"""
        c.setFont("Helvetica-Bold", 8)
        c.drawString(5 * mm, y, "Item")
        c.drawRightString(self.width - 5 * mm, y, "Amount")
        y -= 4 * mm
        
        c.setFont("Helvetica", 8)
        
        for item in self.sale.items.all():
            # Product name
            c.drawString(5 * mm, y, item.product.name[:25])
            y -= 4 * mm
            
            # Quantity x Price
            qty_price = f"{item.quantity} x {float(item.unit_price):.2f}"
            c.drawString(8 * mm, y, qty_price)
            
            # Subtotal
            c.drawRightString(
                self.width - 5 * mm,
                y,
                f"{float(item.subtotal):.2f}"
            )
            y -= 4 * mm
            
            # Discount (if any)
            if item.discount > 0:
                c.drawString(8 * mm, y, "Discount:")
                c.drawRightString(
                    self.width - 5 * mm,
                    y,
                    f"-{float(item.discount):.2f}"
                )
                y -= 4 * mm
        
        # Separator
        y -= 2 * mm
        c.line(5 * mm, y, self.width - 5 * mm, y)
        y -= 4 * mm
        
        return y
    
    def _draw_totals(self, c, y):
        """Draw totals"""
        c.setFont("Helvetica-Bold", 10)
        
        c.drawString(5 * mm, y, "TOTAL:")
        c.drawRightString(
            self.width - 5 * mm,
            y,
            f"{float(self.sale.total_amount):.2f}"
        )
        y -= 6 * mm
        
        # Separator
        c.line(5 * mm, y, self.width - 5 * mm, y)
        y -= 4 * mm
        
        return y
    
    def _draw_payment_info(self, c, y):
        """Draw payment information"""
        c.setFont("Helvetica", 8)
        
        payment_methods = {
            'cash': 'Cash',
            'card': 'Card',
            'mobile_money': 'Mobile Money'
        }
        
        c.drawString(5 * mm, y, "Payment Method:")
        c.drawRightString(
            self.width - 5 * mm,
            y,
            payment_methods.get(self.sale.payment_method, 'Other')
        )
        y -= 4 * mm
        
        c.drawString(5 * mm, y, "Status:")
        c.drawRightString(
            self.width - 5 * mm,
            y,
            self.sale.status.capitalize()
        )
        y -= 6 * mm
        
        return y
    
    def _draw_qr_code(self, c, y):
        """Draw QR code for receipt verification"""
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=2, border=1)
        qr.add_data(f"{settings.SITE_URL}/receipts/{self.sale.id}")
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to image
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Draw QR code
        qr_size = 20 * mm
        x = (self.width - qr_size) / 2
        y -= qr_size
        
        c.drawImage(
            ImageReader(buffer),
            x,
            y,
            width=qr_size,
            height=qr_size
        )
        
        y -= 4 * mm
        
        return y
    
    def _draw_footer(self, c, y):
        """Draw footer"""
        c.setFont("Helvetica", 7)
        
        # Thank you message
        c.drawCentredString(
            self.width / 2,
            y,
            "Thank you for your business!"
        )
        y -= 4 * mm
        
        # Return policy or other info
        c.drawCentredString(
            self.width / 2,
            y,
            "Goods sold are not returnable"
        )
        y -= 6 * mm
        
        # Powered by
        c.setFont("Helvetica", 6)
        c.drawCentredString(
            self.width / 2,
            y,
            "Powered by POS System"
        )
    
    def generate_html(self):
        """Generate HTML receipt for web display"""
        from django.template.loader import render_to_string
        
        context = {
            'sale': self.sale,
            'shop': self.sale.shop,
            'items': self.sale.items.all(),
            'total': self.sale.total_amount,
        }
        
        return render_to_string('receipts/receipt.html', context)

