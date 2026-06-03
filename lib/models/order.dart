import 'address.dart';

class OrderItem {
  final String? orderId; // Maps to order_id
  final String productId; // Maps to product_id
  final String name; // Helper for display (can be resolved from products join)
  final double quantity; // Maps to quantity (e.g. count)
  final String selectedWeight; // Maps to selected_weight ('250g', '500g', '1kg')
  final int subtotal; // Maps to subtotal

  OrderItem({
    this.orderId,
    required this.productId,
    required this.name,
    required this.quantity,
    required this.selectedWeight,
    required this.subtotal,
  });

  // Backward compatibility helpers
  double get quantityKg {
    switch (selectedWeight) {
      case '250g':
        return 0.25 * quantity;
      case '500g':
        return 0.50 * quantity;
      case '1kg':
      default:
        return 1.0 * quantity;
    }
  }

  int get pricePerKg {
    if (quantityKg <= 0) return subtotal;
    return (subtotal / quantityKg).round();
  }

  int get lineTotal => subtotal;

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      orderId: json['order_id']?.toString(),
      productId: json['product_id']?.toString() ?? '',
      name: json['name'] as String? ?? 'Organic Dry Fruits',
      quantity: (json['quantity'] as num?)?.toDouble() ?? 1.0,
      selectedWeight: json['selected_weight'] as String? ?? '1kg',
      subtotal: (json['subtotal'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (orderId != null) 'order_id': orderId,
      'product_id': productId,
      'quantity': quantity,
      'selected_weight': selectedWeight,
      'subtotal': subtotal,
    };
  }
}

class Order {
  final String id; // Maps to id
  final String userId; // Maps to user_id
  final int totalAmount; // Maps to total_amount
  final String paymentMethod; // Maps to payment_method ('upi' | 'cash_on_delivery')
  final String orderStatus; // Maps to order_status ('new', 'delivered', etc.)
  final Address address; // Maps to address (serialized JSON/Text)
  final String timestamp; // Maps to created_at
  final List<OrderItem> items;

  // Visual/UI convenience helper properties
  final String? userName;
  final String userPhone;
  final String? deliveryOtp;
  final int? discountAmount;
  final String? discountCode;
  final bool? isGift;
  final String? giftNote;
  final bool? giftWrap;

  Order({
    required this.id,
    required this.userId,
    required this.totalAmount,
    required this.paymentMethod,
    required this.orderStatus,
    required this.address,
    required this.timestamp,
    required this.items,
    this.userName,
    required this.userPhone,
    this.deliveryOtp,
    this.discountAmount,
    this.discountCode,
    this.isGift = false,
    this.giftNote,
    this.giftWrap = false,
  });

  // UI status mapping compatibility getter
  String get status => orderStatus;

  factory Order.fromJson(Map<String, dynamic> json) {
    // Determine address representation (could be dynamic map or raw text)
    Address resolvedAddress;
    try {
      if (json['address'] is Map) {
        resolvedAddress = Address.fromJson(json['address'] as Map<String, dynamic>);
      } else if (json['address'] is String) {
        // Simple plain string parsing or custom serialization
        resolvedAddress = Address(
          addressLine: json['address'] as String,
          city: 'City',
          pinCode: '000000',
        );
      } else {
        resolvedAddress = Address(addressLine: '', city: '', pinCode: '');
      }
    } catch (_) {
      resolvedAddress = Address(addressLine: 'N/A', city: '', pinCode: '');
    }

    // Resolve items from sublist
    final List<dynamic> itemsList = json['order_items'] as List<dynamic>? ?? 
                                   json['items'] as List<dynamic>? ?? [];

    return Order(
      id: json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? '',
      totalAmount: (json['total_amount'] as num?)?.toInt() ?? 0,
      paymentMethod: json['payment_method'] as String? ?? 'upi',
      orderStatus: (json['order_status'] ?? json['status']) as String? ?? 'new',
      address: resolvedAddress,
      timestamp: (json['created_at'] ?? json['timestamp']) as String? ?? DateTime.now().toIso8601String(),
      items: itemsList.map((item) => OrderItem.fromJson(item as Map<String, dynamic>)).toList(),
      userName: json['userName'] as String? ?? 'Patron User',
      userPhone: json['userPhone'] as String? ?? '',
      deliveryOtp: json['deliveryOtp'] as String? ?? '4927',
      discountAmount: json['discountAmount'] != null ? (json['discountAmount'] as num).toInt() : 0,
      discountCode: json['discountCode'] as String?,
      isGift: json['isGift'] as bool? ?? false,
      giftNote: json['giftNote'] as String?,
      giftWrap: json['giftWrap'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'total_amount': totalAmount,
      'payment_method': paymentMethod,
      'order_status': orderStatus,
      'address': address.toJson(),
      'created_at': timestamp,
      'items': items.map((item) => item.toJson()).toList(),
      'userPhone': userPhone,
      'userName': userName,
      'deliveryOtp': deliveryOtp,
      'discountAmount': discountAmount,
      'discountCode': discountCode,
      'isGift': isGift,
      'giftNote': giftNote,
      'giftWrap': giftWrap,
    };
  }
}
