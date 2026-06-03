import 'package:supabase_flutter/supabase_flutter.dart';
import '../../models/address.dart';

class AdminAddressService {
  final SupabaseClient _client = Supabase.instance.client;

  /// Fetch saved addresses of any specific customer
  Future<List<SavedAddress>> fetchUserAddresses(String userId) async {
    try {
      final response = await _client.from('addresses').select().eq('user_id', userId);
      return (response as List).map((item) => SavedAddress.fromSupabaseJson(item as Map<String, dynamic>)).toList();
    } catch (_) {
      rethrow;
    }
  }

  /// Remove address of any customer
  Future<bool> deleteUserAddress(String addressId) async {
    try {
      await _client.from('addresses').delete().eq('id', addressId);
      return true;
    } catch (_) {
      rethrow;
    }
  }
}
