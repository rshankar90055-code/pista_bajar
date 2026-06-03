import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/order.dart';
import '../models/product.dart';
import '../services/supabase_service.dart';
import '../widgets/premium_interactive.dart';
import '../widgets/premium_feedback.dart';
import '../services/error_handler.dart';

class OrdersScreen extends StatefulWidget {
  final Function(Order)? onTrackOrder;

  const OrdersScreen({
    Key? key,
    this.onTrackOrder,
  }) : super(key: key);

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final _db = SupabaseService();
  List<Order> _pastOrders = [];
  bool _loadingOrders = false;

  @override
  void initState() {
    super.initState();
    _loadOrderHistory();
  }

  Future<void> _loadOrderHistory() async {
    final appState = context.read<AppState>();
    if (!appState.isLoggedIn) return;
    if (_loadingOrders) return;

    setState(() {
      _loadingOrders = true;
    });

    try {
      final orders = await _db.fetchMyOrders(appState.userId!);
      setState(() {
        _pastOrders = orders..sort((a, b) => b.timestamp.compareTo(a.timestamp));
      });
      debugPrint("OrdersScreen: Loaded ${_pastOrders.length} orders successfully from Supabase.");
    } catch (e) {
      debugPrint("OrdersScreen Error: Failed to fetch orders: $e");
    } finally {
      setState(() {
        _loadingOrders = false;
      });
    }
  }

  Future<void> _handleCancelOrder(String orderId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Theme.of(ctx).cardColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.warning_amber_rounded, color: Color(0xFF7B2D26)),
            SizedBox(width: 8),
            Text("Cancel Order?", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: const Text(
          "Are you sure you want to cancel this order? This action cannot be undone.",
          style: TextStyle(fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text("Keep Order", style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7B2D26),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text("Yes, Cancel", style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() {
        _loadingOrders = true;
      });
      try {
        final success = await _db.cancelOrder(orderId);
        if (success) {
          setState(() {
            final idx = _pastOrders.indexWhere((o) => o.id == orderId);
            if (idx != -1) {
              final oldOrder = _pastOrders[idx];
              _pastOrders[idx] = Order(
                id: oldOrder.id,
                userId: oldOrder.userId,
                totalAmount: oldOrder.totalAmount,
                paymentMethod: oldOrder.paymentMethod,
                orderStatus: "cancelled",
                address: oldOrder.address,
                timestamp: oldOrder.timestamp,
                items: oldOrder.items,
                userPhone: oldOrder.userPhone,
                userName: oldOrder.userName,
                deliveryOtp: oldOrder.deliveryOtp,
                discountAmount: oldOrder.discountAmount,
                discountCode: oldOrder.discountCode,
                isGift: oldOrder.isGift,
                giftNote: oldOrder.giftNote,
                giftWrap: oldOrder.giftWrap,
              );
            }
          });
          PremiumFeedback.showSuccess(context, "Order cancelled successfully ✨");
        } else {
          PremiumFeedback.showError(context, "Failed to cancel order. Please try again.");
        }
      } catch (e) {
        debugPrint("OrdersScreen: Cancel order exception: $e");
        PremiumFeedback.showError(context, ErrorHandler.map(e));
      } finally {
        setState(() {
          _loadingOrders = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    const goldColor = Color(0xFFD4A373);

    if (!appState.isLoggedIn) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text("🔑", style: TextStyle(fontSize: 48)),
                const SizedBox(height: 16),
                const Text(
                  "Login Required",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                const Text(
                  "Please log in with a real premium account to track and view your dry fruits orders.",
                  style: TextStyle(color: Colors.grey, fontSize: 11),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: const Color(0xFFFAF7F2), // Forced Light Theme
        appBar: AppBar(
          title: const Text(
            "My Orders",
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF2C160B)),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
          centerTitle: true,
          bottom: const TabBar(
            indicatorColor: goldColor,
            labelColor: goldColor,
            unselectedLabelColor: Colors.grey,
            labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            indicatorWeight: 3,
            tabs: [
              Tab(text: "Active"),
              Tab(text: "Delivered"),
              Tab(text: "Cancelled"),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildOrderTab(
              orders: _pastOrders.where((o) => o.status != "delivered" && o.status != "cancelled").toList(),
              emptyEmoji: "📦",
              emptyTitle: "No Active Orders",
              emptySubtitle: "You don't have any pending dry fruits shipments right now.",
            ),
            _buildOrderTab(
              orders: _pastOrders.where((o) => o.status == "delivered").toList(),
              emptyEmoji: "✨",
              emptyTitle: "No Delivered Orders",
              emptySubtitle: "Your order history is empty. Time to order some delicious healthy bites!",
            ),
            _buildOrderTab(
              orders: _pastOrders.where((o) => o.status == "cancelled").toList(),
              emptyEmoji: "❌",
              emptyTitle: "No Cancelled Orders",
              emptySubtitle: "Excellent! You haven't cancelled any premium orders.",
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderHistoryCard(Order order) {
    const goldColor = Color(0xFFD4A373);
    final appState = context.read<AppState>();

    Color badgeBg;
    Color badgeFg;
    String statusText;

    switch (order.status) {
      case "delivered":
        badgeBg = const Color(0xFF386B39).withOpacity(0.12);
        badgeFg = const Color(0xFF386B39);
        statusText = "Delivered";
        break;
      case "shiprocket_pickup":
        badgeBg = goldColor.withOpacity(0.12);
        badgeFg = goldColor;
        statusText = "Shipped / In Transit";
        break;
      case "cancelled":
        badgeBg = const Color(0xFF7B2D26).withOpacity(0.12);
        badgeFg = const Color(0xFF7B2D26);
        statusText = "Cancelled";
        break;
      case "new":
      default:
        badgeBg = Colors.blue.withOpacity(0.12);
        badgeFg = Colors.blue;
        statusText = "Confirmed";
        break;
    }

    final dateStr = order.timestamp.substring(0, 10);
    final timeStr = order.timestamp.length > 16 ? order.timestamp.substring(11, 16) : '';
    final dateTimeText = timeStr.isNotEmpty ? "$dateStr • $timeStr" : dateStr;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE8D9C5), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "ID: PB-${order.id.substring(order.id.length - 6).toUpperCase()}",
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: badgeFg.withOpacity(0.3)),
                ),
                child: Text(
                  statusText,
                  style: TextStyle(color: badgeFg, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 0.3),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          ...order.items.map((item) {
            final product = appState.products.firstWhere(
              (p) => p.id == item.productId,
              orElse: () => Product(id: '', name: '', description: '', imageUrl: '', category: '', stock: 0, price250g: 0, price500g: 0, price1kg: 0, rating: 0),
            );

            return Padding(
              padding: const EdgeInsets.only(bottom: 10.0),
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
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
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
                    "₹${item.subtotal}",
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ],
              ),
            );
          }).toList(),

          const Divider(color: Color(0xFFE8D9C5), height: 20),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Date: $dateTimeText",
                    style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    "Total Paid: ₹${order.totalAmount}",
                    style: const TextStyle(fontSize: 11, color: goldColor, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    "Payment: ${order.paymentMethod.replaceAll('_', ' ').toUpperCase()}",
                    style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 12),

          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              if (order.status != "delivered" && order.status != "cancelled") ...[
                GestureDetector(
                  onTap: () => _handleCancelOrder(order.id),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                    decoration: BoxDecoration(
                      color: const Color(0xFF7B2D26),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.cancel_outlined, color: Colors.white, size: 12),
                        SizedBox(width: 6),
                        Text(
                          "Cancel Order",
                          style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              if (order.status != "cancelled" && widget.onTrackOrder != null)
                GestureDetector(
                  onTap: () => widget.onTrackOrder!(order),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                    decoration: BoxDecoration(
                      color: const Color(0xFF3E2723),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.radar_rounded, color: Colors.white, size: 12),
                        SizedBox(width: 6),
                        Text(
                          "Track Shipment",
                          style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOrderTab({
    required List<Order> orders,
    required String emptyEmoji,
    required String emptyTitle,
    required String emptySubtitle,
  }) {
    const goldColor = Color(0xFFD4A373);

    return RefreshIndicator(
      onRefresh: _loadOrderHistory,
      color: goldColor,
      child: _loadingOrders
          ? ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              itemCount: 3,
              itemBuilder: (context, index) => const Padding(
                padding: EdgeInsets.only(bottom: 12.0),
                child: ShimmerLoading(
                  width: double.infinity,
                  height: 140.0,
                  borderRadius: 20.0,
                ),
              ),
            )
          : orders.isEmpty
              ? ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(vertical: 100, horizontal: 24),
                  children: [
                    Center(child: Text(emptyEmoji, style: const TextStyle(fontSize: 54))),
                    const SizedBox(height: 16),
                    Center(
                      child: Text(
                        emptyTitle,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF2C160B)),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Center(
                      child: Text(
                        emptySubtitle,
                        style: const TextStyle(color: Colors.grey, fontSize: 11),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                )
              : ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
                  itemCount: orders.length,
                  itemBuilder: (context, index) {
                    return _buildOrderHistoryCard(orders[index]);
                  },
                ),
    );
  }
}
