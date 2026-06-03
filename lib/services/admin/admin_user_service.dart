import 'package:supabase_flutter/supabase_flutter.dart';

class AdminUserService {
  final SupabaseClient _client = Supabase.instance.client;

  /// Fetch list of all customer profiles
  Future<List<Map<String, dynamic>>> fetchAllUsers() async {
    try {
      final response = await _client.from('profiles').select();
      return List<Map<String, dynamic>>.from(response);
    } catch (_) {
      try {
        final fallback = await _client.from('USERS').select();
        return List<Map<String, dynamic>>.from(fallback);
      } catch (_) {
        rethrow;
      }
    }
  }

  /// Delete or remove a user profile from database
  Future<bool> deleteUserRecord(String userId) async {
    try {
      await _client.from('profiles').delete().eq('id', userId);
      await _client.from('USERS').delete().eq('id', userId);
      return true;
    } catch (_) {
      rethrow;
    }
  }
}
