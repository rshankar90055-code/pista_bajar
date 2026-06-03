class Offer {
  final String id;
  final String code; // Maps to database 'code'
  final int discount; // Maps to database 'discount' (e.g. percentage like 10 or absolute amount)
  final int minimumOrder; // Maps to database 'minimum_order'
  final String expiryDate; // Maps to database 'expiry_date'
  final bool active; // Maps to database 'active'
  final int? usageLimit; // Maps to database 'usage_limit'
  final int? usedCount; // Maps to database 'used_count'

  Offer({
    required this.id,
    required this.code,
    required this.discount,
    required this.minimumOrder,
    required this.expiryDate,
    required this.active,
    this.usageLimit,
    this.usedCount,
  });

  // UI Helper Getters to preserve compatibility with existing screens
  String get title => "Flat $discount% Special Coupon";
  String get description => "Apply code $code to save $discount% on your organic nuts! Min order: ₹$minimumOrder.";
  String get discountCode => code;

  factory Offer.fromJson(Map<String, dynamic> json) {
    return Offer(
      id: json['id'].toString(),
      code: json['code'] as String? ?? '',
      discount: (json['discount'] as num?)?.toInt() ?? 0,
      minimumOrder: (json['minimum_order'] as num?)?.toInt() ?? 0,
      expiryDate: json['expiry_date'] as String? ?? '',
      active: json['active'] as bool? ?? false,
      usageLimit: (json['usage_limit'] ?? json['usageLimit']) != null 
          ? ((json['usage_limit'] ?? json['usageLimit']) as num).toInt() 
          : null,
      usedCount: (json['used_count'] ?? json['usedCount']) != null 
          ? ((json['used_count'] ?? json['usedCount']) as num).toInt() 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'discount': discount,
      'minimum_order': minimumOrder,
      'expiry_date': expiryDate,
      'active': active,
      'usage_limit': usageLimit,
      'used_count': usedCount,
    };
  }
}
