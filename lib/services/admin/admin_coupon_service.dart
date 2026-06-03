import 'package:supabase_flutter/supabase_flutter.dart';
import '../../models/offer.dart';

class AdminCouponService {
  final SupabaseClient _client = Supabase.instance.client;

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
}
