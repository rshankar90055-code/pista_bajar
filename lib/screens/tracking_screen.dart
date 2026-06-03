import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/order.dart';
import '../models/product.dart';
import '../providers/app_state.dart';
import '../services/supabase_service.dart';

class TrackingScreen extends StatefulWidget {
  final Order order;
  final VoidCallback onBackToHome;

  const TrackingScreen({
    Key? key,
    required this.order,
    required this.onBackToHome,
  }) : super(key: key);

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  bool _cancelling = false;
  late String _currentStatus;

  @override
  void initState() {
    super.initState();
    _currentStatus = widget.order.status;
  }

  Widget _buildMetaRow({
    required String label,
    String? valueText,
    Widget? valueWidget,
    Color? valueColor,
    FontWeight valueWeight = FontWeight.bold,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w500),
        ),
        if (valueWidget != null)
          valueWidget
        else
          Text(
            valueText ?? '',
            style: TextStyle(
              fontSize: 11,
              fontWeight: valueWeight,
              color: valueColor ?? Theme.of(context).textTheme.bodyLarge?.color,
            ),
          ),
      ],
    );
  }

  Future<void> _handleCancelOrder() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Theme.of(ctx).cardColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          "Cancel Order?",
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: const Text(
          "Are you sure you want to cancel this order? This action cannot be undone.",
          style: TextStyle(fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text("Keep Order", style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7B2D26),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text("Yes, Cancel"),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() {
        _cancelling = true;
      });

      final db = SupabaseService();
      final success = await db.cancelOrder(widget.order.id);

      setState(() {
        _cancelling = false;
      });

      if (success) {
        setState(() {
          _currentStatus = "cancelled";
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Order cancelled successfully. Refund will be initiated shortly."),
            backgroundColor: Color(0xFF7B2D26),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Failed to cancel order. Please contact customer support."),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    const goldColor = Color(0xFFD4A373);
    final isCancelled = _currentStatus == "cancelled";
    final isDelivered = _currentStatus == "delivered";
    final isPickedUp = _currentStatus == "shiprocket_pickup";

    // Format order total
    final totalText = "₹${widget.order.totalAmount}";

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "Track Order",
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: widget.onBackToHome,
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Success Message or Cancelled Banner
            if (isCancelled)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: const Color(0xFF7B2D26).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF7B2D26), width: 1),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.cancel_rounded, color: Color(0xFF7B2D26), size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            "Order Cancelled",
                            style: TextStyle(
                              color: Color(0xFF7B2D26),
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            "This order has been cancelled and cannot be tracked further.",
                            style: TextStyle(fontSize: 11, color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              )
            else ...[
              // 2. ETA & Delivery Secret Code Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark
                        ? [const Color(0xFF1E3516), const Color(0xFF13220E)]
                        : [const Color(0xFF386B39), const Color(0xFF1E3516)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: goldColor.withOpacity(0.3), width: 1.2),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            _PulseIndicator(),
                            const SizedBox(width: 8),
                            const Text(
                              "Express Delivery",
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          "ID:PB-${widget.order.id.substring(widget.order.id.length - 6).toUpperCase()}",
                          style: const TextStyle(
                            color: goldColor,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      isDelivered ? "Delivered Safely! 🎉" : "Arriving in 25–35 Mins",
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      "Pistachios & organic treats are fresh and packed on demand.",
                      style: TextStyle(color: Colors.white60, fontSize: 11),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    // Gold OTP Card
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: goldColor.withOpacity(0.5)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: const [
                              Icon(Icons.lock_outline_rounded, color: goldColor, size: 18),
                              SizedBox(width: 8),
                              Text(
                                "Delivery Secret OTP",
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: goldColor,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              widget.order.deliveryOtp ?? "4927",
                              style: const TextStyle(
                                color: Colors.black,
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 3. Delivery Progress Stepper
              const Padding(
                padding: EdgeInsets.only(left: 4, bottom: 12),
                child: Text(
                  "DELIVERY PROGRESS",
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE8D9C5), width: 1),
                ),
                child: Column(
                  children: [
                    _buildStepRow(
                      context: context,
                      title: "Order Placed & Confirmed",
                      desc: "We have received your organic treats order.",
                      icon: Icons.check_circle_outline_rounded,
                      isActive: true,
                      isCompleted: true,
                    ),
                    _buildStepConnector(true),
                    _buildStepRow(
                      context: context,
                      title: "Premium Quality Packing",
                      desc: "Hand-selected nuts and safety seals applied.",
                      icon: Icons.inventory_2_outlined,
                      isActive: isPickedUp || isDelivered,
                      isCompleted: isPickedUp || isDelivered,
                    ),
                    _buildStepConnector(isPickedUp || isDelivered),
                    _buildStepRow(
                      context: context,
                      title: "Out for Delivery",
                      desc: "Shiprocket executive is carrying your dry fruits.",
                      icon: Icons.delivery_dining_outlined,
                      isActive: isPickedUp || isDelivered,
                      isCompleted: isDelivered,
                    ),
                    _buildStepConnector(isDelivered),
                    _buildStepRow(
                      context: context,
                      title: "Delivered Successfully",
                      desc: "Order completed. Thank you for choosing Pista Bajar!",
                      icon: Icons.sports_motorsports_outlined,
                      isActive: isDelivered,
                      isCompleted: isDelivered,
                      isLast: true,
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 20),

            // 4. Delivery Address Details
            const Padding(
              padding: EdgeInsets.only(left: 4, bottom: 12),
              child: Text(
                "DELIVERY ADDRESS",
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 0.5),
              ),
            ),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE8D9C5), width: 1),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('📍', style: TextStyle(fontSize: 20)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.order.userName ?? "Guest Patron",
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const SizedBox(height: 6),
                        if (widget.order.address.house.isNotEmpty) ...[
                          Text(
                            "House/Flat: ${widget.order.address.house}",
                            style: TextStyle(color: Theme.of(context).hintColor, fontSize: 11, height: 1.4),
                          ),
                        ],
                        if (widget.order.address.area.isNotEmpty) ...[
                          Text(
                            "Street/Area: ${widget.order.address.area}",
                            style: TextStyle(color: Theme.of(context).hintColor, fontSize: 11, height: 1.4),
                          ),
                        ] else ...[
                          Text(
                            widget.order.address.addressLine,
                            style: TextStyle(color: Theme.of(context).hintColor, fontSize: 11, height: 1.4),
                          ),
                        ],
                        if (widget.order.address.landmark.isNotEmpty) ...[
                          Text(
                            "Landmark: ${widget.order.address.landmark}",
                            style: TextStyle(color: Theme.of(context).hintColor, fontSize: 11, height: 1.4),
                          ),
                        ],
                        Text(
                          "${widget.order.address.city}, ${widget.order.address.state} - ${widget.order.address.pinCode}",
                          style: TextStyle(color: Theme.of(context).hintColor, fontSize: 11, height: 1.4),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          "Phone: +91 ${widget.order.userPhone}",
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 4.5 Elegant Order Metadata Card
            const Padding(
              padding: EdgeInsets.only(left: 4, bottom: 12),
              child: Text(
                "ORDER SUMMARY",
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 0.5),
              ),
            ),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE8D9C5), width: 1),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildMetaRow(
                    label: "Order Status",
                    valueWidget: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isCancelled 
                            ? const Color(0xFF7B2D26).withOpacity(0.12)
                            : (isDelivered ? const Color(0xFF386B39).withOpacity(0.12) : Colors.blue.withOpacity(0.12)),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isCancelled 
                              ? const Color(0xFF7B2D26).withOpacity(0.3)
                              : (isDelivered ? const Color(0xFF386B39).withOpacity(0.3) : Colors.blue.withOpacity(0.3)),
                        ),
                      ),
                      child: Text(
                        isCancelled ? "Cancelled" : (isDelivered ? "Delivered" : "Confirmed / Active"),
                        style: TextStyle(
                          color: isCancelled 
                              ? const Color(0xFF7B2D26)
                              : (isDelivered ? const Color(0xFF386B39) : Colors.blue),
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  ),
                  const Divider(color: Color(0xFFE8D9C5), height: 20),
                  _buildMetaRow(
                    label: "Placed Date & Time",
                    valueText: "${widget.order.timestamp.substring(0, 10)} • ${widget.order.timestamp.length > 16 ? widget.order.timestamp.substring(11, 16) : ''}",
                  ),
                  const Divider(color: Color(0xFFE8D9C5), height: 20),
                  _buildMetaRow(
                    label: "Payment Method",
                    valueText: widget.order.paymentMethod.replaceAll('_', ' ').toUpperCase(),
                  ),
                  const Divider(color: Color(0xFFE8D9C5), height: 20),
                  _buildMetaRow(
                    label: "Grand Total",
                    valueText: "₹${widget.order.totalAmount}",
                    valueColor: goldColor,
                    valueWeight: FontWeight.w900,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 5. Items Summary
            const Padding(
              padding: EdgeInsets.only(left: 4, bottom: 12),
              child: Text(
                "ITEMS ORDERED",
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 0.5),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE8D9C5), width: 1),
              ),
              child: Column(
                children: [
                  ...widget.order.items.map((item) {
                    final appState = context.read<AppState>();
                    final product = appState.products.firstWhere(
                      (p) => p.id == item.productId,
                      orElse: () => Product(id: '', name: '', description: '', imageUrl: '', category: '', stock: 0, price250g: 0, price500g: 0, price1kg: 0, rating: 0),
                    );

                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: goldColor.withOpacity(0.34), width: 1),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(9),
                              child: product.imageUrl.isNotEmpty
                                  ? Image.network(
                                      product.imageUrl,
                                      fit: BoxFit.cover,
                                      errorBuilder: (context, error, stackTrace) => const Icon(Icons.shopping_bag_outlined, size: 20, color: Colors.grey),
                                    )
                                  : const Icon(Icons.shopping_bag_outlined, size: 20, color: Colors.grey),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.name,
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  "${item.selectedWeight} Pack × ${item.quantity.toInt()} qty",
                                  style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            "₹${item.lineTotal}",
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  const Divider(color: Color(0xFFE8D9C5), height: 20),
                  if (widget.order.isGift == true && widget.order.giftWrap == true)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          Text("🎁 Luxury Gift Wrapping", style: TextStyle(fontSize: 11, color: Colors.grey)),
                          Text("₹49", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  if (widget.order.paymentMethod == "cash_on_delivery")
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          Text("💵 Cash on Delivery Handling Fee", style: TextStyle(fontSize: 11, color: Colors.grey)),
                          Text("₹9", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  if (widget.order.discountAmount != null && widget.order.discountAmount! > 0)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("🏷️ Coupon Discount (${widget.order.discountCode ?? 'SAVE10'})", style: const TextStyle(fontSize: 11, color: goldColor)),
                          Text("-₹${widget.order.discountAmount}", style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: goldColor)),
                        ],
                      ),
                    ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "Total Paid / Collect",
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900),
                      ),
                      Text(
                        totalText,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: goldColor),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // 6. Action Buttons: Cancel or Back
            if (_currentStatus != "delivered" && _currentStatus != "cancelled" && !_cancelling)
              ElevatedButton(
                onPressed: _handleCancelOrder,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7B2D26),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: const Text(
                  "Cancel Order",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5),
                ),
              ),
            if (_cancelling)
              const Center(
                child: CircularProgressIndicator(color: goldColor),
              ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: widget.onBackToHome,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: goldColor),
                minimumSize: const Size(double.infinity, 48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text(
                "Back to Storefront",
                style: TextStyle(color: goldColor, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildStepRow({
    required BuildContext context,
    required String title,
    required String desc,
    required IconData icon,
    required bool isActive,
    required bool isCompleted,
    bool isLast = false,
  }) {
    const goldColor = Color(0xFFD4A373);
    final indicatorColor = isCompleted
        ? const Color(0xFF386B39)
        : (isActive ? goldColor : Colors.grey[300]!);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: indicatorColor.withOpacity(0.12),
            shape: BoxShape.circle,
            border: Border.all(color: indicatorColor, width: 1.5),
          ),
          child: Icon(
            icon,
            color: indicatorColor,
            size: 18,
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: isCompleted
                      ? Theme.of(context).textTheme.bodyLarge?.color
                      : (isActive ? goldColor : Colors.grey),
                ),
              ),
              const SizedBox(height: 3),
              Text(
                desc,
                style: const TextStyle(fontSize: 10, color: Colors.grey, height: 1.3),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStepConnector(bool active) {
    return Container(
      width: 1.5,
      height: 24,
      color: active ? const Color(0xFF386B39) : Colors.grey[300]!,
      margin: const EdgeInsets.only(left: 17, top: 4, bottom: 4),
      alignment: Alignment.centerLeft,
    );
  }
}

class _PulseIndicator extends StatefulWidget {
  @override
  State<_PulseIndicator> createState() => _PulseIndicatorState();
}

class _PulseIndicatorState extends State<_PulseIndicator> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _controller.drive(CurveTween(curve: Curves.easeInOut)),
      child: Container(
        width: 8,
        height: 8,
        decoration: const BoxDecoration(
          color: Color(0xFF81C784), // Emerald pulsing dot
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}
