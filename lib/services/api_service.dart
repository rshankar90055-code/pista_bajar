import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/product.dart';
import '../models/order.dart';
import '../models/address.dart';
import '../models/offer.dart';

class ApiService {
  // Configurable base URL. Emulators use http://10.0.2.2:3000 for localhost, production uses the live Vercel domain.
  static const String baseUrl = "https://druits-olive.vercel.app";

  final http.Client client;

  ApiService({http.Client? httpClient}) : client = httpClient ?? http.Client();

  // Authentication: Send OTP
  Future<bool> sendOtp(String phone) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/api/send-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': phone}),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] as bool? ?? false;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  // Authentication: Verify OTP
  Future<Map<String, dynamic>?> verifyOtp(String phone, String otp, {String? name}) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/api/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'phone': phone,
          'otp': otp,
          if (name != null) 'name': name,
        }),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  // Fetch all dry fruit products
  Future<List<Product>> fetchProducts() async {
    try {
      final response = await client.get(Uri.parse('$baseUrl/api/products'));
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((item) => Product.fromJson(item as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  // Fetch active promotional offers/coupons
  Future<List<Offer>> fetchOffers() async {
    try {
      final response = await client.get(Uri.parse('$baseUrl/api/offers'));
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((item) => Offer.fromJson(item as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  // Address: Fetch saved addresses
  Future<List<SavedAddress>> fetchAddresses(String phone) async {
    try {
      final response = await client.get(Uri.parse('$baseUrl/api/addresses?phone=$phone'));
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((item) => SavedAddress.fromJson(item as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  // Address: Save new address
  Future<SavedAddress?> saveAddress(String phone, SavedAddress address) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/api/addresses'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'phone': phone,
          'address': address.toJson(),
        }),
      );
      if (response.statusCode == 200) {
        return SavedAddress.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  // Address: Delete address
  Future<bool> deleteAddress(String phone, String addressId) async {
    try {
      final response = await client.delete(
        Uri.parse('$baseUrl/api/addresses'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'phone': phone,
          'addressId': addressId,
        }),
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // Orders: Fetch my past transactions
  Future<List<Order>> fetchMyOrders(String phone) async {
    try {
      final response = await client.get(Uri.parse('$baseUrl/api/my-orders?phone=$phone'));
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((item) => Order.fromJson(item as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  // Orders: Create/Place order
  Future<Map<String, dynamic>?> createOrder(Map<String, dynamic> orderInput) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/api/create-order'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(orderInput),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  // Orders: Cancel order
  Future<bool> cancelOrder(String orderId, String phone) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/api/cancel-order'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'orderId': orderId,
          'phone': phone,
        }),
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // Coupons: Check coupon usage
  Future<bool> checkCouponUsed(String phone, String code) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/api/coupon-usage?phone=$phone&code=$code'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['used'] as bool? ?? false;
      }
      return false;
    } catch (_) {
      return false;
    }
  }
}
