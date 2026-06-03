import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/product.dart';
import '../models/order.dart';
import '../models/offer.dart';

class AdminService {
  final SupabaseClient _client = Supabase.instance.client;

  // 1. PRODUCT CATALOG CRUD CONTROLS
  
  /// Add a new dry fruit product to catalog
  Future<Product?> addProduct(Product product) async {
    try {
      final response = await _client.from('PRODUCTS').insert(product.toJson()).select().single();
      return Product.fromJson(response);
    } catch (_) {
      rethrow;
    }
  }

  /// Update details of an existing product
  Future<Product?> updateProduct(Product product) async {
    try {
      final response = await _client
          .from('PRODUCTS')
          .update(product.toJson())
          .eq('id', product.id)
          .select()
          .single();
      return Product.fromJson(response);
    } catch (_) {
      rethrow;
    }
  }

  /// Delete a product from catalog (or soft delete)
  Future<bool> deleteProduct(String productId) async {
    try {
      await _client.from('PRODUCTS').delete().eq('id', productId);
      return true;
    } catch (_) {
      rethrow;
    }
  }

  /// Update stock inventory levels directly
  Future<bool> updateInventoryStock(String productId, int newStockCount) async {
    try {
      await _client.from('PRODUCTS').update({'stock': newStockCount}).eq('id', productId);
      return true;
    } catch (_) {
      rethrow;
    }
  }

  // 2. ORDER FULFILLMENT SYSTEMS

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

  // 3. COUPONS & PROMOTIONAL OPERATIONS

  /// Create a new promotional voucher coupon
  Future<Offer?> createCoupon(Offer offer) async {
    try {
      final response = await _client.from('COUPONS').insert(offer.toJson()).select().single();
      return Offer.fromJson(response);
    } catch (_) {
      rethrow;
    }
  }

  /// Enable or disable a coupon code instantly
  Future<bool> toggleCouponStatus(String couponId, bool active) async {
    try {
      await _client.from('COUPONS').update({'active': active}).eq('id', couponId);
      return true;
    } catch (_) {
      rethrow;
    }
  }

  // 4. E-COMMERCE INSIGHTS & ANALYTICS

  /// Fetch aggregate metrics for the admin dashboard
  Future<Map<String, dynamic>> fetchSalesAnalytics() async {
    try {
      // Stub analytic data aggregating from DB tables
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

  // 5. ENGAGEMENT SYSTEMS
  
  /// Send target push notifications to patrons (Stub)
  Future<bool> dispatchPushNotification({required String title, required String body}) async {
    try {
      // Signature is ready for Firebase Cloud Messaging / OneSignal integration
      return true;
    } catch (_) {
      return false;
    }
  }
}
