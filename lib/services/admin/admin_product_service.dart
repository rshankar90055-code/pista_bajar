import 'package:supabase_flutter/supabase_flutter.dart';
import '../../models/product.dart';

class AdminProductService {
  final SupabaseClient _client = Supabase.instance.client;

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
}
