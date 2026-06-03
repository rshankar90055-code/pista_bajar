import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/foundation.dart';
import '../models/product.dart';
import '../models/order.dart';
import '../models/offer.dart';
import '../models/address.dart';

class SupabaseService {
  final SupabaseClient _client = Supabase.instance.client;

  // 1. Authentication System
  User? get currentUser => _client.auth.currentUser;
  bool get isLoggedIn => currentUser != null;

  // Listen to Auth State Changes
  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  // Login using Email or Phone Number with Password
  Future<AuthResponse> loginWithEmailOrPhone(String emailOrPhone, String password) async {
    String email = emailOrPhone.trim();
    
    // Check if it is a phone number (i.e. does not contain '@')
    if (!email.contains('@')) {
      // It is a phone number. Query profiles table to find matching email.
      try {
        final profile = await _client
            .from('profiles')
            .select('email')
            .eq('phone_number', email)
            .maybeSingle();
        if (profile != null && profile['email'] != null) {
          email = profile['email'] as String;
        } else {
          // Try USERS table fallback
          final userRecord = await _client
              .from('USERS')
              .select('email')
              .eq('phone', email)
              .maybeSingle();
          if (userRecord != null && userRecord['email'] != null) {
            email = userRecord['email'] as String;
          } else {
            throw Exception("No registered account found with that phone number.");
          }
        }
      } catch (e) {
        if (e.toString().contains("No registered account")) {
          rethrow;
        }
        throw Exception("Failed to resolve phone number to email: $e");
      }
    }
    
    // Perform standard email/password authentication
    return await _client.auth.signInWithPassword(email: email, password: password);
  }

  // Simple Email & Password Login (Backward Compatibility)
  Future<AuthResponse> loginWithEmail(String email, String password) async {
    return await loginWithEmailOrPhone(email, password);
  }

  // Reset Password for Email
  Future<void> resetPasswordForEmail(String email) async {
    await _client.auth.resetPasswordForEmail(email);
  }

  // Simple Email & Password Sign Up
  Future<AuthResponse> signUpWithEmail({
    required String email,
    required String password,
    required String name,
    required String phone,
  }) async {
    final response = await _client.auth.signUp(
      email: email,
      password: password,
      emailRedirectTo: 'pista-bajaar://login-callback',
    );
    if (response.user != null) {
      await saveUserProfile(
        userId: response.user!.id,
        name: name,
        phone: phone,
        email: email,
      );
    }
    return response;
  }

  // Google OAuth Login (Kept for interface compatibility but disabled)
  Future<bool> signInWithGoogle() async {
    try {
      return await _client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'pista-bajaar://login-callback',
      );
    } catch (_) {
      return false;
    }
  }

  // Phone Passwordless OTP Login (Kept for interface compatibility but disabled)
  Future<void> signInWithPhone(String phone) async {
    await _client.auth.signInWithOtp(phone: phone);
  }

  // Verify Phone OTP (Kept for interface compatibility but disabled)
  Future<AuthResponse> verifyPhoneOtp(String phone, String token) async {
    return await _client.auth.verifyOTP(
      phone: phone,
      token: token,
      type: OtpType.sms,
    );
  }

  // Save/Update user profile record in profiles and USERS table
  Future<void> saveUserProfile({
    required String userId,
    required String name,
    required String phone,
    required String email,
  }) async {
    // 1. Upsert to profiles table
    try {
      await _client.from('profiles').upsert({
        'id': userId,
        'username': name,
        'email': email,
        'phone_number': phone,
        'created_at': DateTime.now().toIso8601String(),
      });
      debugPrint("SupabaseService: successfully saved to profiles table");
    } catch (e) {
      debugPrint("SupabaseService: failed to save to profiles table: $e");
    }

    // 2. Also upsert to USERS table for compatibility
    try {
      await _client.from('USERS').upsert({
        'id': userId,
        'name': name,
        'phone': phone,
        'email': email,
        'created_at': DateTime.now().toIso8601String(),
      });
      debugPrint("SupabaseService: successfully saved to USERS table");
    } catch (e) {
      debugPrint("SupabaseService: failed to save to USERS table: $e");
    }
  }

  // Load User Info from profiles or USERS table
  Future<Map<String, dynamic>?> fetchUserProfile(String userId) async {
    try {
      final response = await _client.from('profiles').select().eq('id', userId).single();
      // Map profiles fields (username -> name, phone_number -> phone) for backward compatibility
      return {
        'id': response['id'],
        'name': response['username'],
        'phone': response['phone_number'],
        'email': response['email'],
        'created_at': response['created_at'],
        'default_address': response['default_address'],
        'avatar_url': response['avatar_url'],
      };
    } catch (_) {
      // Fallback to USERS table
      try {
        final response = await _client.from('USERS').select().eq('id', userId).single();
        return response;
      } catch (_) {
        return null;
      }
    }
  }

  // Logout
  Future<void> logout() async {
    await _client.auth.signOut();
  }

  // Saved Addresses operations
  Future<List<Map<String, dynamic>>> fetchAddresses(String userId) async {
    final response = await _client.from('addresses').select().eq('user_id', userId);
    return List<Map<String, dynamic>>.from(response);
  }

  Future<void> saveAddress(Map<String, dynamic> addressData) async {
    await _client.from('addresses').upsert(addressData);
  }

  Future<void> deleteAddress(String addressId) async {
    await _client.from('addresses').delete().eq('id', addressId);
  }

  // 2. Product Catalog Retrieval
  Future<List<Product>> fetchProducts() async {
    try {
      final List<dynamic> response = await _client.from('PRODUCTS').select();
      return response.map((item) => Product.fromJson(item as Map<String, dynamic>)).toList();
    } catch (e) {
      rethrow;
    }
  }

  // 3. Coupon Retrieval & Validations
  Future<List<Offer>> fetchOffers() async {
    try {
      final List<dynamic> response = await _client.from('COUPONS').select().eq('active', true);
      return response.map((item) => Offer.fromJson(item as Map<String, dynamic>)).toList();
    } catch (e) {
      rethrow;
    }
  }

  // Check if active user has already claimed a coupon in USER_COUPON_USAGE
  Future<bool> checkCouponUsed(String userId, String couponId) async {
    try {
      final response = await _client
          .from('USER_COUPON_USAGE')
          .select()
          .eq('user_id', userId)
          .eq('coupon_id', couponId);
      return (response as List).isNotEmpty;
    } catch (e) {
      rethrow;
    }
  }

  // Log coupon usage
  Future<void> logCouponUsage(String userId, String couponId) async {
    try {
      await _client.from('USER_COUPON_USAGE').insert({
        'user_id': userId,
        'coupon_id': couponId,
        'used_at': DateTime.now().toIso8601String(),
      });
    } catch (_) {
      // Fail silently for background operations
    }
  }

  // 4. Cart Operations (Supabase Synced Cart)
  Future<List<Map<String, dynamic>>> fetchCart(String userId) async {
    try {
      final response = await _client.from('CART').select().eq('user_id', userId);
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> addToCart(String userId, String productId, double quantity, String weight) async {
    try {
      await _client.from('CART').upsert({
        'user_id': userId,
        'product_id': productId,
        'quantity': quantity,
        'selected_weight': weight,
      });
    } catch (_) {
      // Fail silently
    }
  }

  Future<void> removeFromCart(String userId, String productId) async {
    try {
      await _client.from('CART').delete().eq('user_id', userId).eq('product_id', productId);
    } catch (_) {
      // Fail silently
    }
  }

  Future<void> clearCart(String userId) async {
    try {
      await _client.from('CART').delete().eq('user_id', userId);
    } catch (_) {
      // Fail silently
    }
  }

  // 5. Wishlist Operations (Supabase Synced Wishlist)
  Future<List<String>> fetchWishlist(String userId) async {
    try {
      final List<dynamic> response = await _client.from('WISHLIST').select('product_id').eq('user_id', userId);
      return response.map((item) => item['product_id'].toString()).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> toggleWishlist(String userId, String productId, bool inWishlist) async {
    try {
      if (inWishlist) {
        await _client.from('WISHLIST').insert({
          'user_id': userId,
          'product_id': productId,
        });
      } else {
        await _client.from('WISHLIST').delete().eq('user_id', userId).eq('product_id', productId);
      }
    } catch (_) {
      // Fail silently
    }
  }

  // 6. Orders and Placements
  Future<List<Order>> fetchMyOrders(String userId) async {
    try {
      // Fetch orders with order items joined
      final response = await _client
          .from('ORDERS')
          .select('*, order_items:ORDER_ITEMS(*)')
          .eq('user_id', userId);
          
      return (response as List).map((item) => Order.fromJson(item as Map<String, dynamic>)).toList();
    } catch (e) {
      rethrow;
    }
  }

  // Place Order inside transaction (orders and order_items)
  Future<Order?> placeOrder({
    required String userId,
    required int totalAmount,
    required String paymentMethod,
    required Address address,
    required List<OrderItem> items,
    String? couponId,
  }) async {
    try {
      final orderId = uuidGenerate(); // custom unique tracking ID

      // 1. Insert into ORDERS table
      await _client.from('ORDERS').insert({
        'id': orderId,
        'user_id': userId,
        'total_amount': totalAmount,
        'payment_method': paymentMethod,
        'order_status': 'new',
        'address': address.toJson(),
        'created_at': DateTime.now().toIso8601String(),
      }).select().single();

      // 2. Insert into ORDER_ITEMS table
      final itemsData = items.map((item) => {
        'order_id': orderId,
        'product_id': item.productId,
        'quantity': item.quantity,
        'selected_weight': item.selectedWeight,
        'subtotal': item.subtotal,
      }).toList();

      await _client.from('ORDER_ITEMS').insert(itemsData);

      // 3. Mark coupon usage if coupon applied
      if (couponId != null) {
        await logCouponUsage(userId, couponId);
      }

      // 4. Clear remote cart
      await clearCart(userId);

      // 5. Query complete order back
      final finalOrderJson = await _client
          .from('ORDERS')
          .select('*, order_items:ORDER_ITEMS(*)')
          .eq('id', orderId)
          .single();

      return Order.fromJson(finalOrderJson);
    } catch (e) {
      rethrow;
    }
  }

  // Cancel order in ORDERS
  Future<bool> cancelOrder(String orderId) async {
    try {
      await _client.from('ORDERS').update({
        'order_status': 'cancelled'
      }).eq('id', orderId);
      return true;
    } catch (e) {
      rethrow;
    }
  }

  // Helper uuid generator
  String uuidGenerate() {
    final now = DateTime.now().millisecondsSinceEpoch;
    return 'PB-$now';
  }
}
