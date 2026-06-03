class Product {
  final String id;
  final String name;
  final String description;
  final String imageUrl; // Maps to database 'image'
  final String category;
  final double stock;
  final int price250g; // Maps to database 'price_250g'
  final int price500g; // Maps to database 'price_500g'
  final int price1kg;  // Maps to database 'price_1kg'
  final double rating;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.imageUrl,
    required this.category,
    required this.stock,
    required this.price250g,
    required this.price500g,
    required this.price1kg,
    required this.rating,
  });

  bool get soldOut => stock <= 0;

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'].toString(),
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      imageUrl: (json['image'] ?? json['imageUrl']) as String? ?? '',
      category: json['category'] as String? ?? '',
      stock: (json['stock'] as num?)?.toDouble() ?? 0.0,
      price250g: (json['price_250g'] as num?)?.toInt() ?? 0,
      price500g: (json['price_500g'] as num?)?.toInt() ?? 0,
      price1kg: (json['price_1kg'] as num?)?.toInt() ?? 0,
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'image': imageUrl,
      'category': category,
      'stock': stock,
      'price_250g': price250g,
      'price_500g': price500g,
      'price_1kg': price1kg,
      'rating': rating,
    };
  }

  // Get price based on selected weight string ('250g', '500g', '1kg')
  int getPriceForWeight(String weight) {
    switch (weight) {
      case '250g':
        return price250g;
      case '500g':
        return price500g;
      case '1kg':
      default:
        return price1kg;
    }
  }

  // Helper to convert size representation for cart logic
  double getWeightInKg(String weight) {
    switch (weight) {
      case '250g':
        return 0.25;
      case '500g':
        return 0.50;
      case '1kg':
      default:
        return 1.0;
    }
  }
}
