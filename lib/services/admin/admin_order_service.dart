import 'package:supabase_flutter/supabase_flutter.dart';
import '../../models/order.dart';

class AdminOrderService {
  final SupabaseClient _client = Supabase.instance.client;

  /// Fetch all customer orders across the system
  Future<List<Order>> fetchAllOrders() async {
    try {
      final response = await _client.from('ORDERS').select('*, order_items:ORDER_ITEMS(*)');
      return (response as List).map((item) => Order.fromJson(item as Map<String, dynamic>)).toList();
    } catch (_) {
      rethrow;
    }
  }

  /// Override order state (confirmed -> shipped -> delivered -> cancelled)
  Future<bool> overrideOrderStatus(String orderId, String newStatus) async {
    try {
      await _client.from('ORDERS').update({'order_status': newStatus}).eq('id', orderId);
      return true;
    } catch (_) {
      rethrow;
    }
  }

  /// Fetch aggregate metrics for the admin dashboard
  Future<Map<String, dynamic>> fetchSalesAnalytics() async {
    try {
      final totalSalesRes = await _client.from('ORDERS').select('total_amount').neq('order_status', 'cancelled');
      final ordersCount = totalSalesRes.length;
      double revenue = 0.0;
      for (var row in totalSalesRes) {
        revenue += (row['total_amount'] as num).toDouble();
      }
      
      return {
        'total_orders': ordersCount,
        'gross_revenue': revenue,
        'average_order_value': ordersCount > 0 ? (revenue / ordersCount) : 0.0,
        'last_updated': DateTime.now().toIso8601String(),
      };
    } catch (_) {
      return {
        'total_orders': 0,
        'gross_revenue': 0.0,
        'average_order_value': 0.0,
        'last_updated': DateTime.now().toIso8601String(),
      };
    }
  }
}
